import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { safeId, validateTurn, overlaps } from './domain.js';
initializeApp();
export const db=getFirestore();
// A finite instance limit caps concurrent instances; App Check also protects public calls.
const options={region:'us-central1',enforceAppCheck:true,maxInstances:5};
const hash=value => createHash('sha256').update(value).digest('hex');
const today=() => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const root=uid => db.doc(`propietarios/${safeId(uid)}`);
function fail(error) { if(error instanceof HttpsError) throw error; throw new HttpsError('failed-precondition',error.message || 'No se pudo completar la operación.'); }
function owner(request, uid) { if(!request.auth || request.auth.uid !== uid) throw new HttpsError('permission-denied','Solo el propietario puede realizar esta operación.'); }
export async function persist(uid, input, publicBooking) {
  const parent=root(uid);
  const reference=input.id ? parent.collection('turnos').doc(safeId(input.id)) : parent.collection('turnos').doc();
  const code=randomBytes(16).toString('hex').toUpperCase();
  await db.runTransaction(async tx => {
    const profile=await tx.get(parent);
    if(!profile.exists || !profile.data().config) throw new HttpsError('not-found','Agenda no encontrada.');
    const turn=validateTurn(input,profile.data().config,publicBooking ? today() : '0000-00-00');
    const previous=await tx.get(reference);
    if(publicBooking && previous.exists) throw new HttpsError('already-exists','Turno ya registrado.');
    const dayRefs=[...new Set([turn.fecha,previous.exists?previous.data().fecha:turn.fecha])].map(day=>parent.collection('locks').doc(day));
    for(const lock of dayRefs) await tx.get(lock);
    const block=await tx.get(parent.collection('bloqueos').doc(turn.fecha));
    if(block.exists && turn.estado !== 'cancelado') throw new HttpsError('failed-precondition','La fecha está bloqueada.');
    const dayTurns=await tx.get(parent.collection('turnos').where('fecha','==',turn.fecha));
    if(dayTurns.docs.some(d=>d.id!==reference.id && overlaps(turn,d.data()))) throw new HttpsError('already-exists','El horario acaba de ser ocupado. Elegí otro.');
    const previousData=previous.exists?previous.data():{};
    // Explicitly select fields: never trust client-supplied cancellation codes or private metadata.
    const saved={id:reference.id,fecha:turn.fecha,hora:turn.hora,duracion:turn.duracion,
      clienteNombre:turn.clienteNombre,clienteTel:turn.clienteTel,
      motivo:String(turn.motivo || '').slice(0,500),estado:publicBooking?'pendiente':turn.estado,
      notas:publicBooking?'':String(turn.notas || '').slice(0,1000),
      precio:publicBooking?Number(profile.data().config.precioBase)||0:Number(turn.precio)||0,
      pagado:publicBooking?false:turn.pagado===true,
      creadoEn:previousData.creadoEn||today(),
      cancelHash:previousData.cancelHash||hash(code)};
    if(!['pendiente','confirmado','cancelado','completado','ausente'].includes(saved.estado) || !Number.isFinite(saved.precio) || saved.precio<0) throw new HttpsError('invalid-argument','Estado o precio inválido.');
    tx.set(reference,saved);
    const publicRef=parent.collection('ocupados').doc(reference.id);
    if(saved.estado==='cancelado') tx.delete(publicRef);
    else tx.set(publicRef,{fecha:saved.fecha,hora:saved.hora,duracion:saved.duracion});
    dayRefs.forEach(lock=>tx.set(lock,{updatedAt:FieldValue.serverTimestamp()}));
  });
  return {id:reference.id,...(publicBooking?{cancelCode:code}:{})};
}
export const reservarTurno=onCall(options,async request=> {
  try { const {propietarioId,turno}=request.data||{}; safeId(propietarioId); return await persist(propietarioId,{...turno,id:undefined,estado:'pendiente'},true); } catch(error) { fail(error); }
});
export const guardarTurno=onCall(options,async request=> {
  try { const {propietarioId,turno}=request.data||{}; safeId(propietarioId); owner(request,propietarioId); return await persist(propietarioId,turno,false); } catch(error) { fail(error); }
});
export const cancelarTurno=onCall(options,async request=> {
  try {
    const {propietarioId,turnoId,codigo}=request.data||{};
    if(typeof codigo!=='string' || !/^[0-9A-F]{32}$/.test(codigo)) throw new HttpsError('invalid-argument','Código inválido.');
    const parent=root(propietarioId), ref=parent.collection('turnos').doc(safeId(turnoId));
    await db.runTransaction(async tx=> {
      const turn=await tx.get(ref);
      if(!turn.exists) throw new HttpsError('not-found','Turno o código incorrectos.');
      const stored=turn.data().cancelHash;
      if(typeof stored!=='string' || stored.length!==64 || !timingSafeEqual(Buffer.from(stored,'hex'),Buffer.from(hash(codigo),'hex'))) throw new HttpsError('permission-denied','Turno o código incorrectos.');
      const lock=parent.collection('locks').doc(turn.data().fecha); await tx.get(lock);
      tx.update(ref,{estado:'cancelado'}); tx.delete(parent.collection('ocupados').doc(turnoId));
      tx.set(lock,{updatedAt:FieldValue.serverTimestamp()});
    });
    return {ok:true};
  } catch(error) { fail(error); }
});
export const eliminarTurno=onCall(options,async request=> {
  try {
    const {propietarioId,turnoId}=request.data||{}; safeId(propietarioId); owner(request,propietarioId);
    const parent=root(propietarioId), ref=parent.collection('turnos').doc(safeId(turnoId));
    await db.runTransaction(async tx=> {
      const turn=await tx.get(ref); if(!turn.exists) return;
      const lock=parent.collection('locks').doc(turn.data().fecha); await tx.get(lock);
      tx.delete(ref); tx.delete(parent.collection('ocupados').doc(turnoId)); tx.set(lock,{updatedAt:FieldValue.serverTimestamp()});
    });
    return {ok:true};
  } catch(error) { fail(error); }
});


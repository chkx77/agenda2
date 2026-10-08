import {
  doc, collection, getDocs, getDoc,
  setDoc, deleteDoc, onSnapshot, query, where,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions(db.app, 'us-central1');
async function call(name, data) {
  if (!import.meta.env.VITE_APP_CHECK_SITE_KEY) throw new Error('La agenda necesita completar la configuración antes de aceptar turnos.');
  const result = await httpsCallable(functions, name)(data); return result.data;
}

// Estructura:
// /propietarios/{uid}           ← doc raíz, guarda { config }
// /propietarios/{uid}/turnos/{id}
// /propietarios/{uid}/bloqueos/{fecha}

// ── Config ───────────────────────────────────────────────────
export async function getConfig(uid) {
  const snap = await getDoc(doc(db, "propietarios", uid));
  return snap.exists() ? snap.data()?.config || null : null;
}
export async function saveConfig(uid, config) {
  await setDoc(doc(db, "propietarios", uid), { config }, { merge: true });
}

// ── Turnos ────────────────────────────────────────────────────
export async function getTurnos(uid) {
  const snap = await getDocs(collection(db, "propietarios", uid, "turnos"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function saveTurno(uid, turno) {
  return call("guardarTurno", { propietarioId: uid, turno });
}
export async function deleteTurno(uid, id) {
  return call("eliminarTurno", { propietarioId: uid, turnoId: id });
}
export function listenTurnos(uid, cb) {
  return onSnapshot(collection(db, "propietarios", uid, "turnos"), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Turnos públicos (sin auth) ────────────────────────────────
export async function reservarTurno(uid, turno) {
  return call('reservarTurno', {propietarioId:uid, turno});
}
export async function getTurnosByFecha(uid, fecha) {
  const snap = await getDocs(
    query(collection(db, "propietarios", uid, "turnos"), where("fecha", "==", fecha))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function cancelarPorCodigo(uid, turnoId, codigo) {
  return call('cancelarTurno', {propietarioId:uid, turnoId, codigo});
}

// ── Bloqueos ──────────────────────────────────────────────────
export async function getBloqueos(uid) {
  const snap = await getDocs(collection(db, "propietarios", uid, "bloqueos"));
  return snap.docs.map(d => d.id);
}
export async function bloquearFecha(uid, fecha) {
  await setDoc(doc(db, "propietarios", uid, "bloqueos", fecha), { fecha });
}
export async function desbloquearFecha(uid, fecha) {
  await deleteDoc(doc(db, "propietarios", uid, "bloqueos", fecha));
}
export function listenBloqueos(uid, cb) {
  return onSnapshot(collection(db, "propietarios", uid, "bloqueos"), snap => {
    cb(snap.docs.map(d => d.id));
  });
}

// ── Perfil público (sin auth) ─────────────────────────────────
export async function getPerfilPublico(uid) {
  const snap = await getDoc(doc(db, "propietarios", uid));
  return snap.exists() ? snap.data()?.config || null : null;
}
export async function getTurnosPublicos(uid, fecha) {
  const snapshot = await getDocs(query(collection(db, 'propietarios', uid, 'ocupados'), where('fecha', '==', fecha)));
  return snapshot.docs.map(d => ({id:d.id, ...d.data()}));
}
export async function getBloqueosFecha(uid) {
  return getBloqueos(uid);
}

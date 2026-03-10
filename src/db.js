import {
  doc, collection, getDocs, getDoc,
  setDoc, deleteDoc, onSnapshot, query, where,
} from "firebase/firestore";
import { db } from "./firebase.js";

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
  await setDoc(doc(db, "propietarios", uid, "turnos", turno.id), turno);
}
export async function deleteTurno(uid, id) {
  await deleteDoc(doc(db, "propietarios", uid, "turnos", id));
}
export function listenTurnos(uid, cb) {
  return onSnapshot(collection(db, "propietarios", uid, "turnos"), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Turnos públicos (sin auth) ────────────────────────────────
export async function reservarTurno(uid, turno) {
  await setDoc(doc(db, "propietarios", uid, "turnos", turno.id), turno);
}
export async function getTurnosByFecha(uid, fecha) {
  const snap = await getDocs(
    query(collection(db, "propietarios", uid, "turnos"), where("fecha", "==", fecha))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function cancelarPorCodigo(uid, turnoId, codigo) {
  const ref = doc(db, "propietarios", uid, "turnos", turnoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, msg: "Turno no encontrado." };
  const data = snap.data();
  if (data.cancelCode !== codigo) return { ok: false, msg: "Código incorrecto." };
  if (data.estado === "cancelado") return { ok: false, msg: "Este turno ya fue cancelado." };
  await setDoc(ref, { ...data, estado: "cancelado" });
  return { ok: true };
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
  return getTurnosByFecha(uid, fecha);
}
export async function getBloqueosFecha(uid) {
  return getBloqueos(uid);
}

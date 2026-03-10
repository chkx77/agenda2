// ============================================================
//  helpers.js — Constantes y utilidades compartidas
// ============================================================

export const T = {
  bg:"#E8E0D0", bgDark:"#D4C9B4", surface:"#F2EDE3",
  sidebar:"#2C3A35", sidebarMid:"#3D4F48",
  text:"#1E2420", textMid:"#4A5A54", textLight:"#7A8A83", textInv:"#F2EDE3",
  accent:"#2C3A35", red:"#B85C4A", amber:"#C49A3C",
  teal:"#4A7C74", sage:"#6B8C6E", slate:"#7A8898", cream:"#D9C98A",
  border:"#B8AF9E", borderDk:"#8A7E6E",
};

export const STATUS = {
  pendiente:"Pendiente", confirmado:"Confirmado",
  cancelado:"Cancelado", completado:"Completado", ausente:"Ausente",
};
export const STATUS_COLOR = {
  pendiente:T.amber, confirmado:T.teal,
  cancelado:T.red, completado:T.sage, ausente:T.slate,
};

export const MONTHS       = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const DAYS_FULL    = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
export const DAYS_SHORT   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

export const DEFAULT_CONFIG = {
  nombre: "Mi Consultorio",
  especialidad: "Profesional",
  descripcion: "",
  duracionTurno: 60,       // minutos
  horaInicio: "08:00",
  horaFin: "20:00",
  diasHabiles: [1,2,3,4,5], // 0=Dom … 6=Sáb
  precioBase: "",
  publicLink: "",           // se genera al crear la cuenta
};

export function uid()      { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
export function todayStr() { return new Date().toISOString().split("T")[0]; }

export function addDays(s, n) {
  const d = new Date(s + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
}
export function fmtDateLong(d) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return `${DAYS_FULL[dt.getDay()]} ${dt.getDate()} de ${MONTHS[dt.getMonth()]}`;
}

export function getMonthDates(ym) {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m-1, 1), last = new Date(y, m, 0), dates = [];
  for (let i = 1; i <= last.getDate(); i++)
    dates.push(`${y}-${String(m).padStart(2,"0")}-${String(i).padStart(2,"0")}`);
  return { dates, startDow: first.getDay() };
}

export function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

/** Genera slots de tiempo cada `duracion` minutos entre horaInicio y horaFin */
export function timeSlots(horaInicio = "08:00", horaFin = "20:00", duracion = 60) {
  const slots = [];
  const [sh, sm] = horaInicio.split(":").map(Number);
  const [eh, em] = horaFin.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + duracion <= end) {
    slots.push(`${String(Math.floor(cur/60)).padStart(2,"0")}:${String(cur%60).padStart(2,"0")}`);
    cur += duracion;
  }
  return slots;
}

export function initials(name) {
  return name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
}

// Genera código corto de cancelación (6 chars)
export function cancelCode() {
  return Math.random().toString(36).slice(2,8).toUpperCase();
}

// CSV
export function toCSV(rows, headers) {
  const esc = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
  return [
    headers.map(h => esc(h.label)).join(","),
    ...rows.map(r => headers.map(h => esc(typeof h.fn==="function" ? h.fn(r) : r[h.key])).join(","))
  ].join("\n");
}
export function downloadCSV(content, filename) {
  const blob = new Blob(["\uFEFF"+content], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

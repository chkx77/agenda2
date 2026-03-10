// ============================================================
//  ui.jsx — Componentes de UI compartidos
// ============================================================
import { useEffect } from "react";
import { T, STATUS, STATUS_COLOR } from "./helpers.js";
export { T, STATUS, STATUS_COLOR };

export const inp = {
  width:"100%", padding:"0.55rem 0.85rem",
  border:`2px solid ${T.border}`, borderRadius:0,
  fontSize:"0.875rem", fontFamily:"inherit", color:T.text,
  background:T.surface, outline:"none", boxSizing:"border-box",
};

export function Btn({ children, onClick, variant="primary", size="md", icon, disabled, loading, style:sx={} }) {
  const sizes = {
    sm: { padding:"0.35rem 0.85rem", fontSize:"0.75rem" },
    md: { padding:"0.55rem 1.2rem",  fontSize:"0.83rem" },
    lg: { padding:"0.7rem 1.6rem",   fontSize:"0.9rem"  },
  };
  const vars = {
    primary:   { background:T.accent, color:T.textInv, border:`2px solid ${T.accent}` },
    secondary: { background:"transparent", color:T.text, border:`2px solid ${T.borderDk}` },
    ghost:     { background:"transparent", color:T.textMid, border:"2px solid transparent" },
    danger:    { background:T.red, color:"#fff", border:`2px solid ${T.red}` },
    teal:      { background:T.teal, color:"#fff", border:`2px solid ${T.teal}` },
  };
  return (
    <button
      onClick={disabled||loading ? undefined : onClick}
      style={{
        display:"inline-flex", alignItems:"center", gap:"0.4rem",
        cursor: disabled||loading ? "not-allowed" : "pointer",
        fontFamily:"inherit", fontWeight:700,
        textTransform:"uppercase", letterSpacing:"0.06em",
        opacity: disabled||loading ? 0.5 : 1,
        borderRadius:0, transition:"all 0.1s",
        ...sizes[size], ...vars[variant], ...sx,
      }}
    >
      {icon && <Ic n={icon} s={13} />}
      {loading ? "Cargando..." : children}
    </button>
  );
}

export function StatusBadge({ estado }) {
  const c = STATUS_COLOR[estado] || T.textMid;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", fontSize:"0.65rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:c, border:`2px solid ${c}`, padding:"2px 8px", borderRadius:0 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c, flexShrink:0, display:"inline-block" }} />
      {STATUS[estado] || estado}
    </span>
  );
}

export function TagPill({ label, color=T.teal }) {
  return <span style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color, background:color+"22", border:`1.5px solid ${color}`, padding:"2px 7px", borderRadius:0 }}>{label}</span>;
}

export function SectionLabel({ children, color=T.textLight }) {
  return <div style={{ fontSize:"0.62rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.14em", color, marginBottom:"0.5rem" }}>{children}</div>;
}

export function Modal({ open, onClose, title, children, width=480 }) {
  useEffect(() => {
    if (!open) return;
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(28,32,26,0.6)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={onClose}>
      <div style={{ background:T.surface, width:"100%", maxWidth:width, maxHeight:"92vh", overflowY:"auto", border:`3px solid ${T.accent}`, boxShadow:`6px 6px 0 ${T.accent}`, animation:"mIn .15s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ background:T.accent, padding:"0.9rem 1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"0.75rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.12em", color:T.textInv }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.textInv, display:"flex", padding:"2px" }}><Ic n="x" s={16} /></button>
        </div>
        <div style={{ padding:"1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

export function Fld({ label, children, req, hint }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <div style={{ fontSize:"0.62rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textMid, marginBottom:"0.35rem" }}>
        {label}{req && <span style={{ color:T.red, marginLeft:"2px" }}>*</span>}
        {hint && <span style={{ fontWeight:500, textTransform:"none", letterSpacing:0, marginLeft:"6px", color:T.textLight }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type === "success" ? T.accent : toast.type === "info" ? T.teal : T.red;
  return (
    <div style={{ position:"fixed", top:"1rem", right:"1rem", zIndex:9999, padding:"0.65rem 1.1rem", background:bg, color:"#fff", fontSize:"0.75rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", boxShadow:`4px 4px 0 rgba(0,0,0,0.25)`, animation:"tIn 0.18s ease", display:"flex", alignItems:"center", gap:"0.5rem", border:"2px solid rgba(255,255,255,0.2)" }}>
      <Ic n={toast.type === "success" ? "check" : "info"} s={14} />{toast.msg}
    </div>
  );
}

export function PageLoader({ text = "Cargando..." }) {
  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Archivo Black',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"2rem", fontWeight:900, color:T.accent, letterSpacing:"-0.02em" }}>AGENDA PRO</div>
        <div style={{ fontSize:"0.65rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.16em", color:T.textLight, marginTop:"6px" }}>{text}</div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────
const IC = {
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><rect x="3" y="4" width="18" height="18" rx="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bell:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chart:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  plus:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  chevL:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><polyline points="9 18 15 12 9 6"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  clock:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"><polyline points="20 6 9 17 4 12"/></svg>,
  search:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  link:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  lock:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><rect x="3" y="11" width="18" height="11" rx="0"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  unlock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><rect x="3" y="11" width="18" height="11" rx="0"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  copy:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><rect x="9" y="9" width="13" height="13" rx="0"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  phone:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.67 4.9 2 2 0 0 1 3.64 2.68h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  info:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  save:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
};
export function Ic({ n, s=18, c }) {
  return <span style={{ display:"inline-flex", width:s, height:s, flexShrink:0, color:c||"currentColor" }}>{IC[n]}</span>;
}

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',-apple-system,sans-serif;}
  @keyframes mIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes tIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#8A7E6E;border-radius:0}
  input:focus,select:focus,textarea:focus{border-color:#2C3A35!important;outline:none}
  button:active{transform:scale(0.97)}
  select option{background:#F2EDE3}
`;

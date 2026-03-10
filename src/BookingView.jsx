// ============================================================
//  BookingView.jsx — Vista pública para clientes
//  URL: /turno/{uid}
//  Sin login. El cliente elige fecha → hora → pone nombre y tel.
// ============================================================
import { useState, useEffect } from "react";
import {
  getPerfilPublico, getBloqueosFecha,
  getTurnosPublicos, reservarTurno, cancelarPorCodigo,
} from "./db.js";
import {
  T, GLOBAL_STYLES, Btn, Fld, inp, Ic, Modal,
} from "./ui.jsx";
import {
  uid, cancelCode, todayStr, addDays, fmtDate, fmtDateLong,
  getMonthDates, currentYearMonth, timeSlots,
  MONTHS, MONTHS_SHORT, DAYS_SHORT, DAYS_FULL,
} from "./helpers.js";

/* ── Pequeño calendario de selección de fecha ── */
function CalendarioPicker({ yearMonth, onChangeMonth, selectedDate, onSelectDate, bloqueos, diasHabiles, turnosPorFecha }) {
  const { dates, startDow } = getMonthDates(yearMonth);
  const blanks = Array.from({ length: startDow });
  const hoy = todayStr();

  return (
    <div>
      {/* Navegación mes */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.75rem" }}>
        <button onClick={() => onChangeMonth(-1)} style={{ background:"none", border:`2px solid ${T.border}`, padding:"0.3rem 0.5rem", cursor:"pointer", display:"flex", color:T.textMid }}><Ic n="chevL" s={16}/></button>
        <div style={{ fontWeight:900, fontSize:"1rem", color:T.text, fontFamily:"'Archivo Black',sans-serif", textTransform:"uppercase", letterSpacing:"0.05em" }}>
          {MONTHS[parseInt(yearMonth.split("-")[1])-1]} {yearMonth.split("-")[0]}
        </div>
        <button onClick={() => onChangeMonth(1)} style={{ background:"none", border:`2px solid ${T.border}`, padding:"0.3rem 0.5rem", cursor:"pointer", display:"flex", color:T.textMid }}><Ic n="chevR" s={16}/></button>
      </div>

      {/* Header días */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"2px" }}>
        {DAYS_SHORT.map(d => <div key={d} style={{ textAlign:"center", fontSize:"0.58rem", fontWeight:900, color:T.textLight, textTransform:"uppercase", letterSpacing:"0.08em", padding:"4px 0" }}>{d}</div>)}
      </div>

      {/* Días */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px" }}>
        {blanks.map((_,i) => <div key={"b"+i} />)}
        {dates.map(date => {
          const dt = new Date(date + "T00:00:00");
          const dow = dt.getDay();
          const isPast    = date < hoy;
          const isBlocked = bloqueos.includes(date);
          const isDisabled= !diasHabiles.includes(dow) || isPast || isBlocked;
          const isSel     = date === selectedDate;
          const isHoy     = date === hoy;
          const count     = turnosPorFecha[date] || 0;

          return (
            <div key={date}
              onClick={() => !isDisabled && onSelectDate(date)}
              style={{
                minHeight:"44px", padding:"4px", textAlign:"center",
                cursor: isDisabled ? "not-allowed" : "pointer",
                background: isSel ? T.accent : isHoy ? T.bgDark : T.surface,
                border: isSel ? `2px solid ${T.accent}` : isHoy ? `2px solid ${T.amber}` : `2px solid ${T.border}`,
                opacity: isDisabled ? 0.35 : 1,
                transition:"background 0.1s",
              }}
              onMouseEnter={e => { if(!isDisabled && !isSel) e.currentTarget.style.background = T.bgDark; }}
              onMouseLeave={e => { if(!isDisabled && !isSel) e.currentTarget.style.background = isHoy ? T.bgDark : T.surface; }}
            >
              <div style={{ fontSize:"0.82rem", fontWeight:900, color:isSel?T.textInv:isHoy?T.amber:T.text, fontFamily:"'Archivo Black',sans-serif" }}>{dt.getDate()}</div>
              {count > 0 && !isDisabled && (
                <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:isSel?T.cream:T.teal, margin:"2px auto 0" }}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Selector de horario ── */
function HorarioSelector({ slots, ocupados, selected, onSelect }) {
  if (!slots.length) return <div style={{ color:T.textLight, fontSize:"0.85rem", padding:"1rem 0", fontWeight:600 }}>No hay horarios disponibles para este día.</div>;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))", gap:"0.4rem" }}>
      {slots.map(slot => {
        const ocupado = ocupados.includes(slot);
        const isSel   = slot === selected;
        return (
          <button key={slot}
            onClick={() => !ocupado && onSelect(slot)}
            disabled={ocupado}
            style={{
              padding:"0.6rem 0.5rem", border:`2px solid ${isSel?T.accent:ocupado?T.border:T.borderDk}`,
              background: isSel ? T.accent : ocupado ? T.bgDark : T.surface,
              color: isSel ? T.textInv : ocupado ? T.textLight : T.text,
              fontFamily:"'Archivo Black',sans-serif", fontWeight:900, fontSize:"0.85rem",
              cursor: ocupado ? "not-allowed" : "pointer", borderRadius:0,
              textDecoration: ocupado ? "line-through" : "none",
              opacity: ocupado ? 0.5 : 1, transition:"all 0.1s",
            }}
          >{slot}</button>
        );
      })}
    </div>
  );
}

/* ── Formulario de datos del cliente ── */
function FormDatos({ fecha, hora, duracion, onConfirm, onBack, loading }) {
  const [nombre, setNombre] = useState("");
  const [tel, setTel]       = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError]   = useState("");

  const handleSubmit = () => {
    if (!nombre.trim() || !tel.trim()) { setError("Nombre y teléfono son obligatorios."); return; }
    onConfirm({ nombre: nombre.trim(), tel: tel.trim(), motivo: motivo.trim() });
  };

  return (
    <div>
      <div style={{ background:T.bgDark, border:`2px solid ${T.border}`, padding:"0.85rem 1rem", marginBottom:"1.25rem" }}>
        <div style={{ fontSize:"0.6rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textLight, marginBottom:"3px" }}>Tu turno</div>
        <div style={{ fontWeight:900, fontSize:"1rem", color:T.text, fontFamily:"'Archivo Black',sans-serif" }}>{fmtDateLong(fecha)} · {hora}</div>
        <div style={{ fontSize:"0.78rem", color:T.textMid, marginTop:"2px" }}>Duración: {duracion} minutos</div>
      </div>

      <Fld label="Nombre y apellido" req>
        <input style={inp} value={nombre} onChange={e => { setNombre(e.target.value); setError(""); }} placeholder="María González" autoFocus />
      </Fld>
      <Fld label="Teléfono / WhatsApp" req>
        <input style={inp} value={tel} onChange={e => { setTel(e.target.value); setError(""); }} placeholder="11-XXXX-XXXX" />
      </Fld>
      <Fld label="Motivo de consulta" hint="(opcional)">
        <input style={inp} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Breve descripción..." />
      </Fld>

      {error && <div style={{ background:"#FDF0EE", border:`2px solid ${T.red}`, padding:"0.6rem 0.8rem", marginBottom:"1rem", fontSize:"0.8rem", color:T.red, fontWeight:600 }}>{error}</div>}

      <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end", flexWrap:"wrap" }}>
        <Btn variant="secondary" onClick={onBack}>← Volver</Btn>
        <Btn onClick={handleSubmit} loading={loading}>Confirmar turno</Btn>
      </div>
    </div>
  );
}

/* ── Pantalla de confirmación final ── */
function Confirmacion({ turno, perfil, onNuevoTurno }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard?.writeText(turno.cancelCode);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div style={{ textAlign:"center", padding:"1rem 0" }}>
      <div style={{ width:"56px", height:"56px", background:T.teal, display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
        <Ic n="check" s={28} c="#fff" />
      </div>
      <div style={{ fontSize:"1.3rem", fontWeight:900, color:T.text, fontFamily:"'Archivo Black',sans-serif", marginBottom:"0.5rem" }}>¡Turno confirmado!</div>
      <p style={{ color:T.textMid, fontSize:"0.88rem", marginBottom:"1.5rem" }}>
        <strong>{fmtDateLong(turno.fecha)}</strong> a las <strong>{turno.hora}</strong>
        <br/>con {perfil.nombre}
      </p>

      {/* Código de cancelación */}
      <div style={{ background:T.bgDark, border:`3px solid ${T.borderDk}`, padding:"1.25rem", marginBottom:"1.5rem" }}>
        <div style={{ fontSize:"0.6rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.12em", color:T.textLight, marginBottom:"0.5rem" }}>
          Código para cancelar tu turno
        </div>
        <div style={{ fontFamily:"'Archivo Black',sans-serif", fontSize:"2rem", fontWeight:900, letterSpacing:"0.15em", color:T.accent, marginBottom:"0.5rem" }}>
          {turno.cancelCode}
        </div>
        <div style={{ fontSize:"0.75rem", color:T.textMid, marginBottom:"0.75rem" }}>
          Guardá este código. Lo vas a necesitar si querés cancelar.
        </div>
        <Btn variant="secondary" size="sm" icon="copy" onClick={copiar}>
          {copiado ? "¡Copiado!" : "Copiar código"}
        </Btn>
      </div>

      <Btn variant="secondary" onClick={onNuevoTurno}>Sacar otro turno</Btn>
    </div>
  );
}

/* ── Cancelar turno ── */
function CancelarTurno({ propietarioId, onClose }) {
  const [turnoId, setTurnoId] = useState("");
  const [codigo,  setCodigo]  = useState("");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState(null);

  const handleCancelar = async () => {
    if (!turnoId.trim() || !codigo.trim()) { setMsg({ ok:false, msg:"Completá ambos campos." }); return; }
    setLoading(true);
    const res = await cancelarPorCodigo(propietarioId, turnoId.trim(), codigo.trim().toUpperCase());
    setMsg(res);
    setLoading(false);
  };

  return (
    <div>
      <p style={{ color:T.textMid, fontSize:"0.85rem", marginBottom:"1.25rem" }}>
        Ingresá el ID de tu turno y el código que recibiste al reservar.
      </p>
      <Fld label="ID del turno">
        <input style={inp} value={turnoId} onChange={e => setTurnoId(e.target.value)} placeholder="ej: abc123xyz"/>
      </Fld>
      <Fld label="Código de cancelación">
        <input style={inp} value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="ej: A1B2C3" style={{...inp, textTransform:"uppercase"}}/>
      </Fld>

      {msg && (
        <div style={{ background:msg.ok?"#EFF7F5":"#FDF0EE", border:`2px solid ${msg.ok?T.teal:T.red}`, padding:"0.6rem 0.8rem", marginBottom:"1rem", fontSize:"0.8rem", color:msg.ok?T.teal:T.red, fontWeight:600 }}>
          {msg.ok ? "✓ Tu turno fue cancelado exitosamente." : msg.msg}
        </div>
      )}

      <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cerrar</Btn>
        {!msg?.ok && <Btn variant="danger" onClick={handleCancelar} loading={loading}>Cancelar turno</Btn>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN BookingView
══════════════════════════════════════════════════════════════ */
export default function BookingView({ propietarioId }) {
  const [perfil,      setPerfil]      = useState(null);
  const [bloqueos,    setBloqueos]    = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [noEncontrado,setNoEncontrado]= useState(false);

  // Pasos: "calendario" | "horario" | "datos" | "confirmado"
  const [paso,        setPaso]        = useState("calendario");
  const [yearMonth,   setYearMonth]   = useState(currentYearMonth());
  const [fechaSel,    setFechaSel]    = useState(null);
  const [horaSel,     setHoraSel]     = useState(null);
  const [slotsOcupados, setSlotsOcupados] = useState([]);
  const [turnosPorFecha, setTurnosPorFecha] = useState({});
  const [turnoCreado, setTurnoCreado] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);

  // Cargar perfil y bloqueos
  useEffect(() => {
    (async () => {
      const p = await getPerfilPublico(propietarioId);
      if (!p) { setNoEncontrado(true); setCargando(false); return; }
      setPerfil(p);
      const b = await getBloqueosFecha(propietarioId);
      setBloqueos(b);
      setCargando(false);
    })();
  }, [propietarioId]);

  // Cargar turnos del mes para marcar días con actividad
  useEffect(() => {
    if (!perfil) return;
    // Simple: cargar todos los turnos y agrupar por fecha
    // (En producción grande, mejor query por rango)
    (async () => {
      const [y, m] = yearMonth.split("-").map(Number);
      const { dates } = getMonthDates(yearMonth);
      const counts = {};
      await Promise.all(dates.map(async (fecha) => {
        const ts = await getTurnosPublicos(propietarioId, fecha);
        const activos = ts.filter(t => t.estado !== "cancelado");
        if (activos.length) counts[fecha] = activos.length;
      }));
      setTurnosPorFecha(counts);
    })();
  }, [yearMonth, perfil, propietarioId]);

  // Al seleccionar fecha, cargar slots ocupados
  const handleSelectFecha = async (fecha) => {
    setFechaSel(fecha);
    const ts = await getTurnosPublicos(propietarioId, fecha);
    const ocupados = ts.filter(t => t.estado !== "cancelado").map(t => t.hora);
    setSlotsOcupados(ocupados);
    setPaso("horario");
  };

  const handleSelectHora = (hora) => {
    setHoraSel(hora);
    setPaso("datos");
  };

  const handleConfirmar = async ({ nombre, tel, motivo }) => {
    setSaving(true);
    const id = uid();
    const code = cancelCode();
    const turno = {
      id, fecha: fechaSel, hora: horaSel,
      duracion: perfil.duracionTurno || 60,
      clienteNombre: nombre, clienteTel: tel,
      motivo: motivo || "",
      estado: "pendiente",
      cancelCode: code,
      creadoEn: todayStr(),
      propietarioId,
    };
    await reservarTurno(propietarioId, turno);
    setTurnoCreado(turno);
    setPaso("confirmado");
    setSaving(false);
  };

  const changeMonth = (dir) => {
    const [y, m] = yearMonth.split("-").map(Number);
    const d = new Date(y, m-1+dir, 1);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  };

  const resetear = () => {
    setPaso("calendario");
    setFechaSel(null); setHoraSel(null);
    setTurnoCreado(null);
  };

  // ── Render guards ──
  if (cargando) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Archivo Black',sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ textAlign:"center", color:T.textLight }}>
        <div style={{ fontSize:"1.5rem", fontWeight:900, color:T.accent }}>AGENDA PRO</div>
        <div style={{ fontSize:"0.65rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", marginTop:"6px" }}>Cargando...</div>
      </div>
    </div>
  );

  if (noEncontrado) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:"1rem" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem", opacity:0.3 }}>◈</div>
        <div style={{ fontSize:"1.2rem", fontWeight:900, color:T.text, fontFamily:"'Archivo Black',sans-serif" }}>Perfil no encontrado</div>
        <div style={{ color:T.textLight, marginTop:"0.5rem", fontSize:"0.85rem" }}>El link de reserva no es válido.</div>
      </div>
    </div>
  );

  const slots = timeSlots(perfil.horaInicio, perfil.horaFin, perfil.duracionTurno || 60);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Header */}
      <div style={{ background:T.sidebar, borderBottom:`3px solid ${T.accent}`, padding:"1rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
        <div>
          <div style={{ fontSize:"1.1rem", fontWeight:900, color:T.textInv, fontFamily:"'Archivo Black',sans-serif", lineHeight:1 }}>{perfil.nombre}</div>
          <div style={{ fontSize:"0.62rem", fontWeight:800, color:T.cream, textTransform:"uppercase", letterSpacing:"0.1em", opacity:0.7, marginTop:"2px" }}>{perfil.especialidad}</div>
        </div>
        <button onClick={() => setModalCancelar(true)} style={{ background:"transparent", border:`2px solid rgba(255,255,255,0.25)`, padding:"0.4rem 0.9rem", cursor:"pointer", color:"rgba(255,255,255,0.6)", fontFamily:"inherit", fontWeight:700, fontSize:"0.72rem", textTransform:"uppercase", letterSpacing:"0.07em", borderRadius:0 }}>
          Cancelar turno
        </button>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth:"640px", margin:"0 auto", padding:"2rem 1rem" }}>

        {/* Descripción del profesional */}
        {perfil.descripcion && paso === "calendario" && (
          <div style={{ background:T.surface, border:`2px solid ${T.border}`, padding:"0.9rem 1rem", marginBottom:"1.5rem", fontSize:"0.85rem", color:T.textMid, lineHeight:1.6 }}>
            {perfil.descripcion}
          </div>
        )}

        {/* Info duración */}
        {paso === "calendario" && (
          <div style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
            {[
              { label:"Duración del turno", value:`${perfil.duracionTurno || 60} min` },
              { label:"Días disponibles", value: (perfil.diasHabiles||[1,2,3,4,5]).map(d => DAYS_SHORT[d]).join(" · ") },
              { label:"Horario", value:`${perfil.horaInicio} – ${perfil.horaFin}` },
              ...(perfil.precioBase ? [{ label:"Precio", value:`$${perfil.precioBase}` }] : []),
            ].map(x => (
              <div key={x.label} style={{ background:T.surface, border:`2px solid ${T.border}`, padding:"0.6rem 0.9rem", flex:"1 1 120px" }}>
                <div style={{ fontSize:"0.58rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textLight, marginBottom:"2px" }}>{x.label}</div>
                <div style={{ fontWeight:800, color:T.text, fontSize:"0.88rem" }}>{x.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Card principal */}
        <div style={{ background:T.surface, border:`3px solid ${T.accent}`, boxShadow:`4px 4px 0 ${T.borderDk}` }}>
          {/* Step indicator */}
          {paso !== "confirmado" && (
            <div style={{ background:T.accent, padding:"0.7rem 1.25rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
              {[["calendario","1. Elegí fecha"],["horario","2. Elegí horario"],["datos","3. Tus datos"]].map(([p,l],i) => (
                <span key={p} style={{ fontSize:"0.65rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.08em", color: paso===p ? T.cream : "rgba(255,255,255,0.4)", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                  {i > 0 && <span style={{ color:"rgba(255,255,255,0.25)", margin:"0 2px" }}>→</span>}
                  {l}
                </span>
              ))}
            </div>
          )}

          <div style={{ padding:"1.5rem" }}>
            {/* PASO 1: Calendario */}
            {paso === "calendario" && (
              <CalendarioPicker
                yearMonth={yearMonth}
                onChangeMonth={changeMonth}
                selectedDate={fechaSel}
                onSelectDate={handleSelectFecha}
                bloqueos={bloqueos}
                diasHabiles={perfil.diasHabiles || [1,2,3,4,5]}
                turnosPorFecha={turnosPorFecha}
              />
            )}

            {/* PASO 2: Horarios */}
            {paso === "horario" && (
              <div>
                <div style={{ marginBottom:"1rem" }}>
                  <div style={{ fontSize:"0.6rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textLight, marginBottom:"3px" }}>Fecha seleccionada</div>
                  <div style={{ fontWeight:900, fontSize:"1.05rem", color:T.text, fontFamily:"'Archivo Black',sans-serif" }}>{fmtDateLong(fechaSel)}</div>
                </div>
                <div style={{ marginBottom:"1.25rem" }}>
                  <div style={{ fontSize:"0.62rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textMid, marginBottom:"0.6rem" }}>Horarios disponibles</div>
                  <HorarioSelector slots={slots} ocupados={slotsOcupados} selected={horaSel} onSelect={handleSelectHora} />
                </div>
                <Btn variant="secondary" size="sm" onClick={() => setPaso("calendario")}>← Cambiar fecha</Btn>
              </div>
            )}

            {/* PASO 3: Datos */}
            {paso === "datos" && (
              <FormDatos fecha={fechaSel} hora={horaSel} duracion={perfil.duracionTurno||60}
                onConfirm={handleConfirmar} onBack={() => setPaso("horario")} loading={saving}
              />
            )}

            {/* CONFIRMADO */}
            {paso === "confirmado" && turnoCreado && (
              <Confirmacion turno={turnoCreado} perfil={perfil} onNuevoTurno={resetear} />
            )}
          </div>
        </div>

        {/* ID del turno para cancelación — mostrado en paso confirmado */}
        {paso === "confirmado" && turnoCreado && (
          <div style={{ marginTop:"1rem", background:T.bgDark, border:`2px solid ${T.border}`, padding:"0.75rem 1rem" }}>
            <div style={{ fontSize:"0.58rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textLight, marginBottom:"3px" }}>ID de tu turno (para cancelación)</div>
            <div style={{ fontFamily:"monospace", fontSize:"0.8rem", color:T.textMid, wordBreak:"break-all" }}>{turnoCreado.id}</div>
          </div>
        )}
      </div>

      {/* Modal cancelar */}
      <Modal open={modalCancelar} onClose={() => setModalCancelar(false)} title="Cancelar turno" width={440}>
        <CancelarTurno propietarioId={propietarioId} onClose={() => setModalCancelar(false)} />
      </Modal>
    </div>
  );
}

// ============================================================
//  OwnerApp.jsx — Panel del propietario (requiere auth)
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import {
  getTurnos, saveTurno as dbSaveTurno, deleteTurno as dbDeleteTurno,
  getConfig, saveConfig as dbSaveConfig,
  getBloqueos, bloquearFecha, desbloquearFecha,
  listenTurnos, listenBloqueos,
} from "./db.js";
import {
  T, GLOBAL_STYLES, Btn, Fld, inp, Ic, Modal, Toast,
  StatusBadge, TagPill, SectionLabel,
} from "./ui.jsx";
import {
  uid, todayStr, addDays, fmtDate, fmtDateLong, cancelCode,
  getMonthDates, currentYearMonth, timeSlots,
  MONTHS, MONTHS_SHORT, DAYS_FULL, DAYS_SHORT,
  STATUS, STATUS_COLOR, DEFAULT_CONFIG,
  toCSV, downloadCSV, initials,
} from "./helpers.js";

/* ── Turno Form ── */
function TurnoForm({ turno, config, onSave, onClose, defaultDate }) {
  const slots = timeSlots(config.horaInicio, config.horaFin, config.duracionTurno || 60);
  const [f, sf] = useState({
    clienteNombre: turno?.clienteNombre || "",
    clienteTel:    turno?.clienteTel || "",
    fecha:         turno?.fecha || defaultDate || todayStr(),
    hora:          turno?.hora || slots[0] || "09:00",
    duracion:      turno?.duracion || config.duracionTurno || 60,
    motivo:        turno?.motivo || "",
    estado:        turno?.estado || "pendiente",
    notas:         turno?.notas || "",
    precio:        turno?.precio || config.precioBase || "",
    pagado:        turno?.pagado || false,
  });
  const s = (k, v) => sf(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!f.clienteNombre.trim() || !f.fecha || !f.hora) return;
    const t = {
      ...f, id: turno?.id || uid(),
      precio: Number(f.precio) || 0,
      creadoEn: turno?.creadoEn || todayStr(),
      cancelCode: turno?.cancelCode || cancelCode(),
    };
    onSave(t); onClose();
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem" }}>
        <Fld label="Nombre del cliente" req>
          <input style={inp} value={f.clienteNombre} onChange={e=>s("clienteNombre",e.target.value)} placeholder="María González"/>
        </Fld>
        <Fld label="Teléfono">
          <input style={inp} value={f.clienteTel} onChange={e=>s("clienteTel",e.target.value)} placeholder="11-XXXX-XXXX"/>
        </Fld>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem" }}>
        <Fld label="Fecha" req><input type="date" style={inp} value={f.fecha} onChange={e=>s("fecha",e.target.value)}/></Fld>
        <Fld label="Hora" req>
          <select style={inp} value={f.hora} onChange={e=>s("hora",e.target.value)}>
            {slots.map(h=><option key={h} value={h}>{h}</option>)}
          </select>
        </Fld>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.85rem" }}>
        <Fld label="Estado">
          <select style={inp} value={f.estado} onChange={e=>s("estado",e.target.value)}>
            {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </Fld>
        <Fld label="Precio ($)"><input type="number" style={inp} value={f.precio} onChange={e=>s("precio",e.target.value)} placeholder="0"/></Fld>
      </div>
      <Fld label="Motivo"><input style={inp} value={f.motivo} onChange={e=>s("motivo",e.target.value)} placeholder="Consulta, revisión..."/></Fld>
      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"1rem" }}>
        <input type="checkbox" checked={f.pagado} onChange={e=>s("pagado",e.target.checked)} style={{ width:15, height:15, accentColor:T.teal }}/>
        <label style={{ fontSize:"0.83rem", fontWeight:600, cursor:"pointer" }}>Cobrado</label>
      </div>
      <Fld label="Notas internas"><textarea style={{ ...inp, resize:"vertical", minHeight:"60px" }} value={f.notas} onChange={e=>s("notas",e.target.value)} placeholder="Recordatorios..."/></Fld>
      <div style={{ display:"flex", gap:"0.6rem", justifyContent:"flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} icon="save">Guardar</Btn>
      </div>
    </div>
  );
}

/* ── Vista Día ── */
function VistaDia({ turnos, fecha, onEdit, onDelete, onChangeEstado, onNew }) {
  const del_dia = turnos.filter(t => t.fecha === fecha).sort((a,b) => a.hora.localeCompare(b.hora));
  if (!del_dia.length) return (
    <div style={{ textAlign:"center", padding:"3.5rem 1rem", color:T.textLight, border:`2px dashed ${T.border}` }}>
      <div style={{ fontSize:"2rem", opacity:0.25, marginBottom:"1rem" }}>◈</div>
      <p style={{ margin:"0 0 1rem", fontSize:"0.82rem", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>Sin turnos</p>
      <Btn onClick={onNew} icon="plus">Agregar turno</Btn>
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
      {del_dia.map(t => (
        <div key={t.id} style={{ display:"flex", alignItems:"stretch", background:T.surface, border:`2px solid ${T.border}`, transition:"border-color 0.1s" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderDk}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          <div style={{ width:"6px", background:STATUS_COLOR[t.estado], flexShrink:0 }}/>
          <div style={{ width:"64px", padding:"0.75rem 0.5rem", background:T.bgDark, borderRight:`2px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <div style={{ fontSize:"0.95rem", fontWeight:900, color:T.text, fontFamily:"'Archivo Black',sans-serif" }}>{t.hora}</div>
            <div style={{ fontSize:"0.58rem", fontWeight:700, color:T.textLight, textTransform:"uppercase", marginTop:"2px" }}>{t.duracion}m</div>
          </div>
          <div style={{ flex:1, padding:"0.7rem 1rem", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.75rem", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:"140px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap", marginBottom:"3px" }}>
                <span style={{ fontWeight:800, color:T.text, fontSize:"0.88rem", textTransform:"uppercase", letterSpacing:"0.03em" }}>{t.clienteNombre || "—"}</span>
                <StatusBadge estado={t.estado}/>
                {t.pagado ? <TagPill label="Cobrado" color={T.teal}/> : t.precio>0 ? <TagPill label={`$${Number(t.precio).toLocaleString("es-AR")}`} color={T.amber}/> : null}
              </div>
              {t.motivo && <div style={{ color:T.textMid, fontSize:"0.8rem" }}>{t.motivo}</div>}
              {t.clienteTel && <div style={{ color:T.textLight, fontSize:"0.72rem", marginTop:"3px", display:"flex", alignItems:"center", gap:"4px" }}><Ic n="phone" s={11}/>{t.clienteTel}</div>}
              {t.notas && <div style={{ color:T.textLight, fontSize:"0.72rem", fontStyle:"italic", marginTop:"2px" }}>"{t.notas}"</div>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"4px", alignItems:"flex-end", flexShrink:0 }}>
              <div style={{ display:"flex", gap:"3px" }}>
                <button onClick={()=>onEdit(t)} style={{ background:"none", border:`2px solid ${T.border}`, padding:"4px 7px", cursor:"pointer", color:T.textMid, display:"flex", borderRadius:0 }}><Ic n="edit" s={12}/></button>
                <button onClick={()=>onDelete(t.id)} style={{ background:"none", border:`2px solid ${T.red}44`, padding:"4px 7px", cursor:"pointer", color:T.red, display:"flex", borderRadius:0 }}><Ic n="trash" s={12}/></button>
              </div>
              <select value={t.estado} onChange={e=>onChangeEstado(t.id,e.target.value)} style={{ fontSize:"0.65rem", border:`2px solid ${T.border}`, padding:"3px 5px", cursor:"pointer", background:T.surface, fontFamily:"inherit", color:T.textMid, outline:"none", borderRadius:0, fontWeight:700, textTransform:"uppercase" }}>
                {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Vista Mes con bloqueos ── */
function VistaMes({ turnos, yearMonth, selectedDate, onSelectDate, bloqueos, onToggleBloqueo }) {
  const { dates, startDow } = getMonthDates(yearMonth);
  const blanks = Array.from({ length: startDow });
  const hoy = todayStr();

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"1px", marginBottom:"3px", background:T.borderDk }}>
        {DAYS_SHORT.map(d=><div key={d} style={{ textAlign:"center", fontSize:"0.58rem", fontWeight:900, color:T.textInv, textTransform:"uppercase", letterSpacing:"0.08em", padding:"5px", background:T.accent }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", background:T.borderDk }}>
        {blanks.map((_,i)=><div key={"b"+i} style={{ background:T.bg }}/>)}
        {dates.map(date => {
          const dt     = turnos.filter(t=>t.fecha===date&&t.estado!=="cancelado").length;
          const isToday= date===hoy, isSel=date===selectedDate;
          const isBloq = bloqueos.includes(date);
          return (
            <div key={date} onClick={()=>onSelectDate(date)}
              style={{ minHeight:"58px", background:isBloq?T.bgDark:isSel?T.accent:T.surface, cursor:"pointer", padding:"4px", border:isToday&&!isSel?`2px solid ${T.amber}`:"2px solid transparent", position:"relative" }}
              onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=isBloq?T.bgDark:T.bgDark;}}
              onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background=isBloq?T.bgDark:T.surface;}}>
              <div style={{ fontSize:"0.78rem", fontWeight:900, color:isSel?T.textInv:isToday?T.amber:isBloq?T.textLight:T.textMid, fontFamily:"'Archivo Black',sans-serif", marginBottom:"2px" }}>
                {new Date(date+"T00:00:00").getDate()}
              </div>
              {isBloq && <div style={{ fontSize:"0.52rem", fontWeight:800, color:T.red, textTransform:"uppercase" }}>Bloqueado</div>}
              {!isBloq && dt>0 && <div style={{ fontSize:"0.58rem", fontWeight:800, color:isSel?T.cream:T.teal }}>{dt} turno{dt!==1?"s":""}</div>}
              {/* botón bloquear/desbloquear — aparece en hover */}
              <button
                onClick={e=>{e.stopPropagation();onToggleBloqueo(date);}}
                title={isBloq?"Desbloquear":"Bloquear fecha"}
                style={{ position:"absolute", bottom:"3px", right:"3px", background:"none", border:"none", cursor:"pointer", color:isBloq?T.red:T.textLight, padding:0, display:"flex", opacity:0.6 }}>
                <Ic n={isBloq?"unlock":"lock"} s={11}/>
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:"0.75rem", fontSize:"0.7rem", color:T.textLight, fontWeight:600, display:"flex", alignItems:"center", gap:"6px" }}>
        <Ic n="lock" s={12}/> Hacé click en el ícono del día para bloquear / desbloquear fechas
      </div>
    </div>
  );
}

/* ── Tab Configuración ── */
function TabConfig({ config, uid, onSave }) {
  const [f, sf] = useState({ ...config });
  const s = (k, v) => sf(p => ({ ...p, [k]: v }));
  const [saved, setSaved] = useState(false);

  const dias = [0,1,2,3,4,5,6];
  const toggleDia = (d) => {
    const hab = f.diasHabiles || [1,2,3,4,5];
    s("diasHabiles", hab.includes(d) ? hab.filter(x=>x!==d) : [...hab,d].sort());
  };

  const pubUrl = `${window.location.origin}/turno/${uid}`;
  const [copiado, setCopiado] = useState(false);
  const copiarLink = () => { navigator.clipboard?.writeText(pubUrl); setCopiado(true); setTimeout(()=>setCopiado(false),2000); };

  const handleSave = async () => {
    await onSave(f);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div style={{ maxWidth:"580px" }}>
      {/* Link público */}
      <div style={{ background:T.surface, border:`3px solid ${T.teal}`, padding:"1.25rem", marginBottom:"1.25rem" }}>
        <SectionLabel color={T.teal}>Link público para clientes</SectionLabel>
        <p style={{ fontSize:"0.82rem", color:T.textMid, marginBottom:"0.75rem", lineHeight:1.5 }}>
          Compartí este link con tus clientes. Pueden sacar turnos sin necesidad de registrarse.
        </p>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"stretch", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:"200px", padding:"0.55rem 0.85rem", background:T.bgDark, border:`2px solid ${T.border}`, fontSize:"0.78rem", color:T.textMid, fontFamily:"monospace", wordBreak:"break-all" }}>
            {pubUrl}
          </div>
          <Btn variant="teal" size="sm" icon="copy" onClick={copiarLink}>{copiado?"¡Copiado!":"Copiar"}</Btn>
          <Btn variant="secondary" size="sm" icon="link" onClick={()=>window.open(pubUrl,"_blank")}>Abrir</Btn>
        </div>
      </div>

      {/* Perfil */}
      <div style={{ background:T.surface, border:`2px solid ${T.border}`, padding:"1.25rem", marginBottom:"1rem" }}>
        <SectionLabel>Perfil profesional</SectionLabel>
        <Fld label="Nombre / Consultorio"><input style={inp} value={f.nombre} onChange={e=>s("nombre",e.target.value)}/></Fld>
        <Fld label="Especialidad / Servicio"><input style={inp} value={f.especialidad} onChange={e=>s("especialidad",e.target.value)}/></Fld>
        <Fld label="Descripción (visible para clientes)" hint="opcional">
          <textarea style={{ ...inp, resize:"vertical", minHeight:"70px" }} value={f.descripcion||""} onChange={e=>s("descripcion",e.target.value)} placeholder="Breve descripción de tu servicio..."/>
        </Fld>
        <Fld label="Precio base ($)" hint="opcional">
          <input type="number" style={inp} value={f.precioBase||""} onChange={e=>s("precioBase",e.target.value)} placeholder="Ej: 5000"/>
        </Fld>
      </div>

      {/* Horarios */}
      <div style={{ background:T.surface, border:`2px solid ${T.border}`, padding:"1.25rem", marginBottom:"1rem" }}>
        <SectionLabel>Disponibilidad</SectionLabel>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.85rem", marginBottom:"1rem" }}>
          <Fld label="Hora de inicio"><input type="time" style={inp} value={f.horaInicio} onChange={e=>s("horaInicio",e.target.value)}/></Fld>
          <Fld label="Hora de fin"><input type="time" style={inp} value={f.horaFin} onChange={e=>s("horaFin",e.target.value)}/></Fld>
          <Fld label="Duración del turno">
            <select style={inp} value={f.duracionTurno||60} onChange={e=>s("duracionTurno",Number(e.target.value))}>
              {[15,20,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
            </select>
          </Fld>
        </div>
        <Fld label="Días disponibles">
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
            {dias.map(d => {
              const activo = (f.diasHabiles||[1,2,3,4,5]).includes(d);
              return (
                <button key={d} onClick={()=>toggleDia(d)} style={{ padding:"0.35rem 0.6rem", border:`2px solid ${activo?T.teal:T.border}`, background:activo?T.teal:T.surface, color:activo?"#fff":T.textMid, cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:"0.75rem", textTransform:"uppercase", borderRadius:0 }}>
                  {DAYS_SHORT[d]}
                </button>
              );
            })}
          </div>
        </Fld>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn onClick={handleSave} icon="save">{saved?"¡Guardado!":"Guardar cambios"}</Btn>
      </div>
    </div>
  );
}

/* ── Tab Estadísticas ── */
function TabStats({ turnos }) {
  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const delMes = turnos.filter(t=>t.fecha.startsWith(mes)&&t.estado!=="cancelado");
  const cobradoMes = delMes.filter(t=>t.pagado).reduce((s,t)=>s+Number(t.precio||0),0);
  const aus = delMes.filter(t=>t.estado==="ausente").length;
  const tasa = delMes.length ? Math.round((1-aus/delMes.length)*100) : 100;

  // Clientes únicos
  const clienteMap = {};
  turnos.forEach(t => {
    if (!clienteMap[t.clienteNombre]) clienteMap[t.clienteNombre] = { nombre:t.clienteNombre, tel:t.clienteTel||"", turnos:0, cobrado:0 };
    clienteMap[t.clienteNombre].turnos++;
    if (t.pagado) clienteMap[t.clienteNombre].cobrado += Number(t.precio||0);
  });
  const clienteRank = Object.values(clienteMap).sort((a,b)=>b.turnos-a.turnos);

  const u6 = Array.from({length:6},(_,i)=>{
    const d = new Date(now); d.setMonth(d.getMonth()-5+i);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const ts = turnos.filter(t=>t.fecha.startsWith(k)&&t.estado!=="cancelado");
    return { mes:MONTHS_SHORT[d.getMonth()], cobrado:ts.filter(t=>t.pagado).reduce((s,t)=>s+Number(t.precio||0),0), cantidad:ts.length };
  });
  const maxC = Math.max(...u6.map(x=>x.cobrado),1);

  const expTurnos = () => downloadCSV(
    toCSV(turnos, [
      {label:"Fecha",key:"fecha"},{label:"Hora",key:"hora"},{label:"Cliente",key:"clienteNombre"},
      {label:"Teléfono",key:"clienteTel"},{label:"Motivo",key:"motivo"},{label:"Estado",fn:r=>STATUS[r.estado]||r.estado},
      {label:"Precio",key:"precio"},{label:"Pagado",fn:r=>r.pagado?"Sí":"No"},{label:"Notas",key:"notas"},
    ]),
    `turnos_${todayStr()}.csv`
  );

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0", marginBottom:"1.5rem", border:`2px solid ${T.borderDk}` }}>
        {[
          {l:`Turnos ${MONTHS_SHORT[now.getMonth()]}`, v:delMes.length, c:T.text},
          {l:"Cobrado (mes)", v:`$${cobradoMes.toLocaleString("es-AR")}`, c:T.teal},
          {l:"Asistencia", v:`${tasa}%`, c:tasa>=80?T.sage:T.amber},
          {l:"Total turnos", v:turnos.length, c:T.text},
        ].map((x,i)=>(
          <div key={x.l} style={{ padding:"1rem", borderRight:i<3?`2px solid ${T.borderDk}`:"none", background:T.surface }}>
            <div style={{ fontSize:"0.58rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textLight, marginBottom:"3px" }}>{x.l}</div>
            <div style={{ fontSize:"1.5rem", fontWeight:900, color:x.c, fontFamily:"'Archivo Black',sans-serif", lineHeight:1 }}>{x.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
        <div style={{ background:T.surface, border:`2px solid ${T.border}`, padding:"1.25rem" }}>
          <SectionLabel>Facturación mensual</SectionLabel>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"0.5rem", height:"120px", marginTop:"0.75rem" }}>
            {u6.map((m,i)=>(
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                <div style={{ fontSize:"0.58rem", fontWeight:800, color:T.textLight }}>{m.cobrado>0?`$${Math.round(m.cobrado/1000)}k`:""}</div>
                <div style={{ width:"100%", background:i===5?T.teal:T.cream, height:`${Math.max((m.cobrado/maxC)*100,4)}%`, border:i===5?`2px solid ${T.teal}`:`2px solid ${T.borderDk}` }}/>
                <div style={{ fontSize:"0.6rem", color:T.textLight, fontWeight:800, textTransform:"uppercase" }}>{m.mes}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:T.surface, border:`2px solid ${T.border}`, padding:"1.25rem" }}>
          <SectionLabel>Clientes frecuentes</SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem", marginTop:"0.75rem" }}>
            {clienteRank.slice(0,5).map((c,i)=>(
              <div key={c.nombre} style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
                <div style={{ fontSize:"0.68rem", fontWeight:900, color:T.textLight, width:"14px", textAlign:"right" }}>{i+1}</div>
                <div style={{ width:"26px", height:"26px", background:i===0?T.teal:T.bgDark, border:`2px solid ${i===0?T.teal:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.6rem", fontWeight:900, color:i===0?"#fff":T.textMid, flexShrink:0 }}>{initials(c.nombre)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.77rem", fontWeight:800, color:T.text, textTransform:"uppercase", letterSpacing:"0.03em" }}>{c.nombre}</div>
                  <div style={{ height:"3px", background:T.bgDark, marginTop:"2px" }}><div style={{ height:"100%", background:T.teal, width:`${Math.min((c.turnos/Math.max(clienteRank[0]?.turnos,1))*100,100)}%` }}/></div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"0.72rem", fontWeight:900, color:T.text }}>{c.turnos}t</div>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, color:T.teal }}>${c.cobrado.toLocaleString("es-AR")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn variant="secondary" size="sm" icon="download" onClick={expTurnos}>Exportar CSV</Btn>
      </div>
    </div>
  );
}

/* ── Tab Alertas ── */
function TabAlertas({ turnos, onEdit }) {
  const hoy = todayStr(), man = addDays(hoy,1), en7 = addDays(hoy,7);
  const groups = [
    { id:"hoy",      label:"Hoy",                color:T.teal,  items:turnos.filter(t=>t.fecha===hoy&&t.estado!=="cancelado").sort((a,b)=>a.hora.localeCompare(b.hora)) },
    { id:"manana",   label:"Mañana",              color:T.sage,  items:turnos.filter(t=>t.fecha===man&&t.estado!=="cancelado").sort((a,b)=>a.hora.localeCompare(b.hora)) },
    { id:"semana",   label:"Próximos 7 días",     color:T.amber, items:turnos.filter(t=>t.fecha>man&&t.fecha<=en7&&t.estado!=="cancelado") },
    { id:"pend",     label:"Sin confirmar",       color:T.amber, items:turnos.filter(t=>t.estado==="pendiente"&&t.fecha>=hoy) },
    { id:"cobrar",   label:"Por cobrar",          color:T.red,   items:turnos.filter(t=>!t.pagado&&t.precio>0&&t.estado==="completado") },
    { id:"ausentes", label:"Ausentes sin resolver",color:T.slate, items:turnos.filter(t=>t.estado==="ausente") },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      {groups.map(g=>(
        <div key={g.id}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.6rem", borderBottom:`2px solid ${g.color}`, paddingBottom:"0.4rem" }}>
            <div style={{ width:"9px", height:"9px", background:g.color, flexShrink:0 }}/>
            <span style={{ fontSize:"0.68rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:T.textMid }}>{g.label}</span>
            <span style={{ marginLeft:"auto", fontSize:"0.68rem", fontWeight:900, color:g.color, border:`2px solid ${g.color}`, padding:"1px 7px" }}>{g.items.length}</span>
          </div>
          {!g.items.length
            ? <div style={{ color:T.textLight, fontSize:"0.78rem", fontWeight:700, padding:"0.65rem", background:T.bg, border:`2px solid ${T.border}`, textTransform:"uppercase", letterSpacing:"0.06em" }}>Sin elementos</div>
            : <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                {g.items.map(t=>(
                  <div key={t.id} onClick={()=>onEdit(t)} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.65rem 0.85rem", background:T.surface, border:`2px solid ${T.border}`, cursor:"pointer", transition:"border-color 0.1s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=T.borderDk}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                    <div style={{ width:"4px", alignSelf:"stretch", background:g.color, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:"0.83rem", color:T.text, textTransform:"uppercase", letterSpacing:"0.03em" }}>{t.clienteNombre||"—"}</div>
                      <div style={{ fontSize:"0.72rem", color:T.textMid, fontWeight:600 }}>{fmtDate(t.fecha)} · {t.hora} {t.motivo?`· ${t.motivo}`:""}</div>
                    </div>
                    <StatusBadge estado={t.estado}/>
                  </div>
                ))}
              </div>
          }
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN OwnerApp
══════════════════════════════════════════════════════════════ */
export default function OwnerApp({ user }) {
  const uid_owner = user.uid;

  const [loaded,   setLoaded]   = useState(false);
  const [turnos,   setTurnos]   = useState([]);
  const [config,   setConfig]   = useState(DEFAULT_CONFIG);
  const [bloqueos, setBloqueos] = useState([]);
  const [tab,      setTab]      = useState("agenda");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [yearMonth,    setYearMonth]    = useState(currentYearMonth());
  const [viewMode,     setViewMode]     = useState("dia");
  const [modalTurno,   setModalTurno]   = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);
  const [toast,        setToast]        = useState(null);
  const [sidebar,      setSidebar]      = useState(false); // collapsed

  // Carga inicial
  useEffect(() => {
    (async () => {
      const [cf] = await Promise.all([getConfig(uid_owner)]);
      if (cf) setConfig(cf);
      setLoaded(true);
    })();
  }, [uid_owner]);

  // Realtime
  useEffect(() => {
    if (!loaded) return;
    const u1 = listenTurnos(uid_owner, setTurnos);
    const u2 = listenBloqueos(uid_owner, setBloqueos);
    return () => { u1(); u2(); };
  }, [uid_owner, loaded]);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  const saveTurno = async (t) => {
    await dbSaveTurno(uid_owner, t);
    showToast("Turno guardado");
  };
  const removeTurno = async (id) => { await dbDeleteTurno(uid_owner, id); showToast("Turno eliminado","info"); };
  const changeEstado = async (id, estado) => {
    const t = turnos.find(x=>x.id===id);
    if (t) await dbSaveTurno(uid_owner, {...t, estado});
  };
  const toggleBloqueo = async (fecha) => {
    if (bloqueos.includes(fecha)) { await desbloquearFecha(uid_owner, fecha); showToast("Fecha desbloqueada","info"); }
    else { await bloquearFecha(uid_owner, fecha); showToast("Fecha bloqueada"); }
  };
  const handleSaveConfig = async (cf) => { await dbSaveConfig(uid_owner, cf); setConfig(cf); showToast("Configuración guardada"); };

  const moveDate = (n) => {
    if (viewMode==="dia") setSelectedDate(addDays(selectedDate,n));
    else if (viewMode==="mes") { const [y,m]=yearMonth.split("-").map(Number); const d=new Date(y,m-1+n,1); setYearMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }
  };

  const hoyCount    = turnos.filter(t=>t.fecha===todayStr()&&t.estado!=="cancelado").length;
  const pendientes  = turnos.filter(t=>t.estado==="pendiente"&&t.fecha>=todayStr()).length;
  const cobradoMes  = (() => { const m=currentYearMonth(); return turnos.filter(t=>t.fecha.startsWith(m)&&t.pagado).reduce((s,t)=>s+Number(t.precio||0),0); })();

  const NAV = [
    {id:"agenda",   label:"Agenda",       icon:"calendar"},
    {id:"alertas",  label:"Alertas",      icon:"bell",    badge:pendientes},
    {id:"stats",    label:"Estadísticas", icon:"chart"},
    {id:"config",   label:"Configuración",icon:"settings"},
  ];

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Archivo Black',sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ textAlign:"center", color:T.textLight }}>
        <div style={{ fontSize:"1.8rem", fontWeight:900, color:T.accent }}>AGENDA PRO</div>
        <div style={{ fontSize:"0.65rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", marginTop:"6px" }}>Cargando...</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.bg, minHeight:"100vh", display:"flex", color:T.text }}>
      <style>{GLOBAL_STYLES}</style>
      <Toast toast={toast}/>

      {/* SIDEBAR */}
      <aside style={{ width:sidebar?"56px":"220px", minHeight:"100vh", background:T.sidebar, display:"flex", flexDirection:"column", flexShrink:0, transition:"width 0.2s ease", overflow:"hidden", borderRight:`3px solid ${T.accent}` }}>
        {!sidebar && (
          <div style={{ padding:"1.25rem 1.1rem 0.85rem", borderBottom:`2px solid ${T.sidebarMid}` }}>
            <div style={{ fontSize:"0.95rem", fontWeight:900, color:T.textInv, fontFamily:"'Archivo Black',sans-serif", lineHeight:1 }}>{config.nombre}</div>
            <div style={{ fontSize:"0.58rem", fontWeight:800, color:T.cream, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:"2px", opacity:0.7 }}>{config.especialidad}</div>
            <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.28)", marginTop:"6px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
          </div>
        )}
        {!sidebar && (
          <div style={{ padding:"0.75rem 1.1rem", borderBottom:`2px solid ${T.sidebarMid}` }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem" }}>
              {[{l:"Hoy",v:hoyCount,c:T.cream},{l:"Pend.",v:pendientes,c:pendientes>0?T.amber:T.cream},{l:"Cobrado",v:`$${Math.round(cobradoMes/1000)}k`,c:T.sage},{l:"Bloqueados",v:bloqueos.length,c:T.cream}].map(x=>(
                <div key={x.l} style={{ padding:"0.45rem", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize:"0.88rem", fontWeight:900, color:x.c, fontFamily:"'Archivo Black',sans-serif", lineHeight:1 }}>{x.v}</div>
                  <div style={{ fontSize:"0.54rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.07em", color:"rgba(255,255,255,0.32)", marginTop:"1px" }}>{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <nav style={{ display:"flex", flexDirection:"column", gap:"1px", flex:1, padding:"0.6rem 0.5rem" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{ display:"flex", alignItems:"center", gap:"0.7rem", padding:sidebar?"0.7rem":"0.65rem 0.75rem", border:"none", background:tab===n.id?T.teal:"transparent", color:tab===n.id?"#fff":"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:"0.75rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.07em", transition:"all 0.1s", textAlign:"left", whiteSpace:"nowrap", justifyContent:sidebar?"center":"flex-start", position:"relative", borderLeft:tab===n.id?`3px solid ${T.cream}`:"3px solid transparent" }}>
              <Ic n={n.icon} s={15} c={tab===n.id?"#fff":"rgba(255,255,255,0.5)"}/>
              {!sidebar && n.label}
              {!sidebar && n.badge>0 && <span style={{ marginLeft:"auto", fontSize:"0.58rem", fontWeight:900, background:T.amber, color:T.accent, padding:"1px 6px" }}>{n.badge}</span>}
              {sidebar && n.badge>0 && <span style={{ position:"absolute", top:"8px", right:"8px", width:"6px", height:"6px", background:T.amber }}/>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"0.5rem", borderTop:`2px solid ${T.sidebarMid}`, display:"flex", gap:"4px", justifyContent:sidebar?"center":"space-between", alignItems:"center" }}>
          <button onClick={()=>signOut(auth)} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0.65rem", border:"none", background:"transparent", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:"0.68rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.07em", borderRadius:0 }} onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.7)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.3)"}>
            <Ic n="logout" s={13}/>{!sidebar&&"Salir"}
          </button>
          <button onClick={()=>setSidebar(p=>!p)} style={{ padding:"0.45rem", border:"1px solid rgba(255,255,255,0.15)", background:"transparent", cursor:"pointer", color:"rgba(255,255,255,0.45)", display:"flex", borderRadius:0 }}><Ic n={sidebar?"chevR":"chevL"} s={13}/></button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, padding:"1.75rem 2rem", overflowY:"auto", minWidth:0 }}>
        {/* Page header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:"0.75rem" }}>
          <div>
            <div style={{ fontSize:"0.56rem", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.18em", color:T.textLight, marginBottom:"0.25rem" }}>
              {{agenda:"Agenda",alertas:"Alertas",stats:"Estadísticas",config:"Configuración"}[tab]}
            </div>
            <h1 style={{ fontSize:"1.5rem", fontWeight:900, color:T.text, fontFamily:"'Archivo Black',sans-serif", letterSpacing:"-0.02em", lineHeight:1 }}>
              {tab==="agenda" ? (viewMode==="dia" ? fmtDateLong(selectedDate) : `${MONTHS[parseInt(yearMonth.split("-")[1])-1]} ${yearMonth.split("-")[0]}`)
               : tab==="alertas" ? "Centro de alertas"
               : tab==="stats"   ? "Panel de rendimiento"
               :                   "Configuración"}
            </h1>
          </div>

          {tab==="agenda" && (
            <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", flexWrap:"wrap" }}>
              <Btn variant="secondary" size="sm" onClick={()=>{setSelectedDate(todayStr());setYearMonth(currentYearMonth());}}>Hoy</Btn>
              <div style={{ display:"flex" }}>
                <button onClick={()=>moveDate(-1)} style={{ padding:"0.38rem 0.6rem", border:`2px solid ${T.borderDk}`, background:T.surface, cursor:"pointer", display:"flex", color:T.textMid, borderRadius:0, borderRight:"none" }}><Ic n="chevL" s={13}/></button>
                <button onClick={()=>moveDate(1)}  style={{ padding:"0.38rem 0.6rem", border:`2px solid ${T.borderDk}`, background:T.surface, cursor:"pointer", display:"flex", color:T.textMid, borderRadius:0 }}><Ic n="chevR" s={13}/></button>
              </div>
              <div style={{ display:"flex", border:`2px solid ${T.borderDk}` }}>
                {[{id:"dia",l:"Día",ic:"list"},{id:"mes",l:"Mes",ic:"calendar"}].map((v,i)=>(
                  <button key={v.id} onClick={()=>setViewMode(v.id)} style={{ padding:"0.38rem 0.7rem", border:"none", background:viewMode===v.id?T.accent:T.surface, color:viewMode===v.id?T.textInv:T.textMid, cursor:"pointer", fontSize:"0.7rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", borderLeft:i>0?`2px solid ${T.borderDk}`:"none", display:"flex", alignItems:"center", gap:"4px", fontFamily:"inherit" }}><Ic n={v.ic} s={12}/>{v.l}</button>
                ))}
              </div>
              <Btn onClick={()=>setModalTurno("new")} icon="plus" size="sm">Nuevo turno</Btn>
            </div>
          )}
        </div>

        {/* AGENDA */}
        {tab==="agenda" && viewMode==="dia" && (
          <VistaDia turnos={turnos} fecha={selectedDate}
            onEdit={setModalTurno} onDelete={id=>setConfirmDel(id)}
            onChangeEstado={changeEstado} onNew={()=>setModalTurno("new")}
          />
        )}
        {tab==="agenda" && viewMode==="mes" && (
          <div>
            <VistaMes turnos={turnos} yearMonth={yearMonth}
              selectedDate={selectedDate}
              onSelectDate={d=>{setSelectedDate(d);setViewMode("dia");}}
              bloqueos={bloqueos} onToggleBloqueo={toggleBloqueo}
            />
          </div>
        )}

        {tab==="alertas"  && <TabAlertas turnos={turnos} onEdit={setModalTurno}/>}
        {tab==="stats"    && <TabStats turnos={turnos}/>}
        {tab==="config"   && <TabConfig config={config} uid={uid_owner} onSave={handleSaveConfig}/>}
      </main>

      {/* MODAL TURNO */}
      <Modal open={!!modalTurno} onClose={()=>setModalTurno(null)} title={typeof modalTurno==="object"?"Editar turno":"Nuevo turno"} width={520}>
        <TurnoForm
          turno={typeof modalTurno==="object"?modalTurno:null}
          config={config} onSave={saveTurno}
          onClose={()=>setModalTurno(null)}
          defaultDate={selectedDate}
        />
      </Modal>

      {/* CONFIRM DELETE */}
      <Modal open={!!confirmDel} onClose={()=>setConfirmDel(null)} title="Confirmar" width={380}>
        <p style={{ color:T.textMid, fontSize:"0.875rem", marginBottom:"1.25rem" }}>¿Eliminar este turno?</p>
        <div style={{ display:"flex", gap:"0.6rem", justifyContent:"flex-end" }}>
          <Btn variant="secondary" onClick={()=>setConfirmDel(null)}>Cancelar</Btn>
          <Btn variant="danger" icon="trash" onClick={()=>{removeTurno(confirmDel);setConfirmDel(null);}}>Eliminar</Btn>
        </div>
      </Modal>
    </div>
  );
}

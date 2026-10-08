export function safeId(value) {
  if (typeof value !== 'string' || !/^[\w-]{1,128}$/.test(value)) throw new Error('Identificador inválido.');
  return value;
}
export function validateTurn(turn, config, today) {
  if (!turn || typeof turn.clienteNombre !== 'string' || !turn.clienteNombre.trim() || turn.clienteNombre.length > 120
    || typeof turn.clienteTel !== 'string' || turn.clienteTel.length > 40
    || !/^\d{4}-\d{2}-\d{2}$/.test(turn.fecha || '') || !/^\d{2}:\d{2}$/.test(turn.hora || '')) throw new Error('Completá los datos del turno.');
  const date = new Date(turn.fecha + 'T12:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== turn.fecha || turn.fecha < today) throw new Error('Fecha inválida o pasada.');
  const minutes = value => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value || '')) throw new Error('Horario inválido.');
    const [hours, mins] = value.split(':').map(Number); return hours*60+mins;
  };
  const start=minutes(config.horaInicio), end=minutes(config.horaFin), time=minutes(turn.hora), duration=Number(config.duracionTurno ?? 60);
  if (!Number.isInteger(duration) || duration <= 0 || duration > 480 || time < start || time+duration > end
    || (time-start)%duration !== 0 || !(config.diasHabiles || [1,2,3,4,5]).includes(date.getUTCDay())) throw new Error('Ese horario no está disponible.');
  return { ...turn, clienteNombre:turn.clienteNombre.trim(), duracion:duration };
}
export function overlaps(a,b) {
  if (a.fecha !== b.fecha || a.estado === 'cancelado' || b.estado === 'cancelado') return false;
  const minutes = value => { const [h,m]=value.split(':').map(Number); return h*60+m; };
  const startA=minutes(a.hora), startB=minutes(b.hora);
  return startA < startB+Number(b.duracion || 60) && startB < startA+Number(a.duracion || 60);
}

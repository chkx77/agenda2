import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTurn,overlaps,safeId} from '../domain.js';
const config={horaInicio:'08:00',horaFin:'18:00',duracionTurno:60,diasHabiles:[1,2,3,4,5]};
const turn={clienteNombre:' Ana ',clienteTel:'123',fecha:'2026-10-09',hora:'09:00',estado:'pendiente',duracion:60};
test('valida disponibilidad y rechaza fecha pasada, inválida o fuera de grilla',()=>{
  assert.equal(validateTurn(turn,config,'2026-10-08').clienteNombre,'Ana');
  assert.throws(()=>validateTurn(turn,config,'2026-10-10'));
  assert.throws(()=>validateTurn({...turn,fecha:'2026-02-30'},config,'2026-01-01'));
  assert.throws(()=>validateTurn({...turn,hora:'09:30'},config,'2026-10-08'));
  assert.throws(()=>validateTurn(turn,{...config,duracionTurno:0},'2026-10-08'));
});
test('detecta solapamiento y permite turnos contiguos o cancelados',()=>{
  assert.equal(overlaps(turn,{...turn,hora:'09:30'}),true);
  assert.equal(overlaps(turn,{...turn,hora:'10:00'}),false);
  assert.equal(overlaps(turn,{...turn,estado:'cancelado'}),false);
});
test('rechaza rutas en identificadores',()=>assert.throws(()=>safeId('../otra-agenda')));

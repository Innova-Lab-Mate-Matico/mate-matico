import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluarRacha } from '../src/services/racha.service.js';

describe('Cálculo de Racha Empática con Huso Horario Adaptativo', () => {
  it('Debe iniciar la racha en 1 si no hay intentos anteriores', () => {
    const usuario = { rachaDias: 0, recordRacha: 0, ultimaLeccionCompletada: null };
    const ahora = new Date('2026-07-21T12:00:00Z');
    const res = evaluarRacha(usuario, ahora);
    assert.strictEqual(res.rachaDias, 1);
    assert.strictEqual(res.recordRacha, 1);
  });

  it('Debe mantener la racha si el intento es el mismo día local', () => {
    const ultima = new Date('2026-07-21T01:00:00-03:00'); // Lunes 1:00 AM local
    const ahora = new Date('2026-07-21T23:00:00-03:00'); // Lunes 11:00 PM local
    const usuario = { rachaDias: 2, recordRacha: 2, ultimaLeccionCompletada: ultima };
    
    const res = evaluarRacha(usuario, ahora, 'America/Argentina/Buenos_Aires');
    assert.strictEqual(res.rachaDias, 2);
  });

  it('Debe incrementar la racha si el intento es al día siguiente local', () => {
    const ultima = new Date('2026-07-21T23:30:00-03:00'); // Lunes 11:30 PM local (UTC 2026-07-22T02:30:00Z)
    const ahora = new Date('2026-07-22T22:30:00-03:00'); // Martes 10:30 PM local (UTC 2026-07-23T01:30:00Z)
    const usuario = { rachaDias: 3, recordRacha: 3, ultimaLeccionCompletada: ultima };
    
    const res = evaluarRacha(usuario, ahora, 'America/Argentina/Buenos_Aires');
    assert.strictEqual(res.rachaDias, 4);
    assert.strictEqual(res.recordRacha, 4);
  });

  it('Debe reiniciar la racha a 1 si pasaron más de 48 horas', () => {
    const ultima = new Date('2026-07-20T10:00:00Z');
    const ahora = new Date('2026-07-22T11:00:00Z'); // 49 horas de diferencia
    const usuario = { rachaDias: 5, recordRacha: 5, ultimaLeccionCompletada: ultima };
    
    const res = evaluarRacha(usuario, ahora);
    assert.strictEqual(res.rachaDias, 1);
    assert.strictEqual(res.rachaRota, true);
  });
});

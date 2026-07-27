import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/config/firebase.js';
import { trackEventsBatch } from '../src/services/tracking.service.js';

const TEST_UID = 'test-usuario-telemetria';

function resolverRespuestaPorcentajes(operandos, tipo) {
  const { precioBase = 100, porcentaje = 10, precioFinal = 90 } = operandos || {};
  if (tipo === 'descuento_monto') return String(Math.round((precioBase * porcentaje) / 100));
  if (tipo === 'precio_final') return String(Math.round(precioBase - (precioBase * porcentaje) / 100));
  if (tipo === 'porcentaje_descuento') return String(porcentaje);
  return String(precioFinal);
}

describe('Telemetría y Tracking por Lotes (Batching Optimizado)', () => {
  beforeEach(async () => {
    try {
      const eventosSnap = await db.collection('eventos').where('usuario_id', '==', TEST_UID).get();
      const batch = db.batch();
      eventosSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Error al limpiar Firestore local en tests:', e.message);
    }
  });

  it('1. POST /api/tracking/batch procesa correctamente un lote de eventos', async () => {
    const res = await request(app)
      .post('/api/tracking/batch')
      .set('Authorization', 'Bearer token-valido-telemetria')
      .send({
        eventos: [
          { tipo_evento: 'ejercicio_iniciado', metadata: { sesion_id: 'ses-123', tema: 'porcentajes' } },
          { tipo_evento: 'ejercicio_completado', metadata: { sesion_id: 'ses-123', resultado: 'correcto' } }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.recibidos, 2);
    assert.strictEqual(res.body.procesados, 2);
  });

  it('2. El servicio trackEventsBatch no realiza escrituras de telemetría en Firestore (Cero costo)', async () => {
    await trackEventsBatch(TEST_UID, [
      { tipo_evento: 'ejercicio_iniciado', metadata: { tema: 'porcentajes' } }
    ]);

    const query = await db.collection('eventos')
      .where('usuario_id', '==', TEST_UID)
      .get();

    // Debe ser 0 en Firestore para preservar cuotas
    assert.strictEqual(query.size, 0);
  });

  it('3. POST /api/tracking/batch rechaza eventos fuera de la whitelist', async () => {
    const res = await request(app)
      .post('/api/tracking/batch')
      .set('Authorization', 'Bearer token-valido-telemetria')
      .send({
        eventos: [
          { tipo_evento: 'evento_hackeo_invalido', metadata: { foo: 'bar' } }
        ]
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.procesados, 0);
  });

  it('4. La colección registroIntentos no debe recibir inserciones adicionales', async () => {
    const query = await db.collection('registroIntentos')
      .where('userId', '==', TEST_UID)
      .get();

    assert.strictEqual(query.size, 0);
  });
});

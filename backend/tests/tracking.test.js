// Asegurar uso de emulador antes de cualquier import de Firebase/App
process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';
import { db, auth } from '../src/config/firebase.js';
import { trackEvent } from '../src/services/tracking.service.js';
import { resolverRespuestaPorcentajes } from '../src/exercises/modules/porcentajes.js';

const TEST_UID = 'test-usuario-telemetria';
const originalVerifyIdToken = auth.verifyIdToken;

describe('Telemetría y Tracking de Eventos (Hito 2)', () => {
  before(() => {
    // Mockear auth token
    auth.verifyIdToken = async (token) => {
      if (token === 'token-valido-telemetria') {
        return { uid: TEST_UID, email: 'alumno-telemetria@inova.edu.ar' };
      }
      throw new Error('auth/argument-error');
    };
  });

  after(() => {
    auth.verifyIdToken = originalVerifyIdToken;
  });

  before(async () => {
    // Limpiar progreso huérfano de corridas previas en el emulador
    try {
      await db.collection('usuarios').doc(TEST_UID).collection('progreso').doc('porcentajes').delete();
    } catch (err) {
      // Ignorar si no existe
    }

    // Crear usuario inicial en Firestore Emulator
    await db.collection('usuarios').doc(TEST_UID).set({
      uid: TEST_UID,
      email: 'alumno-telemetria@inova.edu.ar',
      displayName: 'Alumno Telemetría',
      puntosTotales: 100,
      rachaDias: 1,
      recordRacha: 1,
      rolActual: 'principiante',
      createdAt: new Date().toISOString(),
    });
  });

  after(async () => {
    // Limpiar base de datos
    try {
      await db.collection('usuarios').doc(TEST_UID).collection('progreso').doc('porcentajes').delete();
      await db.collection('usuarios').doc(TEST_UID).delete();
      // Eliminar documentos en eventos
      const snap = await db.collection('eventos').where('usuario_id', '==', TEST_UID).get();
      const batch = db.batch();
      snap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Error al limpiar Firestore local:', e.message);
    }
  });

  it('1. El servicio trackEvent debe registrar físicamente un documento en "eventos" de Firestore', async () => {
    const eventType = 'test_evento';
    const metadata = { foo: 'bar', valor: 42 };

    await trackEvent(TEST_UID, eventType, metadata);

    // Buscar en Firestore
    const query = await db.collection('eventos')
      .where('usuario_id', '==', TEST_UID)
      .where('tipo_evento', '==', eventType)
      .get();

    assert.strictEqual(query.size, 1);
    const doc = query.docs[0].data();

    assert.strictEqual(doc.usuario_id, TEST_UID);
    assert.strictEqual(doc.tipo_evento, eventType);
    assert.ok(doc.fecha_hora);
    assert.deepStrictEqual(doc.metadata, metadata);
  });

  it('2. Al iniciar una lección (getLesson), debe registrar el evento "leccion_iniciada"', async () => {
    const res = await request(app)
      .get('/api/modules/porcentajes/lessons/descuentos')
      .set('Authorization', 'Bearer token-valido-telemetria');

    assert.strictEqual(res.status, 200);

    // Pequeño delay para permitir que el tracking asíncrono termine de persistir
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verificar en la colección de eventos
    const query = await db.collection('eventos')
      .where('usuario_id', '==', TEST_UID)
      .where('tipo_evento', '==', 'leccion_iniciada')
      .get();

    assert.strictEqual(query.size, 1);
    const eventData = query.docs[0].data();
    assert.strictEqual(eventData.metadata.leccion_id, 'descuentos');
    assert.strictEqual(eventData.metadata.tema, 'porcentajes');
    assert.strictEqual(eventData.metadata.dificultad, 'medio');
  });

  it('3. Al resolver un ejercicio correctamente, debe registrar "ejercicio_completado" con resultado "correcto"', async () => {
    // Primero obtener el ejercicio para saber la semilla/operandos
    const getRes = await request(app).get('/api/modules/porcentajes/lessons/descuentos');
    const ejYerba = getRes.body.leccion.ejercicios[0];
    const correctAns = resolverRespuestaPorcentajes(ejYerba.operandos, 'descuento_mc');

    const res = await request(app)
      .post('/api/exercises/validate')
      .set('Authorization', 'Bearer token-valido-telemetria')
      .send({
        moduleId: 'porcentajes',
        lessonId: 'descuentos',
        exerciseId: ejYerba.id,
        semilla: ejYerba.semilla,
        operandos: ejYerba.operandos,
        answer: String(correctAns),
        tiempo_segundos: 12
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.correcto, true);

    // Pequeño delay para permitir que el tracking asíncrono termine de persistir
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verificar en eventos
    const query = await db.collection('eventos')
      .where('usuario_id', '==', TEST_UID)
      .where('tipo_evento', '==', 'ejercicio_completado')
      .get();

    // Debe haber un evento de ejercicio_completado con resultado 'correcto'
    const ev = query.docs.find(d => d.data().metadata.resultado === 'correcto');
    assert.ok(ev);
    const evData = ev.data();
    assert.strictEqual(evData.metadata.ejercicio_id, ejYerba.id);
    assert.strictEqual(evData.metadata.tema, 'porcentajes');
    assert.strictEqual(evData.metadata.subtema, 'descuentos');
    assert.strictEqual(evData.metadata.dificultad, 'medio');
    assert.strictEqual(evData.metadata.tiempo_segundos, 12);
  });

  it('4. Al resolver un ejercicio de forma incorrecta, debe registrar "ejercicio_completado" con resultado "incorrecto"', async () => {
    const getRes = await request(app).get('/api/modules/porcentajes/lessons/descuentos');
    const ejYerba = getRes.body.leccion.ejercicios[0];
    const correctAns = resolverRespuestaPorcentajes(ejYerba.operandos, 'descuento_mc');

    const res = await request(app)
      .post('/api/exercises/validate')
      .set('Authorization', 'Bearer token-valido-telemetria')
      .send({
        moduleId: 'porcentajes',
        lessonId: 'descuentos',
        exerciseId: ejYerba.id,
        semilla: ejYerba.semilla,
        operandos: ejYerba.operandos,
        answer: String(correctAns + 100),
        tiempo_segundos: 8
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.correcto, false);

    // Pequeño delay para permitir que el tracking asíncrono termine de persistir
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verificar en eventos
    const query = await db.collection('eventos')
      .where('usuario_id', '==', TEST_UID)
      .where('tipo_evento', '==', 'ejercicio_completado')
      .get();

    const ev = query.docs.find(d => d.data().metadata.resultado === 'incorrecto');
    assert.ok(ev);
    const evData = ev.data();
    assert.strictEqual(evData.metadata.ejercicio_id, ejYerba.id);
    assert.strictEqual(evData.metadata.tiempo_segundos, 8);
  });

  it('5. La colección registroIntentos no debe recibir inserciones adicionales', async () => {
    const query = await db.collection('registroIntentos')
      .where('userId', '==', TEST_UID)
      .get();

    assert.strictEqual(query.size, 0);
  });

  describe('6. Endpoint /api/tracking (Cliente Whitelist)', () => {
    it('Debe registrar con éxito logro_desbloqueado', async () => {
      const res = await request(app)
        .post('/api/tracking')
        .set('Authorization', 'Bearer token-valido-telemetria')
        .send({
          tipo_evento: 'logro_desbloqueado',
          metadata: {
            sesion_id: 'sesion-123',
            logro_id: 'primer_ejercicio',
            nombre_logro: '¡Primer paso!',
            categoria: 'progreso'
          }
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('Debe rechazar con 400 si el evento no está en whitelist', async () => {
      const res = await request(app)
        .post('/api/tracking')
        .set('Authorization', 'Bearer token-valido-telemetria')
        .send({
          tipo_evento: 'evento_prohibido_hack',
          metadata: {
            sesion_id: 'sesion-123'
          }
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /whitelist/);
    });

    it('Debe rechazar con 400 si falta sesion_id', async () => {
      const res = await request(app)
        .post('/api/tracking')
        .set('Authorization', 'Bearer token-valido-telemetria')
        .send({
          tipo_evento: 'logro_desbloqueado',
          metadata: {
            logro_id: 'primer_ejercicio'
          }
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /sesion_id/);
    });

    it('Debe rechazar con 413 si supera el límite de 2KB', async () => {
      const largeComment = 'A'.repeat(3000);
      const res = await request(app)
        .post('/api/tracking')
        .set('Authorization', 'Bearer token-valido-telemetria')
        .send({
          tipo_evento: 'feedback_enviado',
          metadata: {
            sesion_id: 'sesion-123',
            comentario: largeComment
          }
        });

      assert.strictEqual(res.status, 413);
      assert.match(res.body.error, /Too Large/);
    });
  });
});


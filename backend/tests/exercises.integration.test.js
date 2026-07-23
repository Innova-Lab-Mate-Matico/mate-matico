import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Forzar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

import app from '../src/app.js';
import { auth, db } from '../src/config/firebase.js';
import { resolverRespuestaPorcentajes } from '../src/exercises/modules/porcentajes.js';

const originalVerifyIdToken = auth.verifyIdToken;
const TEST_UID = 'test-usuario-ejercicios';

describe('Integración de Ejercicios y Figma - Backend Tests', () => {
  before(() => {
    // Mockear auth token
    auth.verifyIdToken = async (token) => {
      if (token === 'token-valido-ejercicios') {
        return { uid: TEST_UID, email: 'alumno-ejercicios@inova.edu.ar' };
      }
      throw new Error('auth/argument-error');
    };
  });

  after(() => {
    auth.verifyIdToken = originalVerifyIdToken;
  });

  before(async () => {
    // Configurar usuario inicial en Firestore Emulator
    await db.collection('usuarios').doc(TEST_UID).set({
      uid: TEST_UID,
      email: 'alumno-ejercicios@inova.edu.ar',
      displayName: 'Alumno Ejercicios',
      puntosTotales: 100,
      rachaDias: 1,
      recordRacha: 1,
      rolActual: 'principiante',
      createdAt: new Date().toISOString(),
    });

    // Limpiar posibles plantillas preexistentes en Firestore para esta lección/ejercicio
    await db.collection('plantillasEjercicio').doc('porcentajes_descuentos_desc-mc').delete();
    await db.collection('plantillasEjercicio').doc('porcentajes_descuentos_aum-num').delete();
  });

  after(async () => {
    // Limpiar usuario e intentos
    try {
      await db.collection('usuarios').doc(TEST_UID).delete();
      await db.collection('usuarios').doc(TEST_UID).collection('intentos').doc('porcentajes_descuentos_desc-mc').delete();
      await db.collection('usuarios').doc(TEST_UID).collection('intentos').doc('porcentajes_descuentos_aum-num').delete();
      await db.collection('plantillasEjercicio').doc('porcentajes_descuentos_desc-mc').delete();
      await db.collection('plantillasEjercicio').doc('porcentajes_descuentos_aum-num').delete();
    } catch (e) {
      console.warn('Error al limpiar Firestore local:', e.message);
    }
  });

  describe('1. Obtención de Ejercicios (Figma / porcentajes.descuentos)', () => {
    it('Debe retornar los ejercicios de la lección "descuentos" con los enunciados de Figma', async () => {
      const res = await request(app)
        .get('/api/modules/porcentajes/lessons/descuentos');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.leccion.ejercicios));
      assert.strictEqual(res.body.leccion.ejercicios.length, 5);

      const [ej1, ej2] = res.body.leccion.ejercicios;

      // Ejercicio 1 (Yerba - Multiple Choice)
      assert.match(ej1.id, /^desc-mc-\d+/);
      assert.strictEqual(ej1.tipo, 'multiple_choice');
      assert.strictEqual(ej1.tipoGenerador, 'descuento_mc');
      assert.match(ej1.enunciado, /yerba/);
      assert.strictEqual(ej1.opciones.length, 4);
      assert.strictEqual(ej1.respuestaCorrecta, undefined); // No debe viajar al cliente

      // Ejercicio 2 (Internet - Numérico)
      assert.match(ej2.id, /^aum-num-\d+/);
      assert.strictEqual(ej2.tipo, 'numeric');
      assert.strictEqual(ej2.tipoGenerador, 'aumento_numerico');
      assert.match(ej2.enunciado, /internet|luz|gas|agua|cable/);
      assert.strictEqual(ej2.opciones, undefined);
      assert.strictEqual(ej2.respuestaCorrecta, undefined);
    });
  });

  describe('2. Validación de Respuestas (Figma / Yerba e Internet)', () => {
    it('Debe validar correctamente la respuesta correcta del ejercicio de Yerba', async () => {
      const getRes = await request(app).get('/api/modules/porcentajes/lessons/descuentos');
      const ejYerba = getRes.body.leccion.ejercicios[0];
      const correctAns = resolverRespuestaPorcentajes(ejYerba.operandos, 'descuento_mc');

      const res = await request(app)
        .post('/api/exercises/validate')
        .set('Authorization', 'Bearer token-valido-ejercicios')
        .send({
          moduleId: 'porcentajes',
          lessonId: 'descuentos',
          exerciseId: ejYerba.id,
          semilla: ejYerba.semilla,
          operandos: ejYerba.operandos,
          answer: String(correctAns)
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.correcto, true);
      assert.strictEqual(res.body.puntosGanados, 10);
    });

    it('Debe validar correctamente la respuesta correcta del ejercicio de Internet', async () => {
      const getRes = await request(app).get('/api/modules/porcentajes/lessons/descuentos');
      const ejInternet = getRes.body.leccion.ejercicios[1];
      const correctAns = resolverRespuestaPorcentajes(ejInternet.operandos, 'aumento_numerico');

      const res = await request(app)
        .post('/api/exercises/validate')
        .set('Authorization', 'Bearer token-valido-ejercicios')
        .send({
          moduleId: 'porcentajes',
          lessonId: 'descuentos',
          exerciseId: ejInternet.id,
          semilla: ejInternet.semilla,
          operandos: ejInternet.operandos,
          answer: Number(correctAns)
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.correcto, true);
      assert.strictEqual(res.body.puntosGanados, 15);
    });

    it('Debe manejar explicaciones y comodines en respuestas erróneas consecutivas', async () => {
      const getRes = await request(app).get('/api/modules/porcentajes/lessons/descuentos');
      const ejYerba = getRes.body.leccion.ejercicios[0];
      const correctAns = resolverRespuestaPorcentajes(ejYerba.operandos, 'descuento_mc');

      // Primer error
      const res1 = await request(app)
        .post('/api/exercises/validate')
        .set('Authorization', 'Bearer token-valido-ejercicios')
        .send({
          moduleId: 'porcentajes',
          lessonId: 'descuentos',
          exerciseId: ejYerba.id,
          semilla: ejYerba.semilla,
          operandos: ejYerba.operandos,
          answer: String(correctAns + 100)
        });

      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.correcto, false);
      assert.strictEqual(res1.body.habilitarComodin, false);

      // Segundo error consecutivo
      const res2 = await request(app)
        .post('/api/exercises/validate')
        .set('Authorization', 'Bearer token-valido-ejercicios')
        .send({
          moduleId: 'porcentajes',
          lessonId: 'descuentos',
          exerciseId: ejYerba.id,
          semilla: ejYerba.semilla,
          operandos: ejYerba.operandos,
          answer: String(correctAns + 200)
        });

      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.correcto, false);
      assert.strictEqual(res2.body.habilitarComodin, true);
      assert.match(res2.body.comodinPista, /Pista:/);
      assert.match(res2.body.explicacionError, /ahorrás/);
    });
  });
});

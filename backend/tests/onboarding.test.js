import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

// Forzar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Importar la app de Express y dependencias
import app from '../src/app.js';
import { auth, db } from '../src/config/firebase.js';
import { calcularRecomendacionOnboarding } from '../src/services/onboarding.service.js';

// Guardar la función original de verificación de tokens para restaurarla después
const originalVerifyIdToken = auth.verifyIdToken;

describe('Onboarding Adaptativo - Backend Tests', () => {
  before(() => {
    // Interceptar la verificación de Firebase para usar un token simulado en desarrollo/test
    auth.verifyIdToken = async (token) => {
      if (token === 'token-valido-123') {
        return { uid: 'test-usuario-onboarding', email: 'alumno@inova.edu.ar' };
      }
      throw new Error('auth/argument-error');
    };
  });

  after(() => {
    // Restaurar la función original
    auth.verifyIdToken = originalVerifyIdToken;
  });

  // Limpiar el documento del usuario en el Firestore Emulator después de las pruebas
  after(async () => {
    try {
      await db.collection('usuarios').doc('test-usuario-onboarding').delete();
    } catch (e) {
      console.warn('Error al limpiar Firestore local:', e.message);
    }
  });

  describe('1. Motor de Recomendación Inicial (Cálculo determinista)', () => {
    it('Debe sugerir "aritmetica" si la confianza matemática es muy baja (1 o 2)', () => {
      const rec1 = calcularRecomendacionOnboarding({ confianzaMath: 1, edad: 25, intereses: ['ahorro'], nivelEducativo: 'universitaria' });
      const rec2 = calcularRecomendacionOnboarding({ confianzaMath: 2, edad: 15, intereses: ['finanzas'], nivelEducativo: 'secundaria' });

      assert.strictEqual(rec1, 'aritmetica');
      assert.strictEqual(rec2, 'aritmetica');
    });

    it('Debe sugerir "economia" si la confianza es media-alta (>=4) y muestra interés en economía o finanzas', () => {
      const rec = calcularRecomendacionOnboarding({
        confianzaMath: 4,
        edad: 14,
        intereses: ['Ahorro', 'finanzas'],
        nivelEducativo: 'primaria'
      });
      assert.strictEqual(rec, 'economia');
    });

    it('Debe sugerir "porcentajes" si la confianza es media-alta (>=4) y muestra interés en promos o sueldos', () => {
      const rec = calcularRecomendacionOnboarding({
        confianzaMath: 4,
        edad: 14,
        intereses: ['promos', 'sueldos'],
        nivelEducativo: 'primaria'
      });
      assert.strictEqual(rec, 'porcentajes');
    });

    it('Debe sugerir "fracciones" si la confianza es media-alta (>=4) y muestra interés en recetas o repartos', () => {
      const rec = calcularRecomendacionOnboarding({
        confianzaMath: 4,
        edad: 14,
        intereses: ['recetas', 'repartos'],
        nivelEducativo: 'primaria'
      });
      assert.strictEqual(rec, 'fracciones');
    });

    it('Debe sugerir "porcentajes" a usuarios adultos (edad >= 18) con confianza matemática suficiente (>=4)', () => {
      const rec = calcularRecomendacionOnboarding({
        confianzaMath: 4,
        edad: 18,
        intereses: ['videojuegos'],
        nivelEducativo: 'ninguno'
      });
      assert.strictEqual(rec, 'porcentajes');
    });

    it('Debe sugerir "porcentajes" a usuarios con nivel educativo secundario o superior con confianza suficiente (>=3)', () => {
      const rec = calcularRecomendacionOnboarding({
        confianzaMath: 4,
        edad: 12,
        intereses: ['dibujo'],
        nivelEducativo: 'secundaria'
      });
      assert.strictEqual(rec, 'porcentajes');
    });

    it('Debe sugerir "aritmetica" por defecto ante casos no alcanzados por reglas de alta complejidad', () => {
      const rec = calcularRecomendacionOnboarding({
        confianzaMath: 4,
        edad: 10,
        intereses: ['dibujo'],
        nivelEducativo: 'primaria'
      });
      assert.strictEqual(rec, 'aritmetica');
    });
  });

  describe('2. Validaciones del Payload de Onboarding (Middleware)', () => {
    it('Debe retornar 400 si falta la confianza matemática', async () => {
      const res = await request(app)
        .post('/api/onboarding/recomendar')
        .set('Authorization', 'Bearer token-valido-123')
        .send({
          edad: 20,
          nivelEducativo: 'secundaria',
          objetivo: 'Aprender',
          intereses: ['finanzas']
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.error, /confianzaMath/);
    });

    it('Debe retornar 400 si la confianza matemática está fuera de rango (1-5)', async () => {
      const res = await request(app)
        .post('/api/onboarding/recomendar')
        .set('Authorization', 'Bearer token-valido-123')
        .send({
          confianzaMath: 6,
          intereses: ['finanzas']
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /rango/);
    });

    it('Debe retornar 400 si el nivel educativo no es válido', async () => {
      const res = await request(app)
        .post('/api/onboarding/recomendar')
        .set('Authorization', 'Bearer token-valido-123')
        .send({
          confianzaMath: 4,
          intereses: ['finanzas'],
          nivelEducativo: 'doctorado' // inválido
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /nivelEducativo/);
    });

    it('Debe retornar 400 si la edad no es un entero razonable', async () => {
      const res = await request(app)
        .post('/api/onboarding/recomendar')
        .set('Authorization', 'Bearer token-valido-123')
        .send({
          confianzaMath: 4,
          intereses: ['finanzas'],
          edad: 200 // excesivo
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /edad/);
    });

    it('Debe retornar 400 si intereses no es un array o está vacío', async () => {
      const res = await request(app)
        .post('/api/onboarding/recomendar')
        .set('Authorization', 'Bearer token-valido-123')
        .send({
          confianzaMath: 4,
          intereses: 'finanzas' // Debe ser array
        });

      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /intereses/);
    });
  });

  describe('3. Integración de Endpoints y Persistencia en Firestore', () => {
    it('Debe retornar 401 si no se envía token de autenticación', async () => {
      const res = await request(app)
        .post('/api/onboarding')
        .send({
          confianzaMath: 4,
          intereses: ['finanzas']
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Token no proporcionado');
    });

    it('Debe retornar 401 si se envía un token inválido', async () => {
      const res = await request(app)
        .post('/api/onboarding')
        .set('Authorization', 'Bearer token-incorrecto')
        .send({
          confianzaMath: 4,
          intereses: ['finanzas']
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Token inválido o expirado');
    });

    it('POST /api/onboarding/recomendar debe retornar recomendación sin persistir en Firestore', async () => {
      const res = await request(app)
        .post('/api/onboarding/recomendar')
        .set('Authorization', 'Bearer token-valido-123')
        .send({
          confianzaMath: 2,
          intereses: ['ahorro']
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.moduloRecomendado, 'aritmetica');

      // Verificar que el usuario no exista o no tenga onboarding en Firestore
      const userDoc = await db.collection('usuarios').doc('test-usuario-onboarding').get();
      assert.strictEqual(userDoc.exists, false);
    });

    it('POST /api/onboarding debe guardar datos, calcular recomendación y persistir en Firestore', async () => {
      // 1. Asegurar primero que el usuario esté creado para simular el registro previo
      await db.collection('usuarios').doc('test-usuario-onboarding').set({
        uid: 'test-usuario-onboarding',
        email: 'alumno@inova.edu.ar',
        displayName: 'Alumno Test',
        puntosTotales: 0,
        rachaDias: 0,
        createdAt: new Date().toISOString()
      });

      // 2. Hacer post de onboarding
      const payload = {
        edad: 20,
        nivelEducativo: 'secundaria',
        objetivo: 'Aprender finanzas',
        confianzaMath: 4,
        intereses: ['ahorro', 'finanzas']
      };

      const res = await request(app)
        .post('/api/onboarding')
        .set('Authorization', 'Bearer token-valido-123')
        .send(payload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      // Comprobar respuesta serializada
      const user = res.body.usuario;
      assert.strictEqual(user.uid, 'test-usuario-onboarding');
      assert.strictEqual(user.onboarding.completado, true);
      assert.strictEqual(user.onboarding.moduloRecomendado, 'economia');
      assert.strictEqual(user.onboarding.edad, 20);

      // 3. Verificar persistencia real en el Firestore Emulator
      const savedDoc = await db.collection('usuarios').doc('test-usuario-onboarding').get();
      assert.strictEqual(savedDoc.exists, true);
      const data = savedDoc.data();
      assert.strictEqual(data.onboarding.completado, true);
      assert.strictEqual(data.onboarding.moduloRecomendado, 'economia');
      assert.strictEqual(data.onboarding.edad, 20);
      assert.strictEqual(data.onboarding.confianzaMath, 4);
      assert.deepStrictEqual(data.onboarding.intereses, ['ahorro', 'finanzas']);
    });
  });
});

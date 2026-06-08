import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../src/config/firebase.js';
import {
  usuarioToDb,
  dbToUsuario,
  crearPerfilUsuarioInicial,
  serializarUsuario,
} from '../src/models/usuario.model.js';
import {
  crearUsuarioSiNoExiste,
  obtenerUsuario,
  actualizarLogin,
  aplicarRecompensaActividad,
} from '../src/services/usuario.service.js';

// Ensure we run on firestore emulator for tests
process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

describe('Anti-Corruption Layer (ACL) - Mapeo y Persistencia', () => {
  describe('1. Mapeo de Variables (usuarioToDb y dbToUsuario)', () => {
    it('Debe convertir el modelo camelCase/inglés a snake_case/español física de Firestore', () => {
      const appUser = {
        uid: 'user-123',
        displayName: 'Juan Perez',
        email: 'juan@example.com',
        createdAt: '2026-06-08T00:00:00.000Z',
        lastLoginAt: '2026-06-08T01:00:00.000Z',
        puntosTotales: 150,
        rachaDias: 5,
        recordRacha: 10,
        rolActual: 'principiante',
        temaActual: 'Fracciones',
        nivelActual: 'intermedio',
        porcentajeProgreso: 75,
      };

      const dbData = usuarioToDb(appUser);

      assert.strictEqual(dbData.usuario_id, 'user-123');
      assert.strictEqual(dbData.nombre, 'Juan Perez');
      assert.strictEqual(dbData.email, 'juan@example.com');
      assert.strictEqual(dbData.fecha_registro, '2026-06-08T00:00:00.000Z');
      assert.strictEqual(dbData.ultima_conexion, '2026-06-08T01:00:00.000Z');
      assert.strictEqual(dbData.puntos_totales, 150);
      assert.strictEqual(dbData.racha_actual, 5);
      assert.strictEqual(dbData.tema_actual, 'Fracciones');
      assert.strictEqual(dbData.nivel_actual, 'intermedio');
      assert.strictEqual(dbData.porcentaje_progreso, 75);

      // Claves no mapeadas se deben mantener igual
      assert.strictEqual(dbData.recordRacha, 10);
      assert.strictEqual(dbData.rolActual, 'principiante');
    });

    it('Debe convertir la estructura física de Firestore (snake_case/español) a camelCase/inglés de la app', () => {
      const dbData = {
        usuario_id: 'user-123',
        nombre: 'Juan Perez',
        email: 'juan@example.com',
        fecha_registro: '2026-06-08T00:00:00.000Z',
        ultima_conexion: '2026-06-08T01:00:00.000Z',
        puntos_totales: 150,
        racha_actual: 5,
        recordRacha: 10,
        rolActual: 'principiante',
        tema_actual: 'Fracciones',
        nivel_actual: 'intermedio',
        porcentaje_progreso: 75,
      };

      const appUser = dbToUsuario(dbData);

      assert.strictEqual(appUser.uid, 'user-123');
      assert.strictEqual(appUser.displayName, 'Juan Perez');
      assert.strictEqual(appUser.email, 'juan@example.com');
      assert.strictEqual(appUser.createdAt, '2026-06-08T00:00:00.000Z');
      assert.strictEqual(appUser.lastLoginAt, '2026-06-08T01:00:00.000Z');
      assert.strictEqual(appUser.puntosTotales, 150);
      assert.strictEqual(appUser.rachaDias, 5);
      assert.strictEqual(appUser.temaActual, 'Fracciones');
      assert.strictEqual(appUser.nivelActual, 'intermedio');
      assert.strictEqual(appUser.porcentajeProgreso, 75);

      assert.strictEqual(appUser.recordRacha, 10);
      assert.strictEqual(appUser.rolActual, 'principiante');
    });
  });

  describe('2. Integración y Persistencia Física con Firestore Emulator', () => {
    const testUid = 'acl-test-user-999';

    // Clean up before and after tests
    const cleanUser = async () => {
      try {
        await db.collection('usuarios').doc(testUid).delete();
      } catch (e) {}
    };

    test.before(cleanUser);
    test.after(cleanUser);

    it('Debe persistir físicamente en Firestore usando snake_case/español pero leer en camelCase/inglés', async () => {
      // 1. Crear usuario a través del servicio
      const datosIniciales = {
        uid: testUid,
        email: 'testacl@example.com',
        displayName: 'Acl Test User',
        provider: 'password',
      };

      const { usuario, esNuevo } = await crearUsuarioSiNoExiste(datosIniciales);
      assert.strictEqual(esNuevo, true);
      assert.strictEqual(usuario.uid, testUid);
      assert.strictEqual(usuario.puntosTotales, 0);
      assert.strictEqual(usuario.displayName, 'Acl Test User');
      assert.strictEqual(usuario.temaActual, '');
      assert.strictEqual(usuario.nivelActual, '');
      assert.strictEqual(usuario.porcentajeProgreso, 0);

      // 2. Verificar físicamente en Firestore (sin mapeo) para asegurar que está en snake_case
      const doc = await db.collection('usuarios').doc(testUid).get();
      assert.strictEqual(doc.exists, true);
      const rawData = doc.data();

      // Deberían existir las propiedades físicas de base de datos
      assert.strictEqual(rawData.usuario_id, testUid);
      assert.strictEqual(rawData.nombre, 'Acl Test User');
      assert.strictEqual(rawData.email, 'testacl@example.com');
      assert.strictEqual(rawData.puntos_totales, 0);
      assert.strictEqual(rawData.racha_actual, 0);
      assert.strictEqual(rawData.tema_actual, '');
      assert.strictEqual(rawData.nivel_actual, '');
      assert.strictEqual(rawData.porcentaje_progreso, 0);

      // No deberían existir propiedades del formato app internamente en Firestore
      assert.strictEqual(rawData.uid, undefined);
      assert.strictEqual(rawData.displayName, undefined);
      assert.strictEqual(rawData.puntosTotales, undefined);
      assert.strictEqual(rawData.rachaDias, undefined);
      assert.strictEqual(rawData.temaActual, undefined);
      assert.strictEqual(rawData.nivelActual, undefined);
      assert.strictEqual(rawData.porcentajeProgreso, undefined);

      // 3. Recuperar usuario a través de obtenerUsuario y validar que viene mapeado
      const retrieved = await obtenerUsuario(testUid);
      assert.strictEqual(retrieved.uid, testUid);
      assert.strictEqual(retrieved.displayName, 'Acl Test User');
      assert.strictEqual(retrieved.puntosTotales, 0);
      assert.strictEqual(retrieved.rachaDias, 0);
      assert.strictEqual(retrieved.temaActual, '');
      assert.strictEqual(retrieved.nivelActual, '');
      assert.strictEqual(retrieved.porcentajeProgreso, 0);

      // 4. Actualizar login y verificar persistencia
      await actualizarLogin(testUid, {
        displayName: 'Acl Test User Modificado',
        photoURL: 'http://pic.url',
        provider: 'google.com',
      });

      const rawDocAfterLogin = await db.collection('usuarios').doc(testUid).get();
      const rawDataAfterLogin = rawDocAfterLogin.data();
      assert.strictEqual(rawDataAfterLogin.nombre, 'Acl Test User Modificado');
      assert.strictEqual(rawDataAfterLogin.photoURL, 'http://pic.url');
      assert.strictEqual(rawDataAfterLogin.provider, 'google.com');
      assert.ok(rawDataAfterLogin.ultima_conexion);

      // 5. Aplicar recompensa de actividad (transaccional) y verificar
      const recompensa = await aplicarRecompensaActividad(testUid, 50, { actualizarRacha: true });
      assert.strictEqual(recompensa.puntosTotales, 50);

      const rawDocAfterRecompensa = await db.collection('usuarios').doc(testUid).get();
      const rawDataAfterRecompensa = rawDocAfterRecompensa.data();
      assert.strictEqual(rawDataAfterRecompensa.puntos_totales, 50);
      assert.strictEqual(rawDataAfterRecompensa.racha_actual, 1);
    });
  });
});

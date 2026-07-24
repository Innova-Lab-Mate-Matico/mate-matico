import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { validateExplainBody } from '../src/middleware/validate.js';

describe('validateExplainBody Middleware', () => {
  it('Debe pasar (llamar a next) si todos los campos son válidos', () => {
    let nextCalled = false;
    const req = {
      body: {
        moduleId: 'aritmetica',
        lessonId: 'suma-basica',
        theoryId: 'suma',
        question: '¿Cómo sumo 2 + 2?',
        sesion_id: 'uuid-123',
        history: [
          { role: 'user', text: 'Hola' },
          { role: 'model', text: 'Hola, ¿en qué te ayudo?' }
        ]
      }
    };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    const next = () => {
      nextCalled = true;
    };

    validateExplainBody(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.statusCode, undefined);
  });

  it('Debe retornar 400 si falta un campo requerido (ej. sesion_id)', () => {
    let nextCalled = false;
    const req = {
      body: {
        moduleId: 'aritmetica',
        lessonId: 'suma-basica',
        theoryId: 'suma',
        question: '¿Cómo sumo 2 + 2?'
      }
    };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    const next = () => {
      nextCalled = true;
    };

    validateExplainBody(req, res, next);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /sesion_id/);
  });

  it('Debe retornar 400 si el historial tiene un rol inválido', () => {
    let nextCalled = false;
    const req = {
      body: {
        moduleId: 'aritmetica',
        lessonId: 'suma-basica',
        theoryId: 'suma',
        question: '¿Cómo sumo?',
        sesion_id: 'uuid-123',
        history: [
          { role: 'admin', text: 'Hola' }
        ]
      }
    };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    const next = () => {
      nextCalled = true;
    };

    validateExplainBody(req, res, next);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.error, /role/);
  });
});

import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { reconstruirEjercicio } from '../src/exercises/registry.js';

describe('Reconstruir Ejercicio - Fallback de Semilla', () => {
  it('Debe extraer la semilla directamente del exerciseId si posee formato con semilla al final', () => {
    // Si el exerciseId es suma_mc-777, debe extraer 777
    const ej = reconstruirEjercicio('aritmetica', 'suma-basica', 'suma_mc-777', null, { a: 10, b: 5 });
    assert.strictEqual(ej.semilla, 777);
  });

  it('Debe aplicar el Fallback 1: Usar la semilla provista si el exerciseId no contiene una semilla numérica al final', () => {
    const ej = reconstruirEjercicio('aritmetica', 'suma-basica', 'suma_mc-xyz', 42, { a: 10, b: 5 });
    assert.strictEqual(ej.semilla, 42);
  });

  it('Debe aplicar el Fallback 2: Buscar en los operandos si la semilla no se puede obtener del ID ni del parámetro directo', () => {
    const ej = reconstruirEjercicio('aritmetica', 'suma-basica', 'suma_mc-xyz', undefined, { a: 10, b: 5, semilla: 888 });
    assert.strictEqual(ej.semilla, 888);
  });

  it('Debe aplicar el Fallback 3 (Estática): Usar 12345 si no hay ninguna opción numérica válida', () => {
    const ej = reconstruirEjercicio('aritmetica', 'suma-basica', 'suma_mc-xyz', undefined, { a: 10, b: 5 });
    assert.strictEqual(ej.semilla, 12345);
  });
});

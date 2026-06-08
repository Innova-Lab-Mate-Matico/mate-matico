import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { Ejercicio } from '../src/exercises/domain/Ejercicio.js';
import { EjercicioMultipleChoice } from '../src/exercises/domain/EjercicioMultipleChoice.js';
import { EjercicioNumerico } from '../src/exercises/domain/EjercicioNumerico.js';
import { FabricaEjercicios } from '../src/exercises/domain/FabricaEjercicios.js';
import { resolverRespuestaPorcentajes } from '../src/exercises/modules/porcentajes.js';
import { resolverRespuestaAritmetica } from '../src/exercises/modules/aritmeticaBasica.js';
import { resolverRespuestaFracciones } from '../src/exercises/modules/fracciones.js';

describe('Modelo de Dominio de Ejercicios (OOP/SOLID)', () => {
  describe('1. Clase Abstracta Ejercicio', () => {
    it('Debe lanzar un error si se intenta instanciar directamente', () => {
      assert.throws(() => {
        new Ejercicio({ id: 'base-1', tipo: 'abstract' });
      }, /No podés instanciar una clase abstracta directamente/);
    });
  });

  describe('2. EjercicioMultipleChoice', () => {
    const datosMC = {
      id: 'pct-mc-test',
      tipo: 'multiple_choice',
      enunciado: '¿Cuánto es el 20% de 12000?',
      puntos: 10,
      comodinPista: 'Pista de prueba',
      explicacionError: 'Explicación de prueba',
      opciones: ['1200', '2400', '3400', '14400'],
      respuestaCorrecta: '2400',
      operandos: { precio: 12000, descuento: 20, operacion: 'descuento' }
    };

    it('Debe instanciarse correctamente con sus opciones', () => {
      const ej = new EjercicioMultipleChoice(datosMC);
      assert.strictEqual(ej.id, 'pct-mc-test');
      assert.strictEqual(ej.tipo, 'multiple_choice');
      assert.deepStrictEqual(ej.opciones, ['1200', '2400', '3400', '14400']);
      assert.strictEqual(ej.respuestaCorrecta, '2400');
    });

    it('Debe validar correctamente ignorando espacios y mayúsculas/minúsculas', () => {
      const ej = new EjercicioMultipleChoice(datosMC);
      assert.strictEqual(ej.validar('2400'), true);
      assert.strictEqual(ej.validar('  2400  '), true);
      assert.strictEqual(ej.validar('1200'), false);
      assert.strictEqual(ej.validar(null), false);
    });

    it('Debe serializar para el cliente excluyendo la respuesta correcta', () => {
      const ej = new EjercicioMultipleChoice(datosMC);
      const clienteObj = ej.serializarParaCliente();
      
      assert.strictEqual(clienteObj.id, 'pct-mc-test');
      assert.strictEqual(clienteObj.tipo, 'multiple_choice');
      assert.strictEqual(clienteObj.enunciado, '¿Cuánto es el 20% de 12000?');
      assert.deepStrictEqual(clienteObj.opciones, ['1200', '2400', '3400', '14400']);
      assert.deepStrictEqual(clienteObj.operandos, { precio: 12000, descuento: 20, operacion: 'descuento' });
      assert.strictEqual(clienteObj.puntos, 10);
      assert.strictEqual(clienteObj.respuestaCorrecta, undefined);
    });
  });

  describe('3. EjercicioNumerico', () => {
    const datosNum = {
      id: 'pct-num-test',
      tipo: 'numeric',
      enunciado: 'Tu servicio cuesta 18000 y aumenta 10%. ¿Cuánto pagás?',
      puntos: 15,
      comodinPista: 'Suma el 10%',
      explicacionError: '18000 * 1.10 = 19800',
      respuestaCorrecta: 19800,
      operandos: { precio: 18000, aumento: 10, operacion: 'aumento' }
    };

    it('Debe instanciarse correctamente', () => {
      const ej = new EjercicioNumerico(datosNum);
      assert.strictEqual(ej.id, 'pct-num-test');
      assert.strictEqual(ej.tipo, 'numeric');
      assert.strictEqual(ej.respuestaCorrecta, 19800);
    });

    it('Debe validar correctamente con tolerancia decimal (Épsilon de 0.01)', () => {
      const ej = new EjercicioNumerico(datosNum);
      assert.strictEqual(ej.validar('19800'), true);
      assert.strictEqual(ej.validar(19800), true);
      assert.strictEqual(ej.validar(19800.005), true); // Dentro de la tolerancia
      assert.strictEqual(ej.validar(19800.02), false); // Fuera de la tolerancia
      assert.strictEqual(ej.validar('no-un-numero'), false);
    });

    it('Debe serializar para el cliente excluyendo la respuesta correcta y opciones', () => {
      const ej = new EjercicioNumerico(datosNum);
      const clienteObj = ej.serializarParaCliente();
      
      assert.strictEqual(clienteObj.id, 'pct-num-test');
      assert.strictEqual(clienteObj.tipo, 'numeric');
      assert.strictEqual(clienteObj.enunciado, 'Tu servicio cuesta 18000 y aumenta 10%. ¿Cuánto pagás?');
      assert.strictEqual(clienteObj.opciones, undefined);
      assert.strictEqual(clienteObj.respuestaCorrecta, undefined);
    });
  });

  describe('4. FabricaEjercicios', () => {
    it('Debe crear instancias correctas según el tipo', () => {
      const mc = FabricaEjercicios.crear({ tipo: 'multiple_choice', id: '1', respuestaCorrecta: 'A' });
      const num = FabricaEjercicios.crear({ tipo: 'numeric', id: '2', respuestaCorrecta: 42 });

      assert.ok(mc instanceof EjercicioMultipleChoice);
      assert.ok(num instanceof EjercicioNumerico);
    });

    it('Debe lanzar error si el tipo no es soportado', () => {
      assert.throws(() => {
        FabricaEjercicios.crear({ tipo: 'unknown_type', id: '3' });
      }, /Tipo de ejercicio no soportado/);
    });
  });

  describe('5. Resolvers de Módulos Matemáticos con Contexto de Plantilla', () => {
    it('Debe resolver respuestas de porcentajes usando el tipo de generador para distinguir propósitos', () => {
      const resAhorro = resolverRespuestaPorcentajes(
        { precio: 12000, descuento: 20 },
        'descuento_mc'
      );
      assert.strictEqual(resAhorro, 2400);

      const resAumento = resolverRespuestaPorcentajes(
        { precio: 18000, porcentaje: 10 },
        'aumento_numerico'
      );
      assert.strictEqual(resAumento, 19800);

      const resBase = resolverRespuestaPorcentajes(
        { base: 100, porcentaje: 25 },
        'porcentaje_mc'
      );
      assert.strictEqual(resBase, 25);
    });

    it('Debe resolver respuestas de aritmética básica usando el tipo de generador', () => {
      const resSuma = resolverRespuestaAritmetica({ a: 10, b: 5 }, 'suma_num');
      assert.strictEqual(resSuma, 15);

      const resResta = resolverRespuestaAritmetica({ a: 10, b: 5 }, 'resta_mc');
      assert.strictEqual(resResta, 5);
    });

    it('Debe resolver respuestas de fracciones usando el tipo de generador', () => {
      const resFrac = resolverRespuestaFracciones({ num: 3, den: 4 }, 'fraccion_decimal_mc');
      assert.strictEqual(resFrac, 0.75);
    });
  });
});

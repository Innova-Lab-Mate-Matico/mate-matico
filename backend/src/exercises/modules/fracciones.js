import { crearGeneradorSemilla, enteroAleatorio } from '../utils/seededRandom.js';
import { opcionesMultiples } from '../utils/distractores.js';

const FRACCIONES = [
  { num: 1, den: 2, decimal: 0.5 },
  { num: 1, den: 4, decimal: 0.25 },
  { num: 3, den: 4, decimal: 0.75 },
  { num: 1, den: 3, decimal: 0.33 },
  { num: 1, den: 5, decimal: 0.2 },
  { num: 2, den: 5, decimal: 0.4 },
  { num: 3, den: 5, decimal: 0.6 },
  { num: 4, den: 5, decimal: 0.8 },
  { num: 1, den: 10, decimal: 0.1 },
  { num: 3, den: 10, decimal: 0.3 },
  { num: 7, den: 10, decimal: 0.7 },
  { num: 9, den: 10, decimal: 0.9 },
];

const PLANTILLAS = {
  fraccion_decimal_mc: {
    generar: (rng) => {
      const f = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      const opciones = opcionesMultiples(f.decimal, rng).map((o) =>
        o === String(f.decimal) ? String(f.decimal) : o
      );
      return {
        id: 'frac-mc',
        tipo: 'multiple_choice',
        enunciado: `¿Qué decimal representa ${f.num}/${f.den}?`,
        opciones: [...new Set([...opciones, '0.5', '0.25', '0.75'])].slice(0, 4),
        operandos: { num: f.num, den: f.den, operacion: 'fraccion_decimal' },
        respuestaCorrecta: f.decimal,
        explicacionError: `${f.num}/${f.den} representa tomar ${f.num} partes de un entero que dividimos en ${f.den} partes. Si hacés la división con la calculadora o a mano (${f.num} dividido por ${f.den}), obtenés exactamente ${f.decimal}. Recordá que toda fracción es simplemente una división en proceso.`,
        comodinPista: `Pista: ${f.den} partes iguales; te quedás con ${f.num}.`,
        puntos: 10,
      };
    },
  },
  decimal_fraccion_mc: {
    generar: (rng) => {
      const f = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      const correctFraction = `${f.num}/${f.den}`;
      const distractores = [
        `${f.num}/${f.den + 1}`,
        `${f.num + 1}/${f.den}`,
        `${f.den}/${f.num}`,
        '1/6',
        '2/3',
        '3/8'
      ].filter(d => d !== correctFraction);
      
      const opciones = [correctFraction, ...distractores.slice(0, 3)].sort(() => enteroAleatorio(rng, -1, 1));
      
      return {
        id: 'dec-frac-mc',
        tipo: 'multiple_choice',
        enunciado: `¿Qué fracción representa el decimal ${f.decimal}?`,
        opciones: [...new Set(opciones)].slice(0, 4),
        operandos: { decimal: f.decimal, num: f.num, den: f.den, operacion: 'decimal_fraccion' },
        respuestaCorrecta: correctFraction,
        explicacionError: `El decimal ${f.decimal} se lee como ${Math.round(f.decimal * 100)} centésimos. Por lo tanto, se escribe como la fracción ${Math.round(f.decimal * 100)}/100. Al simplificarla (dividiendo numerador y denominador por el mismo número para achicarlo), llegamos a la fracción equivalente ${f.num}/${f.den}.`,
        comodinPista: `Pista: El decimal ${f.decimal} es igual a ${Math.round(f.decimal * 100)}/100, simplificado nos da ${f.num}/${f.den}.`,
        puntos: 10,
      };
    },
  },
  fraccion_comparar_mc: {
    generar: (rng) => {
      let f1 = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      let f2 = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      while (f1.decimal === f2.decimal) {
        f2 = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      }
      
      const isGreater = f1.decimal > f2.decimal;
      const correctAns = isGreater ? `${f1.num}/${f1.den}` : `${f2.num}/${f2.den}`;
      const opciones = [`${f1.num}/${f1.den}`, `${f2.num}/${f2.den}`, 'Son iguales'];
      
      return {
        id: 'frac-comp-mc',
        tipo: 'multiple_choice',
        enunciado: `¿Cuál de las siguientes fracciones es mayor?`,
        opciones,
        operandos: { 
          num1: f1.num, den1: f1.den, val1: f1.decimal,
          num2: f2.num, den2: f2.den, val2: f2.decimal,
          operacion: 'comparacion' 
        },
        respuestaCorrecta: correctAns,
        explicacionError: `Para comparar fracciones fácilmente, podés pasarlas a su formato decimal: \n• ${f1.num}/${f1.den} equivale a ${f1.decimal}\n• ${f2.num}/${f2.den} equivale a ${f2.decimal}.\nAl comparar ambos decimales, vemos claramente que la mayor es ${correctAns}.`,
        comodinPista: `Pista: Dividí cada fracción para ver su valor decimal: ${f1.num}/${f1.den} es ${f1.decimal} y ${f2.num}/${f2.den} es ${f2.decimal}.`,
        puntos: 10,
      };
    },
  },
  fraccion_equivalente_mc: {
    generar: (rng) => {
      const f = FRACCIONES[enteroAleatorio(rng, 0, FRACCIONES.length - 1)];
      const factor = enteroAleatorio(rng, 2, 4);
      const equivNum = f.num * factor;
      const equivDen = f.den * factor;
      const correctOption = `${equivNum}/${equivDen}`;
      
      const opciones = [
        correctOption,
        `${f.num}/${f.den + 1}`,
        `${f.num + 1}/${f.den}`,
        `${f.den}/${f.num}`
      ].filter((val, idx, self) => self.indexOf(val) === idx && val !== `${f.num}/${f.den}`);
      
      while (opciones.length < 4) {
        const numRand = enteroAleatorio(rng, 1, 9);
        const denRand = enteroAleatorio(rng, 2, 10);
        const opt = `${numRand}/${denRand}`;
        if (opt !== `${f.num}/${f.den}` && opt !== correctOption) {
          opciones.push(opt);
        }
      }
      
      const opcionesMezcladas = opciones.sort(() => rng() - 0.5);
      
      return {
        id: 'frac-equiv-mc',
        tipo: 'multiple_choice',
        enunciado: `¿Cuál de las siguientes fracciones es equivalente a ${f.num}/${f.den}?`,
        opciones: opcionesMezcladas,
        operandos: { num: f.num, den: f.den, equivNum, equivDen, operacion: 'equivalente' },
        respuestaCorrecta: correctOption,
        explicacionError: `Dos fracciones son equivalentes si representan la misma porción de un todo. Para hallar una fracción equivalente de ${f.num}/${f.den}, multiplicamos (o dividimos) tanto el numerador como el denominador por el mismo número entero. En este caso, si multiplicamos por ${factor} arriba y abajo, obtenemos ${equivNum}/${equivDen}. Ambas representan exactamente el mismo valor decimal (${f.decimal}).`,
        comodinPista: `Pista: Intentá multiplicar o dividir el numerador y denominador de ${f.num}/${f.den} por el mismo número para ver cuál coincide.`,
        puntos: 10,
      };
    }
  },
  cocina_suma_num: {
    generar: (rng) => {
      const dens = [3, 4, 5, 10];
      const den = dens[enteroAleatorio(rng, 0, dens.length - 1)];
      const num1 = enteroAleatorio(rng, 1, Math.floor(den / 2));
      const num2 = enteroAleatorio(rng, 1, Math.floor(den / 2));
      const totalNum = num1 + num2;
      
      const ingredient = ['leche', 'azúcar', 'harina', 'agua', 'aceite'][enteroAleatorio(rng, 0, 4)];
      
      return {
        id: 'cocina-suma-num',
        tipo: 'numeric',
        enunciado: `Para una receta de cocina necesitás ${num1}/${den} de taza de ${ingredient} y luego agregás ${num2}/${den} de taza más. ¿Qué fracción de taza tenés en total? (Ingresá tu respuesta como decimal redondeado a dos cifras, ej: 0.5 o 0.75).`,
        operandos: { num1, num2, den, operacion: 'cocina_suma' },
        respuestaCorrecta: Math.round((totalNum / den) * 100) / 100,
        explicacionError: `Cuando sumamos fracciones que comparten el mismo denominador (${den}), sumamos directamente sus numeradores porque las porciones son del mismo tamaño: ${num1} + ${num2} = ${totalNum} partes en total. Eso nos da la fracción ${totalNum}/${den}, que al dividirla equivale al decimal ${Math.round((totalNum / den) * 100) / 100}.`,
        comodinPista: `Pista: Al tener el mismo denominador, la cantidad total de tazas es (${num1} + ${num2}) / ${den}.`,
        puntos: 15,
      };
    }
  },
  decimales_dinero_mc: {
    generar: (rng) => {
      const dineroOpts = [
        { desc: '25 centavos', val: 0.25, fr: '1/4' },
        { desc: '50 centavos', val: 0.5, fr: '1/2' },
        { desc: '75 centavos', val: 0.75, fr: '3/4' },
        { desc: '10 centavos', val: 0.1, fr: '1/10' },
        { desc: '20 centavos', val: 0.2, fr: '1/5' },
      ];
      
      const item = dineroOpts[enteroAleatorio(rng, 0, dineroOpts.length - 1)];
      const opciones = ['1/4', '1/2', '3/4', '1/10', '1/5', '1/3', '2/5'];
      const filteredDistractors = opciones.filter(o => o !== item.fr);
      const opcionesFinales = [item.fr, ...filteredDistractors.slice(0, 3)].sort(() => rng() - 0.5);
      
      return {
        id: 'dec-dinero-mc',
        tipo: 'multiple_choice',
        enunciado: `Si tenés una moneda de ${item.desc} (que representa $${item.val}), ¿qué fracción de 1 peso representa esa moneda?`,
        opciones: opcionesFinales,
        operandos: { desc: item.desc, val: item.val, fr: item.fr, operacion: 'dinero' },
        respuestaCorrecta: item.fr,
        explicacionError: `Pensalo con monedas de centavos: para juntar un peso entero ($1.00) necesitás exactamente ${1 / item.val} monedas de ${item.desc}. Como estás considerando solo una de esas monedas, representás esa cantidad como 1 de cada ${1 / item.val} partes del peso, lo que equivale a la fracción ${item.fr}.`,
        comodinPista: `Pista: Pensá cuántas monedas de ${item.desc} necesitás para juntar 1 peso entero ($1.00).`,
        puntos: 10,
      };
    }
  },
};
 
export function generarEjercicioFracciones(tipoGenerador, semilla) {
  const plantilla = PLANTILLAS[tipoGenerador];
  if (!plantilla) return null;
  const rng = crearGeneradorSemilla(semilla);
  return { ...plantilla.generar(rng), semilla };
}
 
export function resolverRespuestaFracciones(operandos, tipoGenerador = null) {
  if (tipoGenerador) {
    switch (tipoGenerador) {
      case 'fraccion_decimal_mc': {
        const { num, den } = operandos;
        return Math.round((num / den) * 100) / 100;
      }
      case 'decimal_fraccion_mc': {
        const { num, den } = operandos;
        return `${num}/${den}`;
      }
      case 'fraccion_comparar_mc': {
        const { num1, den1, val1, num2, den2, val2 } = operandos;
        return val1 > val2 ? `${num1}/${den1}` : `${num2}/${den2}`;
      }
      case 'fraccion_equivalente_mc': {
        const { num, den, equivNum, equivDen } = operandos;
        return `${equivNum}/${equivDen}`;
      }
      case 'cocina_suma_num': {
        const { num1, num2, den } = operandos;
        return Math.round(((num1 + num2) / den) * 100) / 100;
      }
      case 'decimales_dinero_mc': {
        const { fr } = operandos;
        return fr;
      }
      default:
        break;
    }
  }
 
  const { num, den } = operandos;
  if (num && den) {
    return Math.round((num / den) * 100) / 100;
  }
  return null;
}
 
export const TIPOS_FRACCIONES = Object.keys(PLANTILLAS);

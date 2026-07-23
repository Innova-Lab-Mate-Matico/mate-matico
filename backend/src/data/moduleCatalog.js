/**
 * Catálogo de módulos y lecciones (metadatos).
 * Los ejercicios se generan dinámicamente vía src/exercises/registry.js
 */
export const moduleCatalog = [
  {
    id: 'aritmetica',
    title: 'Base aritmética',
    description: 'Sumar, restar, multiplicar y dividir',
    branch: 'aritmetica',
    order: 1,
    rolSugerido: 'principiante',
    levels: [
      {
        id: 'nivel-1',
        title: 'Nivel 1 — Operaciones básicas',
        difficulty: 1,
        lessons: [
          {
            id: 'suma-basica',
            title: 'Suma básica',
            durationMinutes: 4,
            teoria: [
              {
                titulo: "¿Por qué es importante sumar?",
                explicacionTitle: "Explicación breve",
                explicacion: "Sumar es agrupar o juntar cantidades. Cuando tenés varias cosas y querés saber el total, la suma es tu mejor herramienta diaria.",
                ejemploTitle: "Situación cotidiana",
                ejemplo: "Vas a la verdulería y comprás manzanas por $15 y bananas por $25. Para saber el total del gasto, hacés una suma básica: 15 + 25 = 40."
              }
            ]
          },
          {
            id: 'resta-basica',
            title: 'Resta básica',
            durationMinutes: 4,
            teoria: [
              {
                titulo: "¿Por qué es importante restar?",
                explicacionTitle: "Explicación breve",
                explicacion: "Restar es quitar una cantidad de otra para encontrar la diferencia o lo que queda.",
                ejemploTitle: "Situación cotidiana",
                ejemplo: "Tenés $100 y comprás un chocolate que cuesta $40. Para saber cuánto vuelto te queda, hacés una resta básica: 100 - 40 = 60."
              }
            ]
          }
        ],
      },
      {
        id: 'nivel-2',
        title: 'Nivel 2 — Operaciones combinadas',
        difficulty: 2,
        lessons: [
          { id: 'multiplicacion', title: 'Multiplicación', durationMinutes: 5 },
          {
            id: 'division',
            title: 'División',
            durationMinutes: 5,
            teoria: [
              {
                titulo: "¿Qué significa dividir?",
                explicacionTitle: "Repartir en partes iguales",
                explicacion: "Dividir es repartir una cantidad total en partes iguales. Nos permite saber cuántas partes recibe cada uno o cuántos grupos se pueden armar.",
                ejemploTitle: "Situación cotidiana",
                ejemplo: "Tenés 12 alfajores y querés repartirlos en partes iguales entre 3 amigos. Hacés una división básica: 12 ÷ 3 = 4 alfajores para cada uno."
              }
            ]
          }
        ],
      },
    ],
  },
  {
    id: 'porcentajes',
    title: 'Porcentajes',
    description: 'Descuentos, aumentos y significado del %',
    branch: 'porcentajes',
    order: 2,
    rolSugerido: 'intermedio',
    levels: [
      {
        id: 'nivel-1',
        title: 'Nivel 1 — Qué es un porcentaje',
        difficulty: 1,
        lessons: [
          {
            id: 'concepto-porcentaje',
            title: 'Concepto de porcentaje',
            durationMinutes: 4,
            teoria: [
              {
                titulo: "¿Qué significa el símbolo %?",
                explicacionTitle: "El porcentaje en partes",
                explicacion: "El porcentaje representa una fracción con denominador 100. Hablar del 20% es lo mismo que decir 20 de cada 100 partes de una cantidad.",
                ejemploTitle: "Situación cotidiana",
                ejemplo: "Si en un salón de 100 personas, el 15% son zurdas, significa que hay exactamente 15 personas zurdas por cada 100."
              }
            ]
          },
        ],
      },
      {
        id: 'nivel-2',
        title: 'Nivel 2 — Descuentos',
        difficulty: 2,
        lessons: [
          {
            id: 'descuentos',
            title: 'Calcular descuentos',
            durationMinutes: 5,
            teoria: [
              {
                titulo: "¿Cómo calculamos un descuento?",
                explicacionTitle: "Ahorro al comprar",
                explicacion: "Un descuento reduce el precio original de un producto. Se calcula el porcentaje correspondiente del precio y luego se resta del valor original.",
                ejemploTitle: "Situación cotidiana",
                ejemplo: "Una remera cuesta $1000 y tiene 10% de descuento. El 10% de $1000 es $100. Pagás entonces $1000 − $100 = $900."
              }
            ]
          },
        ],
      },
    ],
  },
  {
    id: 'fracciones',
    title: 'Fracciones y decimales',
    description: 'Relación fracción ↔ decimal en la vida cotidiana',
    branch: 'fracciones',
    order: 3,
    rolSugerido: 'intermedio',
    levels: [
      {
        id: 'nivel-1',
        title: 'Nivel 1 — Fracciones habituales',
        difficulty: 1,
        lessons: [
          {
            id: 'fracciones-basicas',
            title: 'Fracciones básicas',
            durationMinutes: 4,
            teoria: [
              {
                titulo: "Partes de un entero",
                explicacionTitle: "Las fracciones",
                explicacion: "Una fracción indica cuántas partes iguales tomamos de un objeto dividido. El numerador es lo que tomamos y el denominador las partes totales.",
                ejemploTitle: "Situación cotidiana",
                ejemplo: "Dividís una pizza en 4 partes iguales y te comés 1 porción. Comiste 1/4 de la pizza y te quedan 3/4."
              }
            ]
          },
          {
            id: 'fracciones-equivalentes',
            title: 'Fracciones equivalentes',
            durationMinutes: 5,
            teoria: [
              {
                titulo: "Fracciones Equivalentes",
                explicacionTitle: "Comer lo mismo en más porciones",
                explicacion: "Dos fracciones son equivalentes cuando representan la misma cantidad, aunque tengan números distintos.",
                ejemploTitle: "El ejemplo del chocolate",
                ejemplo: "Comer 1/2 chocolate es exactamente lo mismo que comer 2/4 del mismo chocolate. ¡La porción final es idéntica!"
              }
            ]
          }
        ],
      },
      {
        id: 'nivel-2',
        title: 'Nivel 2 — Operaciones y dinero',
        difficulty: 2,
        lessons: [
          {
            id: 'cocina-suma',
            title: 'Fracciones en la cocina',
            durationMinutes: 6,
            teoria: [
              {
                titulo: "Sumar Fracciones",
                explicacionTitle: "Unir ingredientes",
                explicacion: "Para sumar fracciones con igual denominador, se suman los numeradores y se mantiene el denominador común.",
                ejemploTitle: "Receta de torta",
                ejemplo: "Si una receta pide 1/4 taza de azúcar común y 2/4 taza de azúcar impalpable, en total agregás 3/4 taza de azúcar."
              }
            ]
          },
          {
            id: 'decimales-dinero',
            title: 'Decimales y dinero',
            durationMinutes: 5,
            teoria: [
              {
                titulo: "Fracciones y Monedas",
                explicacionTitle: "Los centavos son fracciones",
                explicacion: "Nuestras monedas de centavos son partes de 1 peso. 25 centavos es 0.25 pesos, lo que equivale a 1/4 de peso.",
                ejemploTitle: "Pagar con monedas",
                ejemplo: "Si pagás con tres monedas de 25 centavos, sumás $0.75, lo que representa exactamente 3/4 de 1 peso."
              }
            ]
          }
        ]
      }
    ],
  },
  {
    id: 'economia',
    title: 'Economía doméstica',
    description: 'IVA, interés, presupuesto y proporciones del día a día',
    branch: 'economia',
    order: 4,
    rolSugerido: 'principiante',
    levels: [
      {
        id: 'nivel-1',
        title: 'Nivel 1 — Precios y proporciones',
        difficulty: 1,
        lessons: [
          {
            id: 'iva-basico',
            title: 'IVA y precios',
            durationMinutes: 5,
            teoria: [
              {
                titulo: '¿Qué es el IVA?',
                explicacionTitle: 'El impuesto que pagamos todos los días',
                explicacion: 'El IVA (Impuesto al Valor Agregado) es un impuesto que el Estado cobra sobre casi todos los productos y servicios. En Argentina, la tasa general es del 21%. Esto significa que al precio de lista del producto se le suma el 21% extra, y ese total es lo que vos pagás en la caja.',
                ejemploTitle: 'Situación cotidiana',
                ejemplo: 'Una remera cuesta $2.000 "neto" (sin IVA). Para calcular el precio final con IVA: $2.000 × 1.21 = $2.420. Esos $420 extra son el IVA que va al Estado.',
              },
              {
                titulo: '¿Cómo se calcula rápido?',
                explicacionTitle: 'El truco del 1.21',
                explicacion: 'Para agregar el 21% de IVA a cualquier precio, simplemente multiplicás por 1.21. El "1" representa el precio original (100%) y el "0.21" representa el IVA (21%). Si el IVA fuera del 10%, multiplicarías por 1.10. Si fuera del 5%, por 1.05. ¡Es siempre el mismo método!',
                ejemploTitle: 'Más ejemplos',
                ejemplo: 'Servicio de internet: $3.500 neto. Con IVA: $3.500 × 1.21 = $4.235. \nConsulta médica: $8.000 neta. Con IVA: $8.000 × 1.21 = $9.680.',
              },
            ],
          },
          {
            id: 'regla-de-tres',
            title: 'Regla de tres',
            durationMinutes: 5,
            teoria: [
              {
                titulo: '¿Qué es la regla de tres?',
                explicacionTitle: 'Proporciones en el supermercado',
                explicacion: 'La regla de tres es una forma de calcular una cantidad desconocida cuando tenés dos magnitudes que se relacionan proporcionalmente. En términos simples: si sabés el precio de una cantidad, podés calcular el precio de cualquier otra cantidad del mismo producto.',
                ejemploTitle: 'Situación cotidiana',
                ejemplo: 'En la verdulería, 500g de tomates cuestan $800. ¿Cuánto cuestan 750g? La relación es siempre la misma: precio ÷ gramos. Entonces: ($800 × 750) ÷ 500 = $1.200.',
              },
              {
                titulo: 'La fórmula universal',
                explicacionTitle: 'Un esquema simple para no olvidarse',
                explicacion: 'Siempre es: Nuevo precio = (Precio conocido × Nueva cantidad) ÷ Cantidad conocida. Esta fórmula funciona para cualquier comparación proporcional: precios por kilo, velocidades, recetas de cocina, consumo de combustible, descuentos por cantidad, etc.',
                ejemploTitle: 'Otro ejemplo',
                ejemplo: 'Una receta de torta para 6 porciones lleva 300g de harina. ¿Cuánta harina necesitás para 10 porciones? (300 × 10) ÷ 6 = 500g de harina.',
              },
            ],
          },
        ],
      },
      {
        id: 'nivel-2',
        title: 'Nivel 2 — Ahorro e inversión',
        difficulty: 2,
        lessons: [
          {
            id: 'interes-simple',
            title: 'Interés simple',
            durationMinutes: 6,
            teoria: [
              {
                titulo: '¿Qué es el interés?',
                explicacionTitle: 'El precio del dinero en el tiempo',
                explicacion: 'El interés es el costo de usar dinero ajeno (préstamo) o la ganancia por prestar el tuyo (ahorro). Se expresa como un porcentaje del capital por período de tiempo. El "interés simple" significa que el porcentaje siempre se calcula sobre el capital original, sin importar el tiempo que pase.',
                ejemploTitle: 'Situación cotidiana',
                ejemplo: 'Pedís prestado $10.000 al 3% mensual por 4 meses. El interés de cada mes es siempre 3% de $10.000 = $300. En 4 meses pagás $300 × 4 = $1.200 de interés total.',
              },
              {
                titulo: 'La fórmula del interés simple',
                explicacionTitle: 'Capital × Tasa × Tiempo',
                explicacion: 'Interés = Capital × Tasa × Tiempo. Donde Tasa se expresa en decimal (3% = 0.03) y Tiempo en la misma unidad que la tasa (si la tasa es mensual, el tiempo va en meses). El monto total a devolver es Capital + Interés.',
                ejemploTitle: 'Calculando paso a paso',
                ejemplo: 'Ahorraste $50.000 al 2% mensual por 6 meses.\nInterés = $50.000 × 0.02 × 6 = $6.000\nTotal al final = $50.000 + $6.000 = $56.000',
              },
            ],
          },
          {
            id: 'interes-compuesto',
            title: 'Interés compuesto',
            durationMinutes: 6,
            teoria: [
              {
                titulo: '¿Cuál es la diferencia con el interés simple?',
                explicacionTitle: 'Los intereses que generan más intereses',
                explicacion: 'En el interés compuesto, los intereses ganados cada período se suman al capital para el siguiente período. Es decir, ganás intereses sobre los intereses anteriores. Esto genera una "bola de nieve" que crece más rápido que el interés simple. Es el principio detrás de los plazos fijos con capitalización automática.',
                ejemploTitle: 'Comparación directa',
                ejemplo: 'Capital: $10.000 al 5% mensual por 3 meses.\n\nInterés SIMPLE: $10.000 × 0.05 × 3 = $1.500 → Total: $11.500\n\nInterés COMPUESTO:\n• Mes 1: $10.000 × 1.05 = $10.500\n• Mes 2: $10.500 × 1.05 = $11.025\n• Mes 3: $11.025 × 1.05 = $11.576\n→ Total: $11.576 (¡$76 más que con interés simple!)',
              },
              {
                titulo: 'La fórmula del interés compuesto',
                explicacionTitle: 'Capital × (1 + tasa)^períodos',
                explicacion: 'Monto final = Capital × (1 + tasa)^períodos. El símbolo ^ significa "elevado a la potencia de". Cada período se multiplica el capital acumulado por (1 + tasa). Cuanto más largo el plazo, mayor la diferencia con el interés simple.',
                ejemploTitle: 'Plazo fijo típico',
                ejemplo: '$20.000 al 4% mensual por 3 meses:\n$20.000 × (1.04)³ = $20.000 × 1.1249 ≈ $22.498\n\nCon interés simple hubiera sido solo $22.400.',
              },
            ],
          },
          {
            id: 'presupuesto',
            title: 'Presupuesto mensual',
            durationMinutes: 5,
            teoria: [
              {
                titulo: '¿Por qué hacer un presupuesto?',
                explicacionTitle: 'El mapa de tu dinero',
                explicacion: 'Un presupuesto mensual es simplemente anotar cuánto dinero entra (ingresos) y cómo se distribuye en distintos gastos (egresos). Te permite saber cuánto podés gastar en cada categoría sin quedarte corto a fin de mes. No hace falta una planilla complicada: con sumas y restas básicas alcanza.',
                ejemploTitle: 'Situación cotidiana',
                ejemplo: 'Ingresos mensuales: $150.000\n• Alquiler: 30% → $150.000 × 0.30 = $45.000\n• Alimentación: 25% → $37.500\n• Transporte: 10% → $15.000\n• Servicios: 10% → $15.000\n• Libre (ahorro/ocio): 25% → $37.500',
              },
              {
                titulo: 'La regla 50/30/20',
                explicacionTitle: 'Una guía práctica muy usada',
                explicacion: 'Una regla popular para organizar el presupuesto es la 50/30/20: destinar el 50% a necesidades básicas (alquiler, comida, servicios), el 30% a gustos y ocio (salidas, ropa, entretenimiento) y el 20% a ahorro o pago de deudas. No es obligatoria, pero sirve como punto de partida.',
                ejemploTitle: 'Aplicado a un ejemplo concreto',
                ejemplo: 'Sueldo neto: $200.000\n• 50% necesidades: $100.000\n• 30% gustos: $60.000\n• 20% ahorro: $40.000\n\nSi los gastos necesarios superan el 50%, hay que revisar dónde recortar o buscar cómo aumentar los ingresos.',
              },
            ],
          },
        ],
      },
    ],
  },
];

export function findModule(moduleId) {
  return moduleCatalog.find((m) => m.id === moduleId);
}

export function findLesson(moduleId, lessonId) {
  const mod = findModule(moduleId);
  if (!mod) return null;
  for (const level of mod.levels) {
    const lesson = level.lessons.find((l) => l.id === lessonId);
    if (lesson) return { module: mod, level, lesson };
  }
  return null;
}

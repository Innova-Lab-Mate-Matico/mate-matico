import { GoogleGenAI } from '@google/genai';
import { crearGeneradorSemilla } from '../exercises/utils/seededRandom.js';

/**
 * Servicio para procesar consultas al Tutor IA Mateico.
 * Actúa como un esqueleto extensible para conectar cualquier LLM en el futuro.
 */
export async function explainTheoryTopic({ moduleId, lessonId, theoryId, question, history }) {
  // ==========================================
  // 1. INTEGRACIÓN CON GROQ API (Llama 3.3 - Gratuito)
  // ==========================================
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.trim() !== '') {
    try {
      const systemPrompt = `Sos Mateico, el tutor virtual del juego de matemáticas Mate-Mático. Tu objetivo es ayudar al alumno a entender conceptos de matemáticas (aritmética, fracciones, porcentajes, economía doméstica) en un tono amigable, motivador y con lenguaje coloquial argentino (usá vos, mirá, dale, genial, perfecto). Explicá de forma sencilla usando metáforas cotidianas (cortar pizza, cocinar, comprar yerba mate, calcular IVA o cuotas del súper). IMPORTANTE: No uses la palabra "che" en cada oración — usala como máximo una vez por respuesta y solo cuando suene natural. El tema de teoría actual es "${theoryId}" en el módulo "${moduleId}". Respondé de forma corta y estructurada (máximo 3 párrafos cortos). No des la respuesta directa a los ejercicios, guialos a deducirla.`;

      const messages = [{ role: 'system', content: systemPrompt }];
      if (history && history.length > 0) {
        history.forEach(msg => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }
      messages.push({ role: 'user', content: question });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      } else {
        const errText = await response.text();
        console.error("Error en respuesta de Groq API:", errText);
      }
    } catch (err) {
      console.error("Error al conectar con Groq API:", err);
    }
  }

  // ==========================================
  // 2. INTEGRACIÓN CON GOOGLE GEMINI API (SDK)
  // ==========================================
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const systemPrompt = `Sos Mateico, el tutor virtual del juego de matemáticas Mate-Mático. Tu objetivo es ayudar al alumno a entender conceptos de matemáticas (aritmética, fracciones, porcentajes, economía doméstica) en un tono amigable, motivador y con lenguaje coloquial argentino (usá vos, mirá, dale, genial, perfecto). Explicá de forma sencilla usando metáforas cotidianas (cortar pizza, cocinar, comprar yerba mate, calcular IVA o cuotas del súper). IMPORTANTE: No uses la palabra "che" en cada oración — usala como máximo una vez por respuesta y solo cuando suene natural. El tema de teoría actual es "${theoryId}" en el módulo "${moduleId}". Respondé de forma corta y estructurada (máximo 3 párrafos cortos). No des la respuesta directa a los ejercicios, guialos a deducirla.`;

      const ai = new GoogleGenAI({ apiKey: geminiKey });

      // Construir el array de contenidos: historial previo + pregunta actual
      const contents = [];
      if (history && history.length > 0) {
        history.forEach(msg => {
          // Omitir mensajes iniciales del modelo para que el historial empiece con 'user'
          if (contents.length === 0 && msg.role !== 'user') return;
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });
      }
      // Agregar la pregunta actual del usuario
      contents.push({ role: 'user', parts: [{ text: question }] });

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          maxOutputTokens: 300
        }
      });

      const text = response.text;
      if (text) return text.trim();
    } catch (err) {
      console.error("Error al conectar con la API de Gemini (SDK):", err);
    }
  }

  // ==========================================
  // 2. INTEGRACIÓN CON OPENAI API
  // ==========================================
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const systemPrompt = `Sos Mateico, el tutor virtual del juego de matemáticas Mate-Mático. Tu objetivo es ayudar al alumno a entender conceptos de matemáticas (aritmética, fracciones, porcentajes, economía doméstica) en un tono amigable, motivador y con lenguaje coloquial argentino (usá vos, mirá, dale, genial, perfecto). Explicá de forma sencilla usando metáforas cotidianas (cortar pizza, cocinar, comprar yerba mate, calcular IVA o cuotas del súper). IMPORTANTE: No uses la palabra "che" en cada oración — usala como máximo una vez por respuesta y solo cuando suene natural. El tema de teoría actual es "${theoryId}" en el módulo "${moduleId}". Respondé de forma corta y estructurada (máximo 3 párrafos cortos). No des la respuesta directa a los ejercicios, guialos a deducirla.`;
      
      const messages = [{ role: 'system', content: systemPrompt }];
      if (history && history.length > 0) {
        history.forEach(msg => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
          });
        });
      }
      messages.push({ role: 'user', content: question });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      } else {
        const errText = await response.text();
        console.error("Error en respuesta de OpenAI API:", errText);
      }
    } catch (err) {
      console.error("Error al conectar con la API de OpenAI:", err);
    }
  }

  // ==========================================
  // 3. INTEGRACIÓN CON AI SERVER EXTERNO (ESQUELETO ORIGINAL)
  // ==========================================
  const aiServerUrl = process.env.AI_GENERATION_SERVER_URL;
  if (aiServerUrl) {
    try {
      const response = await fetch(`${aiServerUrl}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, lessonId, theoryId, question, history })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.explanation) return data.explanation;
      }
    } catch (e) {
      console.warn("Fallo al consumir AI Server, usando motor adaptativo local:", e);
    }
  }

  // ==========================================
  // MOTOR DE APRENDIZAJE ADAPTATIVO LOCAL
  // ==========================================
  // Mientras tanto, este motor de contingencia brinda respuestas pedagógicas personalizadas,
  // con un lenguaje súper amigable e integrado al contexto argentino del resto del MVP.
  const qClean = question.toLowerCase().trim();

  // 1. Petición de simplificación extrema (explicación para 5 años / simple)
  if (qClean.includes('simple') || qClean.includes('sencill') || qClean.includes('fácil') || qClean.includes('facil') || qClean.includes('5 años') || qClean.includes('5 anos')) {
    return `¡Dale, te lo explico bien fácil! Imaginate que tenés un chocolate entero y lo partís en pedacitos iguales. Si lo partís a la mitad, tenés 2 partes y cada una es 1/2. Si lo partís en 4 partes, cada una es 1/4. ¿Viste? Cuanto más grande es el número de abajo (el denominador), más chiquito es cada pedacito.`;
  }

  // 2. Petición de situaciones de la vida real (ejemplos cotidianos)
  if (qClean.includes('ejemplo') || qClean.includes('cotidian') || qClean.includes('día a día') || qClean.includes('dia a dia') || qClean.includes('super') || qClean.includes('compra')) {
    if (theoryId === 'fracciones-equivalentes') {
      return `Un gran ejemplo cotidiano es la pizza. Si te comés 2 porciones de una pizza cortada en 4 (o sea 2/4), te estás comiendo exactamente la misma cantidad que si te comés 4 porciones de una pizza cortada en 8 (4/8). ¡Ambas representan la mitad de la pizza!`;
    }
    if (theoryId === 'cocina-suma') {
      return `En la cocina pasa siempre: si la receta te pide 1/2 taza de leche pero solo tenés una taza medidora de 1/4, podés llenarla dos veces (1/4 + 1/4 = 2/4, que es igual a 1/2 taza). ¡Las matemáticas te salvan la comida!`;
    }
    if (theoryId === 'decimales-dinero') {
      return `Con la plata es re claro: una moneda de 25 centavos es un cuarto de peso ($0.25). Si juntás 4 monedas de 25 centavos, tenés $1.00. Los decimales son solo partes de un peso entero.`;
    }
    if (moduleId === 'aritmetica') {
      return `Cuando vas al almacén y sumás el precio de un pan criollo ($450) y un café ($1200) para saber si te alcanza la plata de tu billetera antes de pasar por caja. ¡Esa es la aritmética salvando tu bolsillo!`;
    }
    if (moduleId === 'porcentajes') {
      return `Cuando ves un cartel de "20% de descuento en yerba mate". Si el paquete sale $3.000, el 10% son $300, entonces el 20% son $600. ¡Terminás pagando $2.400 en vez de $3.000!`;
    }
    return `Imaginate que vas a comprar algo y querés calcular rápido el vuelto o cuánto vas a pagar en cuotas. Dividir los gastos con tus amigos a la mitad en un asado es matemática pura aplicada a la vida real.`;
  }

  // 3. Petición de resolución paso a paso
  if (qClean.includes('paso a paso') || qClean.includes('resolver') || qClean.includes('como se hace') || qClean.includes('cómo se hace') || qClean.includes('cuenta')) {
    if (moduleId === 'porcentajes') {
      return `Para resolver cualquier porcentaje rápidamente: 1) Tomá el precio original, 2) Multiplicalo por el número del porcentaje (ej. 15), 3) Dividí todo por 100. Por ejemplo: 15% de $2.000 es (2000 × 15) ÷ 100 = 300 pesos.`;
    }
    if (theoryId === 'fracciones-equivalentes') {
      return `Para saber si dos fracciones son equivalentes, multiplicá cruzado. Por ejemplo, para ver si 1/2 y 2/4 son equivalentes: hacé 1 × 4 = 4 y 2 × 2 = 4. Como ambos resultados dan 4, ¡son equivalentes!`;
    }
    return `El paso a paso es: 1) Leé con atención qué te pide el enunciado, 2) Identificá los números que tenés, 3) Planteá la operación básica (suma, resta, multiplicación o división) y 4) Resolvé primero las decenas y luego las unidades para no confundirte.`;
  }

  // 4. Respuestas específicas según el tema de teoría
  if (theoryId === 'fracciones-equivalentes') {
    return `Las fracciones equivalentes son fracciones que se escriben distinto pero representan exactamente el mismo tamaño o cantidad. Por ejemplo, comer 1/2 torta es lo mismo que comer 2/4 de torta. ¡La cantidad de torta en tu panza es la misma!`;
  }
  if (theoryId === 'cocina-suma') {
    return `Cuando sumás fracciones con el mismo número de abajo (denominador), la taza medidora sigue siendo del mismo tamaño. Solo sumás los números de arriba (numeradores). Por eso 1/4 + 2/4 = 3/4.`;
  }
  if (theoryId === 'decimales-dinero') {
    return `Los decimales son otra forma de escribir fracciones. Escribir $0.50 (cincuenta centavos) es exactamente lo mismo que decir 1/2 peso (media unidad). Es súper útil para manejar precios y vueltos.`;
  }
  if (moduleId === 'economia') {
    return `En economía hogareña, saber calcular el IVA o comparar precios por peso te ayuda a no gastar de más. Pensá en el IVA (21%) como pagar $21 adicionales por cada $100 del producto.`;
  }

  // 5. Fallback genérico inteligente (Tono Mateico)
  return `¡Che, qué buena pregunta! Para entender mejor el tema, acordate que la matemática no es solo hacer cuentas de memoria, sino ver cómo se aplica a cosas que hacés todos los días, como ir al súper, cocinar o manejar tu sueldo. ¿Querés que veamos un ejemplo bien práctico de esto o preferís repasar el paso a paso?`;
}

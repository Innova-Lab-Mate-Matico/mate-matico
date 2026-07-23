import { explainTheoryTopic } from '../services/ai.service.js';
import { trackEvent } from '../services/tracking.service.js';

export async function postExplain(req, res) {
  const startTime = Date.now();
  const { moduleId, lessonId, theoryId, question, history, sesion_id } = req.body ?? {};
  let proveedorDetectado = 'unknown';

  try {
    const result = await explainTheoryTopic({
      moduleId,
      lessonId,
      theoryId,
      question,
      history
    });

    proveedorDetectado = result.proveedor ?? 'unknown';
    const durationMs = Date.now() - startTime;

    // Telemetría asíncrona no bloqueante para éxito
    trackEvent(req.user.uid, 'tutor_consultado', {
      sesion_id,
      moduleId,
      lessonId,
      theoryId,
      question_length: question ? question.length : 0,
      proveedor: proveedorDetectado,
      tiempo_respuesta_ms: durationMs,
      exito: true
    }).catch(err => console.error('Error al registrar telemetría tutor_consultado:', err));

    return res.status(200).json({ explanation: result.explanation });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error('Error en postExplain:', err);

    // Telemetría asíncrona no bloqueante para fallo
    trackEvent(req.user?.uid, 'tutor_consultado', {
      sesion_id: sesion_id ?? null,
      moduleId: moduleId ?? null,
      lessonId: lessonId ?? null,
      theoryId: theoryId ?? null,
      question_length: question ? question.length : 0,
      proveedor: proveedorDetectado,
      tiempo_respuesta_ms: durationMs,
      exito: false
    }).catch(err2 => console.error('Error al registrar telemetría tutor_consultado (fallo):', err2));

    return res.status(500).json({ error: 'Error interno del servidor al procesar la tutoría.' });
  }
}

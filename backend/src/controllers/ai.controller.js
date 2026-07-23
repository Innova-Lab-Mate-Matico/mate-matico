import { explainTheoryTopic } from '../services/ai.service.js';

export async function postExplain(req, res) {
  try {
    const { moduleId, lessonId, theoryId, question, history } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'La pregunta es requerida y debe ser un texto.' });
    }

    const explanation = await explainTheoryTopic({
      moduleId,
      lessonId,
      theoryId,
      question,
      history
    });

    return res.status(200).json({ explanation });
  } catch (err) {
    console.error('Error en postExplain:', err);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la tutoría.' });
  }
}

import { generateAiExercise, validateAiExercise } from '../services/aiExercise.service.js';

export async function generateAiExerciseController(req, res, next) {
  try {
    const result = await generateAiExercise(req.user.uid, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) { next(error); }
}

export async function validateAiExerciseController(req, res, next) {
  try {
    const result = await validateAiExercise(req.user.uid, req.body);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}

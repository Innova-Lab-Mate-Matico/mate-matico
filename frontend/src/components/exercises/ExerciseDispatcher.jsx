import React, { useState } from 'react';
import NumericExercise from '../NumericExercise';
import DetectiveExercise from './DetectiveExercise';
import DecisionExercise from './DecisionExercise';
import { EfectosService } from '../../services/EfectosService';

/**
 * Dispatcher Dinámico de Ejercicios — Mate-Mático.
 * Renderiza el componente especializado con validación y feedback integrado (puntos, confeti, sonidos y pistas de Mateico).
 */
export default function ExerciseDispatcher(props) {
  const { exercise, feedback: externalFeedback, isAnswered: externalIsAnswered, apiCall, moduleId, lessonId, onAnswerSuccess, onComplete } = props;

  const [validating, setValidating] = useState(false);
  const [internalFeedback, setInternalFeedback] = useState(null);
  const [attempt, setAttempt] = useState(1);

  if (!exercise) return null;

  const type = exercise.type || exercise.tipo;

  // Si se le pasa feedback externo (ej: desde PracticarCard / Practicar IA)
  const isManagedExternally = externalFeedback !== undefined;
  const feedback = isManagedExternally ? externalFeedback : internalFeedback;
  const isCompleted = isManagedExternally ? externalIsAnswered : (internalFeedback?.correcto === true);

  const handleInternalAnswer = async (ans) => {
    if (isManagedExternally) {
      if (props.onAnswer) props.onAnswer(ans);
      return;
    }

    if (validating || isCompleted) return;

    setValidating(true);
    const answerStr = String(ans).trim();
    const targetCorrect = String(exercise.correctAnswer || exercise.respuestaCorrecta || '').trim();

    try {
      let res;
      if (apiCall && (moduleId || lessonId)) {
        res = await apiCall('/exercises/validate', {
          method: 'POST',
          body: JSON.stringify({
            moduleId,
            lessonId,
            exerciseId: exercise.id,
            answer: answerStr,
            semilla: exercise.semilla ?? 1000,
            operandos: exercise.operandos ?? {},
            userRole: exercise.userRole || 'principiante'
          })
        });
      } else {
        // Fallback de validación local
        const isMatch = answerStr.toLowerCase() === targetCorrect.toLowerCase();
        res = {
          correcto: isMatch,
          puntosGanados: isMatch ? 15 : 0,
          explicacionError: exercise.explanation || "Revisá los datos e intentá nuevamente.",
          comodinPista: exercise.hint || "Pista: Leé atentamente los datos del problema."
        };
      }

      setInternalFeedback(res);

      if (res.correcto) {
        EfectosService.reproducirSonido('acierto');
        EfectosService.dispararConfeti();
        const pts = res.puntosGanados ?? 15;
        if (onAnswerSuccess) onAnswerSuccess(pts);
      } else {
        EfectosService.reproducirSonido('error');
        setAttempt(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error al validar ejercicio:', err);
      // Fallback local en caso de desconexión
      const isMatch = answerStr.toLowerCase() === targetCorrect.toLowerCase();
      const fallbackRes = {
        correcto: isMatch,
        puntosGanados: isMatch ? 15 : 0,
        explicacionError: exercise.explanation || "Revisá el procedimiento e intentá de nuevo.",
        comodinPista: exercise.hint || "Pista: Compará los montos con atención."
      };
      setInternalFeedback(fallbackRes);
      if (isMatch) {
        EfectosService.reproducirSonido('acierto');
        EfectosService.dispararConfeti();
        if (onAnswerSuccess) onAnswerSuccess(15);
      } else {
        EfectosService.reproducirSonido('error');
      }
    } finally {
      setValidating(false);
    }
  };

  const childProps = {
    ...props,
    feedback,
    isAnswered: isCompleted,
    onAnswer: handleInternalAnswer
  };

  const renderComponent = () => {
    if (type === 'detective' || type === 'estimacion') {
      return <DetectiveExercise {...childProps} />;
    }
    if (type === 'decision') {
      return <DecisionExercise {...childProps} />;
    }
    return <NumericExercise {...childProps} />;
  };

  // Si el componente se gestiona externamente (Práctica IA), se devuelve directamente
  if (isManagedExternally) {
    return renderComponent();
  }

  // Si se gestiona internamente (Lección del plan de estudio con semillas)
  return (
    <div className="exercise-dispatcher-wrapper">
      {renderComponent()}

      {/* Realimentación de error / Pista de Mateico */}
      {feedback && !feedback.correcto && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: '16px',
          padding: '16px 20px',
          marginTop: '16px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
        }}>
          <strong style={{ display: 'block', color: '#b45309', marginBottom: '6px', fontSize: '0.95rem' }}>
            {attempt >= 2 ? '📖 Explicación de Mateico:' : '💡 Pista Estratégica:'}
          </strong>
          <p style={{ fontSize: '0.92rem', color: '#78350f', margin: 0, lineHeight: '1.45', fontWeight: '500' }}>
            {feedback.comodinPista || feedback.explicacionError || exercise.hint || exercise.explanation || "Revisá los datos e intentá nuevamente."}
          </p>
        </div>
      )}

      {/* Pantalla de Éxito y Otorgamiento de Puntos */}
      {isCompleted && (
        <div style={{
          background: '#ecfdf5',
          border: '1.5px solid #a7f3d0',
          borderRadius: '18px',
          padding: '20px',
          textAlign: 'center',
          marginTop: '20px',
          boxShadow: '0 6px 16px rgba(16, 185, 129, 0.12)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '6px' }}>🎉</span>
          <h3 style={{ color: '#065f46', fontSize: '1.2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
            ¡Excelente respuesta!
          </h3>
          <p style={{ color: '#047857', fontSize: '0.95rem', margin: '0 0 16px 0', fontWeight: '600' }}>
            Ganaste <span style={{ color: '#059669', fontSize: '1.1rem', fontWeight: '900' }}>+{feedback?.puntosGanados ?? 15} puntos</span>. ¡Seguí así!
          </p>
          <button
            type="button"
            className="btn-confirm-thinking"
            onClick={() => {
              if (onComplete) onComplete();
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              marginTop: '0',
              padding: '14px 24px',
              fontSize: '1rem',
              maxWidth: '320px'
            }}
          >
            Continuar lección ➔
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";

import Microleccion1 from "./microleccion1";
import Microleccion2 from "./microleccion2";
import DynamicTheoryCard from "./DynamicTheoryCard";
import MultipleChoice from "./MultipleChoice";
import DescansoCard from "./descansoCard";
import NumericExercise from "./NumericExercise";
import ExitosCard from "./ExitosCard";
import FinalizacionCard from "./FinalizacionCard";
import TarjetaProgreso from "./TarjetaProgreso";

function LessonFlow({
  leccion,
  moduleId,
  apiCall,
  onAnswerSuccess,
  onRefreshProgress,
  onComplete,
  progress,
  user,
  moduleDetail
}) {

  const [step, setStep] = useState(1);
  const [sessionPoints, setSessionPoints] = useState(0);

  // Calcular estadísticas de progreso para el módulo actual
  let totalLessons = 6;
  if (moduleDetail && moduleDetail.levels) {
    let count = 0;
    moduleDetail.levels.forEach(lvl => {
      if (lvl.lessons) {
        count += lvl.lessons.length;
      }
    });
    if (count > 0) {
      totalLessons = count;
    }
  }

  const moduleProgress = progress?.modulos?.[leccion?.moduleId] || {};
  const leccionesMap = moduleProgress.lecciones || moduleProgress.lessons || {};
  let completedCount = Object.values(leccionesMap).filter(l => l.completada || l.completed).length;

  const currentLessonCompleted = leccionesMap[leccion?.id]?.completada || leccionesMap[leccion?.id]?.completed;
  if (!currentLessonCompleted && leccion) {
    completedCount = Math.min(totalLessons, completedCount + 1);
  }

  const nextStep = async () => {
    const nextVal = step + 1;
    const nextStepObj = steps[nextVal - 1];

    if (nextStepObj && nextStepObj.type === 'success') {
      try {
        await apiCall(`/progress/${moduleId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            lessonId: leccion?.id,
            completada: true,
            puntaje: sessionPoints
          })
        });
      } catch (err) {
        console.error("Error al guardar progreso de lección:", err);
      }
    }

    setStep(nextVal);
  };

  // Construir la secuencia de pasos de forma dinámica y escalable
  const steps = [];

  // 1. Mostrar la teoría de multiplicación si es la lección específica de Eliana
  if (leccion?.id === 'multiplicacion') {
    steps.push({ type: 'theory1' });
    steps.push({ type: 'theory2' });
  } 
  // 2. Si la lección tiene teoría dinámica desde el backend, agregarla
  else if (leccion?.teoria && Array.isArray(leccion.teoria)) {
    leccion.teoria.forEach((theoryItem, index) => {
      steps.push({ type: 'dynamicTheory', theory: theoryItem, index });
    });
  }

  // 3. Cargar todos los ejercicios dinámicos de la lección
  const ejercicios = leccion?.ejercicios || [];
  ejercicios.forEach((ex, idx) => {
    steps.push({ type: 'exercise', exercise: ex, index: idx });
    
    // Agregar un descanso a la mitad de los ejercicios para motivar al alumno
    if (idx === Math.floor(ejercicios.length / 2) - 1) {
      steps.push({ type: 'rest' });
    }
  });

  // Pantallas finales
  steps.push({ type: 'success' });
  steps.push({ type: 'finish' });
  steps.push({ type: 'progress' });

  const currentStep = steps[step - 1];
  if (!currentStep) return null;

  // Barra de progreso global
  const totalSteps = steps.length;
  const currentStepIndex = step;
  const progressPercent = (currentStepIndex / totalSteps) * 100;
  const showProgressBar = currentStep.type !== 'progress';

  return (
    <div className="lesson-flow">
      <style>{`
        .lesson-flow .multiple-choice-container,
        .lesson-flow .numeric-exercise-page,
        .lesson-flow .microleccion1-wrapper,
        .lesson-flow .descanso-card-wrapper,
        .lesson-flow .descanso-card,
        .lesson-flow .exitos-card-wrapper,
        .lesson-flow .finalizacion-card-wrapper,
        .lesson-flow .progreso-card-wrapper {
          min-height: auto !important;
          background: transparent !important;
          background-color: transparent !important;
          padding-top: 10px !important;
          padding-bottom: 20px !important;
        }
        .lesson-flow .app-card {
          min-height: auto !important;
          height: auto !important;
        }
        .lesson-flow .exitos-card,
        .lesson-flow .finalizacion-card,
        .lesson-flow .progreso-card {
          border: 1px solid rgba(123, 97, 255, 0.15) !important;
          box-shadow: 0 10px 30px rgba(123, 97, 255, 0.08) !important;
        }
      `}</style>
      {showProgressBar && (
        <div style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto 20px auto',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(123, 97, 255, 0.08)',
          border: '1px solid rgba(123, 97, 255, 0.12)',
          fontFamily: "'Poppins', sans-serif"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: '700', color: '#4b5563' }}>
            <span style={{ color: '#7b61ff' }}>Lección: {leccion?.title}</span>
            <span>Paso {currentStepIndex} de {totalSteps}</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: '#7b61ff',
              borderRadius: '99px',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </div>
      )}

      {currentStep.type === 'theory1' && (
        <Microleccion1 onContinuar={nextStep} />
      )}

      {currentStep.type === 'theory2' && (
        <Microleccion2 onContinuar={nextStep} />
      )}

      {currentStep.type === 'dynamicTheory' && (
        <DynamicTheoryCard 
          theory={currentStep.theory} 
          moduleId={moduleId}
          lessonId={leccion?.id}
          apiCall={apiCall}
          onContinuar={nextStep} 
        />
      )}

      {currentStep.type === 'rest' && (
        <DescansoCard onComplete={nextStep} />
      )}

      {currentStep.type === 'exercise' && currentStep.exercise.tipo === 'multiple_choice' && (
        <MultipleChoice 
          key={currentStep.exercise.id}
          ejercicio={currentStep.exercise}
          moduleId={moduleId}
          lessonId={leccion?.id}
          teoria={leccion?.teoria}
          apiCall={apiCall}
          onAnswerSuccess={(pts) => {
            setSessionPoints(prev => prev + pts);
            if (onAnswerSuccess) onAnswerSuccess(pts);
          }}
          onComplete={nextStep} 
        />
      )}

      {currentStep.type === 'exercise' && currentStep.exercise.tipo === 'numeric' && (
        <NumericExercise 
          key={currentStep.exercise.id}
          ejercicio={currentStep.exercise}
          index={currentStep.index}
          moduleId={moduleId}
          lessonId={leccion?.id}
          teoria={leccion?.teoria}
          apiCall={apiCall}
          onAnswerSuccess={(pts) => {
            setSessionPoints(prev => prev + pts);
            if (onAnswerSuccess) onAnswerSuccess(pts);
          }}
          onComplete={nextStep} 
        />
      )}

      {currentStep.type === 'success' && (
        <ExitosCard onComplete={nextStep} />
      )}

      {currentStep.type === 'finish' && (
        <FinalizacionCard 
          onComplete={nextStep} 
          points={sessionPoints || 25}
          completedCount={completedCount}
          totalLessons={totalLessons}
          userRole={user?.rolActual || 'principiante'}
        />
      )}

      {currentStep.type === 'progress' && (
        <TarjetaProgreso 
          completedCount={completedCount}
          totalLessons={totalLessons}
          userRole={user?.rolActual || 'principiante'}
          onContinuar={async () => {
            if (onRefreshProgress) {
              await onRefreshProgress();
            }
            onComplete();
          }}
        />
      )}

    </div>
  );
}

export default LessonFlow;
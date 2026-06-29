import React, { useState, useEffect } from 'react';
import luzIcon from '../assets/luz.png';
import dudaIcon from '../assets/duda.png';
import loLograsteIcon from '../assets/lo lograste.png';
import './Modules.css';

/*
  MATE-MÁTICO — COMPONENTE LECCIONES Y MÓDULOS
  (REACT CLÁSICO)

  Este componente representa el núcleo principal
  del sistema educativo gamificado.

  FUNCIONES:
  - Carga módulos y niveles desde el backend
  - Muestra catálogo de aprendizaje
  - Gestiona ejercicios interactivos
  - Valida respuestas en tiempo real
  - Sincroniza progreso del alumno
  - Maneja pistas y comodines
  - Controla pantalla de éxito

  Compatible con:
  - Create React App
  - React clásico
*/

export default function Modules({
  apiCall,
  onAnswerSuccess,
  progress,
  onRefreshProgress,
  user
}) {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] =
    useState(null);

  const [moduleDetail, setModuleDetail] =
    useState(null);

  const [activeLesson, setActiveLesson] =
    useState(null);

  const [exerciseStates, setExerciseStates] =
    useState({});

  // Conteo de errores consecutivos
  const [errorCount, setErrorCount] =
    useState({});

  // Índice del ejercicio actual (flujo paso a paso)
  const [currentExerciseIndex, setCurrentExerciseIndex] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  /*
    Cargar catálogo principal de módulos.
  */
  const loadCatalog = async () => {
    setLoading(true);

    try {
      const data = await apiCall('/modules');

      setModules(
        data.modulos ??
          data.modules ??
          []
      );
    } catch (err) {
      console.error(
        'Error al cargar catálogo:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  /*
    Seleccionar módulo.
  */
  const handleSelectModule = async (
    moduleId
  ) => {
    setLoading(true);

    try {
      const data = await apiCall(
        `/modules/${moduleId}`
      );

      setSelectedModuleId(moduleId);

      setModuleDetail(
        data.modulo ??
          data.module
      );

      setActiveLesson(null);

      setExerciseStates({});

      setErrorCount({});
    } catch (err) {
      console.error(
        'Error al cargar detalle del módulo:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  /*
    Abrir lección.
  */
  const handleSelectLesson = async (
    lesson
  ) => {
    setLoading(true);

    try {
      const data = await apiCall(
        `/modules/${selectedModuleId}/lessons/${lesson.id}?semilla=${moduleDetail.semillaSesion}`
      );

      setActiveLesson(
        data.leccion ??
          data.lesson ??
          lesson
      );
    } catch (err) {
      console.error(
        'Error al cargar lección del backend:',
        err
      );
      setActiveLesson(lesson);
    } finally {
      setLoading(false);
      setExerciseStates({});
      setErrorCount({});
      setCurrentExerciseIndex(0);
    }
  };

  /*
    Validar respuesta.
  */
  const handleSubmitAnswer = async (
    ex,
    answer
  ) => {
    const exId = ex.id;

    if (
      exerciseStates[exId]?.correcto
    ) {
      return;
    }

    try {
      const result = await apiCall(
        '/exercises/validate',
        {
          method: 'POST',
          body: JSON.stringify({
            moduleId:
              selectedModuleId,

            lessonId:
              activeLesson.id,

            exerciseId: exId,

            answer:
              ex.tipo ===
              'multiple_choice'
                ? String(answer)
                : Number(answer),

            semilla:
              ex.semilla ??
              moduleDetail.semillaSesion,

            operandos:
              ex.operandos,
          }),
        }
      );

      /*
        Guardar resultado local.
      */
      setExerciseStates(
        (prev) => ({
          ...prev,

          [exId]: {
            ...prev[exId],

            checked: true,

            correcto:
              result.correcto,

            puntosGanados:
              result.puntosGanados,

            rolActual:
              result.rolActual,

            rolSubio:
              result.rolSubio,

            explicacionError:
              result.explicacionError,

            habilitarComodin:
              result.habilitarComodin,

            comodinPista:
              result.comodinPista,
          },
        })
      );

      if (result.correcto) {
        onAnswerSuccess(result);
        // Auto-avanzar al siguiente ejercicio después de 1.5s de celebración
        setTimeout(() => {
          setCurrentExerciseIndex(prev => prev + 1);
        }, 1500);
      } else {
        setErrorCount((prev) => ({
          ...prev,

          [exId]:
            (prev[exId] || 0) + 1,
        }));
      }
    } catch (err) {
      alert(
        `Error al validar: ${err.message}`
      );
    }
  };

  /*
    Manejadores de entrada del usuario para los ejercicios.
  */
  const handleSelectOption = (exId, option) => {
    if (exerciseStates[exId]?.correcto) return;

    setExerciseStates((prev) => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        selectedOption: option,
      },
    }));
  };

  const handleNumericChange = (exId, value) => {
    if (exerciseStates[exId]?.correcto) return;

    setExerciseStates((prev) => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        userInput: value,
      },
    }));
  };

  /*
    Verificar si una lección
    ya fue completada.
  */
  const isLessonCompleted = (
    lessonId
  ) => {
    if (
      !progress ||
      !selectedModuleId
    ) {
      return false;
    }

    const moduleProgress =
      progress[selectedModuleId] ||
      {};

    const lecciones =
      moduleProgress.lecciones ||
      moduleProgress.lessons ||
      {};

    return (
      lecciones[lessonId]
        ?.completada ||
      lecciones[lessonId]
        ?.completed ||
      false
    );
  };

  /*
    Volver al catálogo.
  */
  const handleBackToCatalog =
    () => {
      setSelectedModuleId(null);

      setModuleDetail(null);

      setActiveLesson(null);
    };

  /*
    Volver al módulo.
  */
  const handleBackToModule =
    () => {
      setActiveLesson(null);
    };

  /*
    Estado de carga inicial.
  */
  if (
    loading &&
    !selectedModuleId
  ) {
    return (
      <div className="card modules-card">
        Cargando catálogo...
      </div>
    );
  }

  /*
    VISTA 1:
    Catálogo de módulos.
  */
  if (!selectedModuleId) {
    return (
      <div className="card modules-card">
        <h3>
          Módulos de Aprendizaje
        </h3>

        <p
          style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '15px',
          }}
        >
          Selecciona una temática
          para comenzar desafíos.
        </p>

        <div className="module-grid">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="module-card"
              onClick={() =>
                handleSelectModule(
                  mod.id
                )
              }
            >
              <div>
                <strong>
                  {mod.title}
                </strong>

                <p>
                  {
                    mod.description
                  }
                </p>

                <div
                  style={{
                    marginTop:
                      '15px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}
                >
                  <span className="badge">
                    {
                      mod.levelCount
                    }{' '}
                    niveles
                  </span>

                  <span className="badge badge-success">
                    Sugerido:{' '}
                    {
                      mod.rolSugerido
                    }
                  </span>

                  {user?.onboarding?.moduloRecomendado === mod.id && (
                    <span className="badge badge-recommended">
                      ★ Recomendado
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
    VISTA 2:
    Niveles y lecciones.
  */
  if (
    moduleDetail &&
    !activeLesson
  ) {
    return (
      <div className="card modules-card">
        {/* Navegación de retorno */}
        <button
          className="module-back-btn"
          onClick={handleBackToCatalog}
        >
          ← Volver al Catálogo
        </button>

        {/* Título del módulo */}
        <div className="module-detail-header">
          <h2 className="module-detail-title">
            {moduleDetail.title}
          </h2>
          {moduleDetail.description && (
            <p className="module-detail-desc">
              {moduleDetail.description}
            </p>
          )}
        </div>

        {/* Árbol de niveles y lecciones */}
        <div className="lessons-tree">
          {moduleDetail.levels.map(
            (lvl, lvlIndex) => (
              <div
                key={lvl.id}
                className="level-group"
              >
                <div className="level-header">
                  <span className="level-badge">
                    {lvlIndex + 1}
                  </span>
                  <span className="level-title">
                    {lvl.title}
                  </span>
                </div>

                <div className="lessons-list">
                  {lvl.lessons.map(
                    (lesson) => {
                      const completed =
                        isLessonCompleted(
                          lesson.id
                        );

                      return (
                        <div
                          key={lesson.id}
                          className={`lesson-btn-card ${
                            completed
                              ? 'completed'
                              : ''
                          }`}
                          onClick={() =>
                            handleSelectLesson(
                              lesson
                            )
                          }
                          role="button"
                          tabIndex={0}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            cursor: 'pointer'
                          }}
                        >
                          <span 
                            className="lesson-btn-left"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <span className="lesson-icon">
                              {completed ? '✓' : '🧉'}
                            </span>
                            <span className="lesson-name">
                              {lesson.title}
                            </span>
                          </span>

                          <span className={`lesson-action ${completed ? 'lesson-action-done' : ''}`}>
                            {completed
                              ? 'COMPLETADO'
                              : 'INICIAR ▶'}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  /*
    VISTA 3:
    Lección activa.
  */
  if (activeLesson) {
    const ejercicios = activeLesson.ejercicios || [];
    const totalEjercicios = ejercicios.length;
    const allCompleted = totalEjercicios > 0 && currentExerciseIndex >= totalEjercicios;

    /*
      Pantalla de éxito.
    */
    if (allCompleted) {
      const totalPoints =
        ejercicios.reduce(
          (sum, ex) =>
            sum +
            (ex.puntos ?? 10),
          0
        );

      return (
        <div
          className="card milestone-card"
          style={{
            textAlign: 'center',
            border: '2px solid #7b61ff',
            padding: '40px 30px',
            borderRadius: '24px',
            boxShadow: '0 12px 36px rgba(123, 97, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px'
          }}
        >
          <img
            src={loLograsteIcon}
            alt="Hito Completado"
            style={{
              width: '180px',
              height: 'auto',
              marginBottom: '10px',
              display: 'block'
            }}
          />

          <h2
            style={{
              color: '#7b61ff',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: '800',
              fontSize: '1.8rem',
              margin: '0'
            }}
          >
            🏆 ¡HITO COMPLETADO! 🏆
          </h2>

          <p style={{ margin: '0', fontSize: '15px', color: '#4b5563', fontWeight: '500' }}>
            ¡Excelente trabajo! Superaste todos los ejercicios con éxito y desbloqueaste nuevos conocimientos.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              width: '100%'
            }}
          >
            <span className="badge badge-gold" style={{ fontSize: '14px', padding: '10px 20px' }}>
              ✨ +{totalPoints} Puntos
            </span>

            <span className="badge badge-success" style={{ fontSize: '14px', padding: '10px 20px', backgroundColor: '#e6fffa', color: '#047481', border: '1px solid rgba(4, 116, 129, 0.1)' }}>
              🔥 Racha mantenida
            </span>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{
              marginTop: '15px',
              width: '100%',
              maxWidth: '300px',
              height: '50px',
              fontSize: '16px'
            }}
            onClick={async () => {
              if (onRefreshProgress) {
                await onRefreshProgress();
              }
              handleBackToCatalog();
            }}
          >
            Finalizar Lección
          </button>
        </div>
      );
    }

    /*
      Ejercicio actual (paso a paso).
    */
    const ex = ejercicios[currentExerciseIndex];
    if (!ex) return null;

    const exState = exerciseStates[ex.id] || {};
    const consecutiveErrors = errorCount[ex.id] || 0;

    const isCorrect = exState.correcto;
    const isChecked = exState.checked;
    const isMultipleChoice = ex.tipo === 'multiple_choice';

    const selectedOption = exState.selectedOption || '';
    const numericValue = exState.userInput || '';

    const hasHint = exState.comodinPista || (isChecked && !isCorrect && consecutiveErrors >= 2);
    const hasError = isChecked && !isCorrect && exState.explicacionError;

    const isSubmitDisabled = isCorrect || (
      isMultipleChoice ? !selectedOption : !numericValue.trim()
    );

    const progressPercent = (currentExerciseIndex / totalEjercicios) * 100;
    const progressPercentFilled = isCorrect
      ? ((currentExerciseIndex + 1) / totalEjercicios) * 100
      : progressPercent;

    return (
      <div className="card modules-card">
        {/* Cabecera con progreso */}
        <div className="exercise-progress-header">
          <button
            onClick={handleBackToModule}
            className="exercise-exit-btn"
          >
            ✕
          </button>

          <div className="exercise-progress-bar">
            <div
              className="exercise-progress-fill"
              style={{ width: `${progressPercentFilled}%` }}
            />
          </div>

          <span className="exercise-counter">
            {currentExerciseIndex + 1}/{totalEjercicios}
          </span>
        </div>

        {/* Ejercicio actual con animación */}
        <div className="exercise-step" key={ex.id}>
          <div className="exercise-card">
            {/* Cabecera del Ejercicio */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                color: '#666',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontWeight: '600', color: '#94a3b8' }}>
                Ejercicio {currentExerciseIndex + 1}
              </span>

              <div>
                {isCorrect ? (
                  <span className="badge badge-success">
                    ✓ ¡Correcto!
                  </span>
                ) : isChecked ? (
                  <span className="badge badge-error">
                    ❌ Reintentar
                  </span>
                ) : (
                  <span className="badge">
                    ✨ {ex.puntos} pts
                  </span>
                )}
              </div>
            </div>

            {/* Enunciado del Ejercicio */}
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '1.15rem',
                color: '#1e293b',
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              {ex.enunciado ?? ex.prompt}
            </div>

            {/* Inputs / Opciones */}
            {isMultipleChoice ? (
              <div className="options-container">
                {ex.opciones?.map((opt, oIdx) => {
                  const isOptSelected = selectedOption === String(opt);

                  let optClass = "option-btn";
                  if (isOptSelected) {
                    optClass += " selected";
                    if (isChecked) {
                      optClass += isCorrect ? " correct" : " incorrect";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      className={optClass}
                      disabled={isCorrect}
                      onClick={() => handleSelectOption(ex.id, String(opt))}
                    >
                      <span style={{ marginRight: '10px', fontWeight: 'bold' }}>
                        {['A', 'B', 'C', 'D'][oIdx] || '•'}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  className="numeric-input"
                  placeholder="Escribí tu respuesta acá..."
                  disabled={isCorrect}
                  value={numericValue}
                  onChange={(e) => handleNumericChange(ex.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSubmitDisabled) {
                      handleSubmitAnswer(ex, numericValue);
                    }
                  }}
                />
              </div>
            )}

            {/* Explicación de Error */}
            {hasError && (
              <div className="feedback-card error">
                <img
                  src={dudaIcon}
                  alt="Mate de duda"
                  className="feedback-img"
                />
                <div className="feedback-text">
                  <strong>¡Sigamos practicando!</strong>
                  {exState.explicacionError}
                </div>
              </div>
            )}

            {/* Pistas del Termo de Mate-Mático */}
            {hasHint && exState.comodinPista && (
              <div className="feedback-card pista">
                <img
                  src={luzIcon}
                  alt="Mate brillante"
                  className="feedback-img"
                />
                <div className="feedback-text">
                  <strong>Pista de Mate-Mático:</strong>
                  {exState.comodinPista}
                </div>
              </div>
            )}

            {/* Botón Comprobar */}
            {!isCorrect && (
              <div className="btn-check-container">
                <button
                  type="button"
                  className="btn-check"
                  disabled={isSubmitDisabled}
                  onClick={() =>
                    handleSubmitAnswer(
                      ex,
                      isMultipleChoice ? selectedOption : numericValue
                    )
                  }
                >
                  Comprobar
                </button>
              </div>
            )}

            {/* Indicador de avance automático */}
            {isCorrect && (
              <div className="exercise-advance-hint">
                Avanzando al siguiente ejercicio...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
import React, { useState, useEffect } from 'react';

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
  onRefreshProgress
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
  const handleSelectLesson = (
    lesson
  ) => {
    setActiveLesson(lesson);

    setExerciseStates({});

    setErrorCount({});
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
      <div className="card">
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
      <div className="card">
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
              style={{
                border:
                  '1px solid #ccc',
                padding: '15px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              <div>
                <strong>
                  {mod.title}
                </strong>

                <p
                  style={{
                    margin:
                      '5px 0 0 0',
                    fontSize: '13px',
                    color: '#555',
                  }}
                >
                  {
                    mod.description
                  }
                </p>

                <div
                  style={{
                    marginTop:
                      '10px',
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
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            marginBottom:
              '15px',
          }}
        >
          <button
            onClick={
              handleBackToCatalog
            }
          >
            ⇠ Volver al Catálogo
          </button>

          <h2>
            {moduleDetail.title}
          </h2>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: '#666',
            marginBottom:
              '20px',
          }}
        >
          Semilla de sesión:{' '}
          <code>
            {
              moduleDetail.semillaSesion
            }
          </code>
        </p>

        <div className="lessons-tree">
          {moduleDetail.levels.map(
            (lvl) => (
              <div
                key={lvl.id}
                className="level-group"
                style={{
                  marginBottom:
                    '20px',
                  padding: '10px',
                  border:
                    '1px solid #ddd',
                }}
              >
                <div
                  style={{
                    fontWeight:
                      'bold',
                    marginBottom:
                      '10px',
                  }}
                >
                  {lvl.title}
                </div>

                <div className="lessons-list">
                  {lvl.lessons.map(
                    (lesson) => {
                      const completed =
                        isLessonCompleted(
                          lesson.id
                        );

                      return (
                        <button
                          key={
                            lesson.id
                          }
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
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            padding:
                              '10px',
                            width:
                              '100%',
                            background:
                              completed
                                ? '#d4edda'
                                : '#fff',
                            borderColor:
                              completed
                                ? '#c3e6cb'
                                : '#ccc',
                            marginBottom:
                              '5px',
                          }}
                        >
                          <span>
                            {completed
                              ? '✓ '
                              : '🧉 '}

                            <strong>
                              {
                                lesson.title
                              }
                            </strong>
                          </span>

                          <span>
                            {completed
                              ? 'COMPLETADO'
                              : 'INICIAR ▶'}
                          </span>
                        </button>
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
    const allCorrect =
      activeLesson.ejercicios
        ?.length > 0 &&
      activeLesson.ejercicios.every(
        (ex) =>
          exerciseStates[ex.id]
            ?.correcto
      );

    /*
      Pantalla de éxito.
    */
    if (allCorrect) {
      const totalPoints =
        activeLesson.ejercicios.reduce(
          (sum, ex) =>
            sum +
            (ex.puntos ?? 10),
          0
        );

      return (
        <div
          className="card"
          style={{
            textAlign: 'center',
            border:
              '2px solid #28a745',
            padding: '30px',
          }}
        >
          <h2
            style={{
              color: '#28a745',
            }}
          >
            🎉 ¡Lección Completada!
          </h2>

          <p>
            Respondiste todas
            las preguntas
            correctamente.
          </p>

          <div
            style={{
              margin:
                '20px 0',
              display: 'flex',
              justifyContent:
                'center',
              gap: '15px',
            }}
          >
            <span className="badge badge-gold">
              +{totalPoints} pts
            </span>

            <span className="badge badge-success">
              🔥 Racha mantenida
            </span>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              if (
                onRefreshProgress
              ) {
                await onRefreshProgress();
              }

              handleBackToModule();
            }}
          >
            Regresar
          </button>
        </div>
      );
    }

    /*
      Ejercicios activos.
    */
    return (
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            marginBottom:
              '15px',
          }}
        >
          <button
            onClick={
              handleBackToModule
            }
          >
            ⇠ Salir
          </button>

          <h3>
            Lección:{' '}
            {
              activeLesson.title
            }
          </h3>
        </div>

        <div
          className="exercises-container"
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: '15px',
          }}
        >
          {activeLesson.ejercicios?.map(
            (ex, index) => {
              const exState =
                exerciseStates[
                  ex.id
                ];

              const consecutiveErrors =
                errorCount[
                  ex.id
                ] || 0;

              const numericValue =
                exState?.userInput ||
                '';

              return (
                <div
                  key={ex.id}
                  className="exercise-card"
                  style={{
                    border:
                      '1px solid #ccc',
                    padding: '15px',
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      fontSize:
                        '12px',
                      color:
                        '#666',
                      marginBottom:
                        '5px',
                    }}
                  >
                    <span>
                      Ejercicio{' '}
                      {index + 1}
                    </span>

                    <span>
                      {ex.puntos}{' '}
                      pts
                    </span>
                  </div>

                  <div
                    style={{
                      fontWeight:
                        'bold',
                      fontSize:
                        '16px',
                      marginBottom:
                        '15px',
                    }}
                  >
                    {ex.enunciado ??
                      ex.prompt}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }

  return null;
}
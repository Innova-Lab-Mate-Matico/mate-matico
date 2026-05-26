import React, { useState, useEffect } from 'react';

/*
  MATE-MÁTICO — COMPONENTE LECCIONES Y MÓDULOS (UNSTYLED BOILERPLATE)
  Este es el núcleo de juego desacoplado.
  - Carga el catálogo de módulos y lecciones.
  - Genera ejercicios deterministas y valida contra el backend en tiempo real.
  - Sincroniza el progreso con Firestore de manera reactiva.
  - Activa el "Comodín del Termo" en pantalla tras 2 errores consecutivos en un ejercicio.
  - Muestra una pantalla de éxito al finalizar todos los ejercicios de una lección.
*/
export default function Modules({ apiCall, onAnswerSuccess, progress, onRefreshProgress }) {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [moduleDetail, setModuleDetail] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [exerciseStates, setExerciseStates] = useState({});
  const [errorCount, setErrorCount] = useState({}); // Conteo de errores consecutivos por ejercicio
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/modules');
      setModules(data.modulos ?? data.modules ?? []);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModule = async (moduleId) => {
    setLoading(true);
    try {
      const data = await apiCall(`/modules/${moduleId}`);
      setSelectedModuleId(moduleId);
      setModuleDetail(data.modulo ?? data.module);
      setActiveLesson(null);
      setExerciseStates({});
      setErrorCount({});
    } catch (err) {
      console.error('Error al cargar detalle del módulo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setExerciseStates({});
    setErrorCount({});
  };

  const handleSubmitAnswer = async (ex, answer) => {
    const exId = ex.id;
    if (exerciseStates[exId]?.correcto) return;

    try {
      const result = await apiCall('/exercises/validate', {
        method: 'POST',
        body: JSON.stringify({
          moduleId: selectedModuleId,
          lessonId: activeLesson.id,
          exerciseId: exId,
          answer: ex.tipo === 'multiple_choice' ? String(answer) : Number(answer),
          semilla: ex.semilla ?? moduleDetail.semillaSesion,
          operandos: ex.operandos,
        }),
      });

      // Guardar el estado local de la respuesta del usuario
      setExerciseStates((prev) => ({
        ...prev,
        [exId]: {
          ...prev[exId],
          checked: true,
          correcto: result.correcto,
          puntosGanados: result.puntosGanados,
          rolActual: result.rolActual,
          rolSubio: result.rolSubio,
          explicacionError: result.explicacionError,
          habilitarComodin: result.habilitarComodin,
          comodinPista: result.comodinPista,
        },
      }));

      if (result.correcto) {
        onAnswerSuccess(result);
      } else {
        setErrorCount((prev) => ({
          ...prev,
          [exId]: (prev[exId] || 0) + 1,
        }));
      }
    } catch (err) {
      alert(`Error al validar: ${err.message}`);
    }
  };

  const isLessonCompleted = (lessonId) => {
    if (!progress || !selectedModuleId) return false;
    const moduleProgress = progress[selectedModuleId] || {};
    const lecciones = moduleProgress.lecciones || moduleProgress.lessons || {};
    return lecciones[lessonId]?.completada || lecciones[lessonId]?.completed || false;
  };

  const handleBackToCatalog = () => {
    setSelectedModuleId(null);
    setModuleDetail(null);
    setActiveLesson(null);
  };

  const handleBackToModule = () => {
    setActiveLesson(null);
  };

  if (loading && !selectedModuleId) {
    return <div className="card">Cargando catálogo...</div>;
  }

  // 1. Mostrar Catálogo de Módulos (VISTA GENERAL)
  if (!selectedModuleId) {
    return (
      <div className="card">
        <h3>Módulos de Aprendizaje</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Selecciona una temática de la lista para ver los niveles e iniciar desafíos:
        </p>

        <div className="module-grid">
          {modules.map((mod) => (
            <div 
              key={mod.id} 
              className="module-card"
              onClick={() => handleSelectModule(mod.id)}
              style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}
            >
              <div>
                <strong>{mod.title}</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#555' }}>
                  {mod.description}
                </p>
                <div style={{ marginTop: '10px' }}>
                  <span className="badge">{mod.levelCount} niveles</span>
                  <span className="badge badge-success">Sugerido: {mod.rolSugerido}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Mostrar Niveles y Lecciones de un Módulo Seleccionado
  if (moduleDetail && !activeLesson) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={handleBackToCatalog}>⇠ Volver al Catálogo</button>
          <h2>{moduleDetail.title}</h2>
        </div>

        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
          Semilla de sesión determinista: <code>{moduleDetail.semillaSesion}</code>.
        </p>

        <div className="lessons-tree">
          {moduleDetail.levels.map((lvl) => (
            <div key={lvl.id} className="level-group" style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                {lvl.title} (Dificultad: {lvl.difficulty})
              </div>
              
              <div className="lessons-list">
                {lvl.lessons.map((lesson) => {
                  const completed = isLessonCompleted(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      className={`lesson-btn-card ${completed ? 'completed' : ''}`}
                      onClick={() => handleSelectLesson(lesson)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px',
                        width: '100%',
                        background: completed ? '#d4edda' : '#fff',
                        borderColor: completed ? '#c3e6cb' : '#ccc',
                        marginBottom: '5px'
                      }}
                    >
                      <span>
                        {completed ? '✓ ' : '🧉 '}
                        <strong>{lesson.title}</strong> ({lesson.ejercicios?.length ?? 0} tareas)
                      </span>
                      <span>{completed ? 'COMPLETADO' : 'INICIAR ▶'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Resolver una Lección Activa (JUEGO INTERACTIVO)
  if (activeLesson) {
    const allCorrect = activeLesson.ejercicios?.length > 0 &&
      activeLesson.ejercicios.every(ex => exerciseStates[ex.id]?.correcto);

    // Pantalla de Éxito al finalizar todos los ejercicios
    if (allCorrect) {
      const totalPoints = activeLesson.ejercicios.reduce((sum, ex) => sum + (ex.puntos ?? 10), 0);
      return (
        <div className="card" style={{ textAlign: 'center', border: '2px solid #28a745', padding: '30px' }}>
          <h2 style={{ color: '#28a745', marginBottom: '10px' }}>🎉 ¡Felicidades! Lección Completada</h2>
          <p>Has respondido todas las preguntas correctamente.</p>
          
          <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <span className="badge badge-gold" style={{ padding: '10px' }}>Puntos Ganados: +{totalPoints}</span>
            <span className="badge badge-success" style={{ padding: '10px' }}>Racha: ¡Mantenida! 🔥</span>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              if (onRefreshProgress) {
                await onRefreshProgress();
              }
              handleBackToModule();
            }}
          >
            Regresar a las Lecciones
          </button>
        </div>
      );
    }

    // Listado de ejercicios activos de la lección
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <button onClick={handleBackToModule}>⇠ Salir de Lección</button>
          <h3>Lección: {activeLesson.title}</h3>
        </div>

        <div className="exercises-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {activeLesson.ejercicios?.map((ex, index) => {
            const exState = exerciseStates[ex.id];
            const consecutiveErrors = errorCount[ex.id] || 0;
            const numericValue = exState?.userInput ?? '';

            return (
              <div key={ex.id} className="exercise-card" style={{ border: '1px solid #ccc', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  <span>Ejercicio {index + 1} de {activeLesson.ejercicios.length}</span>
                  <span>Valor: {ex.puntos} puntos</span>
                </div>

                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>
                  {ex.enunciado ?? ex.prompt}
                </div>

                {/* Opción Múltiple */}
                {ex.tipo === 'multiple_choice' ? (
                  <div className="options-grid">
                    {ex.opciones?.map((opt) => {
                      const isSelected = exState?.selectedOption === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`option-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (exState?.correcto) return;
                            setExerciseStates((prev) => ({
                              ...prev,
                              [ex.id]: { ...prev[ex.id], selectedOption: opt },
                            }));
                            handleSubmitAnswer(ex, opt);
                          }}
                          disabled={exState?.correcto}
                          style={{
                            background: isSelected ? '#cce5ff' : '#f8f9fa',
                            fontWeight: isSelected ? 'bold' : 'normal'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Completar Número
                  <div className="numeric-input-group">
                    <input
                      type="number"
                      placeholder="Escribe tu número"
                      disabled={exState?.correcto}
                      value={numericValue}
                      onChange={(e) => {
                        setExerciseStates((prev) => ({
                          ...prev,
                          [ex.id]: { ...prev[ex.id], userInput: e.target.value },
                        }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && numericValue !== '') {
                          handleSubmitAnswer(ex, numericValue);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={exState?.correcto || !numericValue}
                      onClick={() => handleSubmitAnswer(ex, numericValue)}
                    >
                      Enviar
                    </button>
                  </div>
                )}

                {/* Feedback */}
                {exState?.checked && (
                  <div className={`feedback-box ${exState.correcto ? 'correct' : 'incorrect'}`}>
                    {exState.correcto ? (
                      <span>✓ ¡Correcto! +{exState.puntosGanados} pts</span>
                    ) : (
                      <span>✗ {exState.explicacionError ?? 'Inténtalo de nuevo.'}</span>
                    )}
                  </div>
                )}

                {/* Comodín del Termo */}
                {!exState?.correcto && consecutiveErrors >= 2 && exState?.comodinPista && (
                  <div className="comodin-card">
                    <strong>🧉 Comodín del Termo:</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
                      {exState.comodinPista}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

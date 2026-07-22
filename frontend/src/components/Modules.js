import React, { useState, useEffect } from 'react';
import './Modules.css';
import LessonFlow from './LessonFlow';
import Microleccion1 from './microleccion1';
import Microleccion2 from './microleccion2';
import DynamicTheoryCard from './DynamicTheoryCard';

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
  const getDisplayDifficulty = (baseRol, userRol) => {
    const rolesOrder = ['principiante', 'intermedio', 'avanzado'];
    const baseIdx = rolesOrder.indexOf(baseRol);
    const userIdx = rolesOrder.indexOf(userRol);

    const labels = {
      principiante: 'Inicial',
      intermedio: 'Intermedia',
      avanzado: 'Avanzada',
    };

    const baseLabel = labels[baseRol] || baseRol;
    if (userIdx > baseIdx && userRol) {
      const userLabel = labels[userRol] || userRol;
      return `Dificultad: ${userLabel} (Adaptada)`;
    }

    return `Dificultad: ${baseLabel}`;
  };

  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] =
    useState(null);

  const [moduleDetail, setModuleDetail] =
    useState(null);

  const [activeLesson, setActiveLesson] =
    useState(null);

  const [exerciseStates, setExerciseStates] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [theoryOnlyLesson, setTheoryOnlyLesson] = useState(null);
  const [currentTheoryIndex, setCurrentTheoryIndex] = useState(0);

  const handleOpenTheoryOnly = async (lesson) => {
    setLoading(true);
    try {
      const data = await apiCall(
        `/modules/${selectedModuleId}/lessons/${lesson.id}?semilla=${moduleDetail.semillaSesion}`
      );
      const loadedLesson = data.leccion ?? data.lesson ?? lesson;
      setTheoryOnlyLesson(loadedLesson);
      setCurrentTheoryIndex(0);
    } catch (err) {
      console.error('Error al cargar teoría de la lección:', err);
      setTheoryOnlyLesson(lesson);
      setCurrentTheoryIndex(0);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };


  /*
    Verificar si una lección
    ya fue completada (históricamente).
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
      progress?.modulos?.[selectedModuleId] ||
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
    Verificar si una lección fue completada HOY (para renovar el tilde ✓ cada medianoche).
  */
  const isLessonCompletedToday = (
    lessonId
  ) => {
    if (
      !progress ||
      !selectedModuleId
    ) {
      return false;
    }

    const moduleProgress =
      progress?.modulos?.[selectedModuleId] ||
      progress[selectedModuleId] ||
      {};

    const lecciones =
      moduleProgress.lecciones ||
      moduleProgress.lessons ||
      {};

    const lessonData = lecciones[lessonId];
    if (!lessonData || !(lessonData.completada || lessonData.completed)) {
      return false;
    }

    const dateStr = lessonData.actualizadoEn ?? lessonData.completadoEn ?? lessonData.completedAt;
    if (!dateStr) return false;
    const completedDate = new Date(dateStr);
    if (isNaN(completedDate.getTime())) return false;

    const today = new Date();
    return (
      completedDate.getDate() === today.getDate() &&
      completedDate.getMonth() === today.getMonth() &&
      completedDate.getFullYear() === today.getFullYear()
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
                    {getDisplayDifficulty(mod.rolSugerido, user?.rolActual)}
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
    // Pre-calculate unlock mapping for visual progression
    const lessonUnlockMap = {};
    let foundFirstIncomplete = false;
    moduleDetail.levels.forEach(lvl => {
      lvl.lessons.forEach(lesson => {
        const completed = isLessonCompleted(lesson.id);
        if (completed) {
          lessonUnlockMap[lesson.id] = true;
        } else if (!foundFirstIncomplete) {
          lessonUnlockMap[lesson.id] = true; // First incomplete is unlocked (active)
          foundFirstIncomplete = true;
        } else {
          lessonUnlockMap[lesson.id] = false; // Locked
        }
      });
    });

    let globalLessonIndex = 0;
    const offsetSequence = ['offset-left', 'offset-center', 'offset-right', 'offset-center'];

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

        {/* Mapa de Ruta Visual (Estilo Duolingo) */}
        <div className="roadmap-container">
          <div className="roadmap-line"></div>

          {moduleDetail.levels.map((lvl, lvlIndex) => (
            <React.Fragment key={lvl.id}>
              {/* Encabezado del Nivel en la Ruta */}
              <div className="roadmap-section-header">
                <span className="roadmap-section-title">
                  Nivel {lvlIndex + 1}: {lvl.title}
                </span>
              </div>

              {lvl.lessons.map((lesson) => {
                const everCompleted = isLessonCompleted(lesson.id);
                const completedToday = isLessonCompletedToday(lesson.id);
                const unlocked = lessonUnlockMap[lesson.id];
                const offsetClass = offsetSequence[globalLessonIndex % 4];
                globalLessonIndex++;

                let nodeStatusClass = 'locked';
                let icon = '🔒';
                let statusLabel = 'Bloqueado';
                let statusLabelClass = 'locked';

                if (completedToday) {
                  nodeStatusClass = 'completed';
                  icon = '✓';
                  statusLabel = 'Completado hoy';
                  statusLabelClass = 'completed';
                } else if (unlocked) {
                  nodeStatusClass = 'active';
                  icon = '🧉';
                  statusLabel = everCompleted ? '¡Practicar hoy!' : '¡Aprender ya!';
                  statusLabelClass = 'active';
                }

                return (
                  <div key={lesson.id} className={`roadmap-step ${offsetClass}`}>
                    <button
                      type="button"
                      className={`roadmap-node ${nodeStatusClass}`}
                      disabled={!unlocked}
                      onClick={() => unlocked && handleSelectLesson(lesson)}
                      title={unlocked ? `Empezar ${lesson.title}` : 'Completá las lecciones anteriores primero'}
                    >
                      {icon}
                    </button>
                    <div className="roadmap-label-box">
                      <p className="roadmap-label-title">{lesson.title}</p>
                      <span className={`roadmap-label-status ${statusLabelClass}`}>
                        {statusLabel}
                      </span>
                      {unlocked && (
                        <button
                          type="button"
                          className="learn-theory-btn"
                          onClick={() => handleOpenTheoryOnly(lesson)}
                          style={{
                            marginTop: '6px',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            color: '#7b61ff',
                            backgroundColor: 'rgba(123, 97, 255, 0.08)',
                            border: '1px solid rgba(123, 97, 255, 0.25)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: "'Poppins', sans-serif"
                          }}
                        >
                          📖 Leer teoría
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        {theoryOnlyLesson && (
          <div className="theory-overlay-backdrop" onClick={() => setTheoryOnlyLesson(null)}>
            <div className="theory-modal-wrapper" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button" 
                className="theory-modal-close" 
                onClick={() => setTheoryOnlyLesson(null)}
                aria-label="Cerrar teoría"
              >
                ×
              </button>
              <div className="theory-modal-content">
                {theoryOnlyLesson.id === 'multiplicacion' ? (
                  currentTheoryIndex === 0 ? (
                    <Microleccion1 onContinuar={() => setCurrentTheoryIndex(1)} />
                  ) : (
                    <Microleccion2 onContinuar={() => setTheoryOnlyLesson(null)} />
                  )
                ) : (
                  theoryOnlyLesson.teoria && theoryOnlyLesson.teoria.length > 0 ? (
                    <DynamicTheoryCard 
                      theory={theoryOnlyLesson.teoria[currentTheoryIndex]} 
                      moduleId={selectedModuleId}
                      lessonId={theoryOnlyLesson.id}
                      apiCall={apiCall}
                      onContinuar={() => {
                        if (currentTheoryIndex < theoryOnlyLesson.teoria.length - 1) {
                          setCurrentTheoryIndex(prev => prev + 1);
                        } else {
                          setTheoryOnlyLesson(null);
                        }
                      }} 
                    />
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
                      <h3 style={{ color: '#163b74', fontSize: '1.2rem', marginBottom: '10px' }}>¡Lección práctica!</h3>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Esta lección es práctica. ¡Ingresá para poner a prueba tus conocimientos!</p>
                      <button 
                        type="button"
                        onClick={() => {
                          const temp = theoryOnlyLesson;
                          setTheoryOnlyLesson(null);
                          handleSelectLesson(temp);
                        }}
                        style={{
                          padding: '10px 20px',
                          background: '#7b61ff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Comenzar práctica
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
    VISTA 3:
    Lección activa.
  */
  if (activeLesson) {
    return (
      <LessonFlow
        leccion={activeLesson}
        moduleId={selectedModuleId}
        apiCall={apiCall}
        onAnswerSuccess={onAnswerSuccess}
        onRefreshProgress={onRefreshProgress}
        progress={progress}
        user={user}
        moduleDetail={moduleDetail}
        onComplete={() => {
          setActiveLesson(null);
          setExerciseStates({});
        }}
      />
    );
  }

  return null;
}
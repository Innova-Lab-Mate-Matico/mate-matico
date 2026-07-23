import React, { useState, useEffect } from 'react';
import './Modules.css';
import LessonFlow from './LessonFlow';
import Microleccion1 from './microleccion1';
import Microleccion2 from './microleccion2';
import DynamicTheoryCard from './DynamicTheoryCard';

/**
 * ============================================================================
 * MATE-MÁTICO — COMPONENTE NÚCLEO DE LECCIONES Y MÓDULOS (Modules.js)
 * ============================================================================
 * 
 * Este componente administra la experiencia de aprendizaje del alumno dividida
 * en 3 vistas principales:
 * 
 * 1. VISTA 1 (CATÁLOGO FIGMA): Muestra el carrusel mobile-first "Seguí aprendiendo"
 *    con badges de recomendación de IA y la lista de todos los módulos disponibles.
 * 2. VISTA 2 (MAPA DE RUTA / ROADMAP): Muestra la ruta gamificada estilo Duolingo
 *    del módulo seleccionado con estados (Completado, Activo, Bloqueado) y opción de leer teoría.
 * 3. VISTA 3 (LECCIÓN ACTIVA): Transfiere la ejecución iterativa de ejercicios a <LessonFlow />.
 */

import paymentSvg from '../assets/payment_arrow_down.svg';
import percentSvg from '../assets/percent.svg';
import shoppingCartSvg from '../assets/shopping_cart.svg';
import frame10Svg from '../assets/Frame 10.svg';
import aritmeticaPng from '../assets/aritmetica.png';
import mateAcademico from '../assets/mate_academico.webp';
import mateEscolar from '../assets/mate_escolar.webp';
import mateProfesor from '../assets/mate_profesor.webp';

const MODULE_THEMES = {
  aritmetica: {
    icon: <img src={aritmeticaPng} alt="Base aritmética" className="figma-svg-icon" />,
    iconBg: '#89C75F',
    circleBg: '#89C75F',
    title: 'Base aritmética',
    badge: 'En curso'
  },
  porcentajes: {
    icon: <img src={percentSvg} alt="Porcentajes" className="figma-svg-icon" />,
    iconBg: '#4285F4',
    circleBg: '#4285F4',
    title: 'Porcentajes',
    badge: 'En curso'
  },
  fracciones: {
    icon: <img src={frame10Svg} alt="Fracciones y decimales" className="figma-svg-icon-full" />,
    iconBg: '#FBBC05',
    circleBg: '#FBBC05',
    title: 'Fracciones y decimales',
    badge: 'En curso'
  },
  economia: {
    icon: <img src={shoppingCartSvg} alt="Economía de hogar" className="figma-svg-icon-full" />,
    iconBg: '#B95B1E',
    circleBg: '#B95B1E',
    title: 'Economía de hogar',
    badge: 'En curso'
  }
};

const getMateAvatar = (rolActual) => {
  const rol = String(rolActual || '').toLowerCase();
  if (rol.includes('intermedio') || rol.includes('secundari')) {
    return mateProfesor;
  }
  if (rol.includes('avanzado') || rol.includes('experto') || rol.includes('academico') || rol.includes('académico')) {
    return mateAcademico;
  }
  return mateEscolar;
};

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
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [moduleDetail, setModuleDetail] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [exerciseStates, setExerciseStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [theoryOnlyLesson, setTheoryOnlyLesson] = useState(null);
  const [currentTheoryIndex, setCurrentTheoryIndex] = useState(0);

  /* Estado para el Carrusel de Módulos Destacados */
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  const getModuleProgress = (modId, defaultTotal = 6) => {
    const targetMod = modules.find((m) => m.id === modId);
    const totalLessons = targetMod?.lessonCount || (targetMod?.levelCount ? targetMod.levelCount * 2 : defaultTotal);

    if (!progress) {
      return { completed: 0, total: totalLessons, pct: 0 };
    }

    const modMap = progress.progreso?.modulos || progress.modulos || progress;
    const modInfo = modMap?.[modId];
    if (!modInfo) {
      return { completed: 0, total: totalLessons, pct: 0 };
    }

    const lecciones = modInfo.lecciones ?? modInfo.lessons ?? {};
    const completedLessons = Object.entries(lecciones).filter(
      ([_, l]) => l === true || l.completada === true || l.completed === true
    );
    const completedCount = completedLessons.length;
    const pct = Math.min(100, Math.round((completedCount / Math.max(1, totalLessons)) * 100));
    return { completed: completedCount, total: totalLessons, pct };
  };

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : (modules.length ? modules.length - 1 : 0)));
  };

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev < (modules.length - 1) ? prev + 1 : 0));
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 40) {
      handleNextCarousel();
    } else if (diff < -40) {
      handlePrevCarousel();
    }
    setTouchStartX(null);
  };

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
      setModules(data.modulos ?? data.modules ?? []);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  /*
    Seleccionar módulo y cargar sus niveles/lecciones.
  */
  const handleSelectModule = async (moduleId) => {
    setSelectedModuleId(moduleId);
    setLoading(true);

    try {
      const data = await apiCall(`/modules/${moduleId}`);
      setModuleDetail(data.modulo ?? data.module ?? null);
    } catch (err) {
      console.error('Error al cargar módulo:', err);
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
    Helper: Verificar si una lección está completada en el estado de progreso
  */
  const isLessonCompleted = (lessonId) => {
    if (!progress) return false;
    const modMap = progress.progreso?.modulos || progress.modulos || progress;
    if (!modMap) return false;
    const mod = modMap[selectedModuleId];
    if (!mod) return false;
    const lecciones = mod.lecciones ?? mod.lessons;
    if (!lecciones) return false;

    const lessonData = lecciones[lessonId];
    if (!lessonData) return false;

    return lessonData.completada === true || lessonData.completed === true;
  };

  /*
    Helper: Verificar si una lección fue completada HOY (para badge de racha)
  */
  const isLessonCompletedToday = (lessonId) => {
    if (!progress) return false;
    const modMap = progress.progreso?.modulos || progress.modulos || progress;
    if (!modMap) return false;
    const mod = modMap[selectedModuleId];
    if (!mod) return false;
    const lecciones = mod.lecciones ?? mod.lessons;
    if (!lecciones) return false;

    const lessonData = lecciones[lessonId];
    if (!lessonData) return false;

    const isDone = lessonData.completada === true || lessonData.completed === true;
    if (!isDone) return false;

    const dateStr = lessonData.actualizadoEn ?? lessonData.completadoEn ?? lessonData.completedAt;
    if (!dateStr) return false;

    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr.startsWith(todayStr);
  };

  /*
    Volver al catálogo.
  */
  const handleBackToCatalog = () => {
    setSelectedModuleId(null);
    setModuleDetail(null);
    setActiveLesson(null);
    setExerciseStates({});
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
    Catálogo de módulos (Diseño Figma con Carrusel y Lista).
  */
  if (!selectedModuleId) {
    return (
      <div className="card modules-card figma-modules-card">
        {/* Header estilo Figma */}
        <header className="figma-header">
          <h1 className="figma-main-title">Lecciones</h1>
        </header>

        {/* Sección: Seguí aprendiendo */}
        <section className="figma-section">
          <div className="figma-section-header">
            <h2 className="figma-section-title">Seguí aprendiendo</h2>
            <p className="figma-section-subtitle">Elegí la lección que querés continuar</p>
          </div>

          {/* Carrusel de Módulos Destacados */}
          {modules.length > 0 && (
            <div className="carousel-container-outer">
              <div className="carousel-wrapper">
                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-prev"
                  onClick={handlePrevCarousel}
                  aria-label="Lección anterior"
                >
                  ‹
                </button>

                <div 
                  className="carousel-track-container"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="carousel-track"
                    style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                  >
                    {modules.map((mod) => {
                      const prog = getModuleProgress(mod.id);
                      const theme = MODULE_THEMES[mod.id] || { icon: '📘', iconBg: '#89C75F', circleBg: '#89C75F', badge: 'En curso' };
                      const isRecommended = user?.onboarding?.moduloRecomendado === mod.id;
                      const badgeText = isRecommended ? '★ Recomendado' : (theme.badge || 'En curso');
                      const mateAvatar = getMateAvatar(user?.rolActual);

                      return (
                        <div
                          key={mod.id}
                          className="carousel-slide"
                          onClick={() => handleSelectModule(mod.id)}
                        >
                          <div className="featured-card">
                            <div className="featured-card-header">
                              <div className="featured-icon-badge">
                                <div
                                  className="featured-icon-box"
                                  style={{ backgroundColor: theme.iconBg }}
                                >
                                  {theme.icon}
                                </div>
                                <span className="featured-badge">{badgeText}</span>
                              </div>

                              <div
                                className="featured-illustration-circle"
                                style={{ backgroundColor: theme.circleBg || '#89C75F' }}
                              >
                                <img
                                  src={mateAvatar}
                                  alt="Mascota Mate"
                                  className="featured-mate-avatar"
                                />
                              </div>
                            </div>

                            <div className="featured-card-body">
                              <h3 className="featured-card-title">{mod.title}</h3>
                              <p className="featured-card-meta">{prog.completed} de {prog.total} completadas</p>

                              <div className="featured-progress-bar">
                                <div
                                  className="featured-progress-fill"
                                  style={{ width: `${Math.max(6, prog.pct)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  className="carousel-arrow carousel-arrow-next"
                  onClick={handleNextCarousel}
                  aria-label="Siguiente lección"
                >
                  ›
                </button>
              </div>

              {/* Indicadores / Puntos */}
              <div className="carousel-dots">
                {modules.map((mod, idx) => (
                  <button
                    key={mod.id}
                    type="button"
                    className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                    onClick={() => setCarouselIndex(idx)}
                    aria-label={`Ir a ${mod.title}`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sección: Todas las lecciones */}
        <section className="figma-section figma-section-all-lessons">
          <h2 className="figma-section-title figma-section-title-spaced">Todas las lecciones</h2>

          <div className="figma-lessons-list">
            {modules.map((mod) => {
              const prog = getModuleProgress(mod.id);
              const theme = MODULE_THEMES[mod.id] || { icon: '📘', iconBg: '#7b61ff' };

              return (
                <div
                  key={mod.id}
                  className="figma-lesson-card"
                  onClick={() => handleSelectModule(mod.id)}
                >
                  <div
                    className="figma-lesson-icon-box"
                    style={{ backgroundColor: theme.iconBg }}
                  >
                    <span>{theme.icon}</span>
                  </div>

                  <div className="figma-lesson-info">
                    <h3 className="figma-lesson-title">{mod.title}</h3>
                    <p className="figma-lesson-subtitle">{prog.completed} de {prog.total} completadas</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
        {/* Navegación de retorno estilo Figma */}
        <button
          className="figma-back-btn"
          onClick={handleBackToCatalog}
        >
          ← volver
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
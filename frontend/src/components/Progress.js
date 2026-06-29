import React, { useState, useEffect } from 'react';
import Mascota from './Mascota';
import './Progress.css';

/*
  MATE-MÁTICO — COMPONENTE PROGRESO
  (REACT CLÁSICO)

  Este componente muestra:
  - progreso académico,
  - lecciones completadas,
  - puntos acumulados,
  - rachas activas,
  - la mascota de aprendizaje activa,
  - información técnica de depuración.
*/

const TITULOS_MODULOS = {
  aritmetica: 'Base aritmética',
  porcentajes: 'Porcentajes',
  fracciones: 'Fracciones y decimales',
};

const TITULOS_LECCIONES = {
  'suma-basica': 'Suma básica',
  multiplicacion: 'Multiplicación',
  'concepto-porcentaje': 'Concepto de porcentaje',
  descuentos: 'Calcular descuentos',
  'fracciones-basicas': 'Fracciones básicas',
};

export default function Progress({ apiCall }) {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/progress');
      setProgressData(data);
    } catch (err) {
      console.error('Error al cargar progreso:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const hasProgress =
    progressData &&
    progressData.progreso &&
    progressData.progreso.modulos &&
    Object.keys(progressData.progreso.modulos).length > 0;

  return (
    <div className="card progress-card">
      <div className="progress-header">
        <h2 style={{ margin: 0, color: '#163b74' }}>Mi Progreso y Logros</h2>

        <button
          type="button"
          onClick={loadProgress}
          className="btn-primary"
          disabled={loading}
          style={{ height: '38px', padding: '0 16px', border: 'none' }}
        >
          {loading ? 'Sincronizando...' : 'Actualizar'}
        </button>
      </div>

      {loading && !progressData && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Cargando tu progreso...
        </div>
      )}

      {progressData && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Tarjeta de Mascota Activa */}
          {progressData.gamificacion?.rolActual && (
            <div>
              <h4 style={{ marginBottom: '10px', color: '#4b5563' }}>Tu Mascota de Aprendizaje</h4>
              <Mascota rol={progressData.gamificacion.rolActual} />
            </div>
          )}

          {/* Estadísticas en Tarjetas Premium */}
          <div
            style={{
              display: 'flex',
              gap: '15px',
              flexWrap: 'wrap',
            }}
          >
            <div
              className="stat-card"
              style={{
                backgroundColor: '#f7f2ff',
                border: '1px solid rgba(123, 97, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                flex: '1 1 120px',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(123, 97, 255, 0.02)',
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7b61ff', marginBottom: '4px' }}>
                {progressData.gamificacion?.puntosTotales ?? 0}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>
                Puntos Acumulados
              </div>
            </div>

            <div
              className="stat-card"
              style={{
                backgroundColor: '#fff9e6',
                border: '1px solid rgba(217, 119, 6, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                flex: '1 1 120px',
                textAlign: 'center',
                boxShadow: '0 4px 10px rgba(217, 119, 6, 0.02)',
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706', marginBottom: '4px' }}>
                {progressData.gamificacion?.rachaDias ?? 0}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>
                Días de Racha Activos
              </div>
            </div>
          </div>

          {/* Listado de Lecciones Completadas */}
          <div>
            <h4 style={{ marginBottom: '12px', color: '#4b5563' }}>Lecciones Superadas</h4>

            {hasProgress ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                }}
              >
                {Object.entries(progressData.progreso.modulos).map(([moduleId, modInfo]) => {
                  const completedLessons = Object.entries(
                    modInfo.lecciones ?? modInfo.lessons ?? {}
                  ).filter(([_, l]) => l.completada || l.completed);

                  const tituloModulo = TITULOS_MODULOS[moduleId] || (moduleId.charAt(0).toUpperCase() + moduleId.slice(1));

                  return (
                    <div
                      key={moduleId}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(123, 97, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 4px 12px rgba(123, 97, 255, 0.02)',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          color: '#163b74',
                          borderBottom: '1px solid #f3f4f6',
                          paddingBottom: '8px',
                          marginBottom: '10px',
                        }}
                      >
                        Módulo: {tituloModulo} ({completedLessons.length} superadas)
                      </div>

                      {completedLessons.length > 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          {completedLessons.map(([lessonId, l]) => (
                             <div
                               key={lessonId}
                               className="progress-lesson-item"
                             >
                               <span style={{ color: '#334155', fontWeight: '500' }}>
                                 🧉 Lección: <strong>{TITULOS_LECCIONES[lessonId] || lessonId}</strong>
                               </span>
                               <span style={{ color: '#64748b', fontSize: '11px' }}>
                                 Completada el: {(() => {
                                   const dateStr = l.actualizadoEn ?? l.completadoEn ?? l.completedAt;
                                   if (!dateStr) return 'Recientemente';
                                   const d = new Date(dateStr);
                                   return isNaN(d.getTime()) ? 'Recientemente' : d.toLocaleDateString();
                                 })()}
                               </span>
                             </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                          Ninguna lección completada aún en este módulo.
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px dotted #cbd5e1',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                }}
              >
                No has completado ninguna lección todavía. ¡Pasa por el catálogo de lecciones para empezar!
              </div>
            )}
          </div>


        </div>
      )}
    </div>
  );
}
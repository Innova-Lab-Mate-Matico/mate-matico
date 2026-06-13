import React from 'react';

/*
  MATE-MÁTICO — COMPONENTE PROGRESO
  (REACT CLÁSICO)

  Este componente muestra:
  - progreso académico,
  - lecciones completadas,
  - puntos acumulados,
  - rachas activas,
  - información técnica de depuración.

  Compatible con:
  - Create React App
  - React clásico


export default function Progress({
  apiCall
}) {
  const [progressData, setProgressData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [showRaw, setShowRaw] =
    useState(false);


  const loadProgress = async () => {
    setLoading(true);

    try {
      const data = await apiCall(
        '/progress'
      );

      setProgressData(data);
    } catch (err) {
      console.error(
        'Error al cargar progreso:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

 
  const hasProgress =
    progressData &&
    progressData.progreso &&
    Object.keys(
      progressData.progreso
    ).length > 0;

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
        <h2>
          Progreso del Alumno
        </h2>

        <button
          type="button"
          onClick={loadProgress}
          className="btn-primary"
          disabled={loading}
        >
          {loading
            ? 'Sincronizando...'
            : 'Cargar de Firestore'}
        </button>
      </div>

      
      {!progressData &&
        !loading && (
          <p
            style={{
              color: '#666',
              fontStyle:
                'italic',
            }}
          >
            Haz clic en
            "Cargar de
            Firestore" para
            sincronizar tus
            avances.
          </p>
        )}

      
      {progressData && (
        <div
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: '20px',
          }}
        >
      
          <div
            style={{
              display: 'flex',
              gap: '15px',
            }}
          >
            <div
              style={{
                border:
                  '1px solid #ccc',
                padding: '10px',
                flex: 1,
                textAlign:
                  'center',
              }}
            >
              <strong>
                {progressData
                  .gamificacion
                  ?.puntosTotales ??
                  0}{' '}
                Pts
              </strong>

              <div
                style={{
                  fontSize:
                    '11px',
                  color: '#666',
                }}
              >
                Puntos Totales
              </div>
            </div>

            <div
              style={{
                border:
                  '1px solid #ccc',
                padding: '10px',
                flex: 1,
                textAlign:
                  'center',
              }}
            >
              <strong>
                {progressData
                  .gamificacion
                  ?.rachaDias ??
                  0}{' '}
                Días
              </strong>

              <div
                style={{
                  fontSize:
                    '11px',
                  color: '#666',
                }}
              >
                Racha de días
              </div>
            </div>
          </div>

  
          <div>
            <h4>
              Lecciones
              Completadas
            </h4>

            {hasProgress ? (
              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '10px',
                  marginTop:
                    '10px',
                }}
              >
                {Object.entries(
                  progressData.progreso
                ).map(
                  ([
                    moduleId,
                    modInfo,
                  ]) => {
                    const completedLessons =
                      Object.entries(
                        modInfo.lecciones ??
                          modInfo.lessons ??
                          {}
                      ).filter(
                        ([_, l]) =>
                          l.completada ||
                          l.completed
                      );

                    return (
                      <div
                        key={
                          moduleId
                        }
                        style={{
                          border:
                            '1px solid #ddd',
                          padding:
                            '10px',
                          backgroundColor:
                            '#fff',
                        }}
                      >
                        <div
                          style={{
                            fontWeight:
                              'bold',
                            textTransform:
                              'capitalize',
                          }}
                        >
                          Módulo:{' '}
                          {
                            moduleId
                          }{' '}
                          (
                          {
                            completedLessons.length
                          }{' '}
                          completadas)
                        </div>

                        {completedLessons.length >
                        0 ? (
                          <ul
                            style={{
                              marginTop:
                                '5px',
                              paddingLeft:
                                '20px',
                            }}
                          >
                            {completedLessons.map(
                              ([
                                lessonId,
                                l,
                              ]) => (
                                <li
                                  key={
                                    lessonId
                                  }
                                  style={{
                                    fontSize:
                                      '13px',
                                  }}
                                >
                                  Lección:{' '}
                                  <strong>
                                    {
                                      lessonId
                                    }
                                  </strong>{' '}
                                  ➔{' '}
                                  {new Date(
                                    l.completadoEn ??
                                      l.completedAt
                                  ).toLocaleDateString()}
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <span
                            style={{
                              fontSize:
                                '12px',
                              color:
                                '#999',
                            }}
                          >
                            Ninguna
                            lección
                            completada.
                          </span>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <p
                style={{
                  color: '#666',
                  fontSize:
                    '13px',
                }}
              >
                No has
                completado
                ninguna
                lección
                todavía.
              </p>
            )}
          </div>

        
          <div
            style={{
              marginTop:
                '15px',
            }}
          >
            <button
              type="button"
              onClick={() =>
                setShowRaw(
                  !showRaw
                )
              }
              style={{
                width: '100%',
                fontSize:
                  '12px',
              }}
            >
              {showRaw
                ? 'Ocultar JSON'
                : 'Ver JSON de Depuración'}
            </button>

            {showRaw && (
              <pre
                className="progress-pre"
                style={{
                  marginTop:
                    '10px',
                }}
              >
                {JSON.stringify(
                  progressData,
                  null,
                  2
                )}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}*/

export default function Progress() {
  return null;
}
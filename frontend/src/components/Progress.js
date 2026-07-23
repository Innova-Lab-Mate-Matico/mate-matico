import React, { useState, useEffect } from 'react';
import Logros from './Logros';
import './Progress.css';

// Assets oficiales de Figma para la pantalla de Progreso
import mateCelebracion from '../assets/Progreso_img/Imagenes_progreso/mate_racha_celebración.png';
import podioImg from '../assets/Progreso_img/Imagenes_progreso/podio.png';
import estrellaImg from '../assets/Progreso_img/Imagenes_progreso/image.png';
import escudoNivelImg from '../assets/Progreso_img/Imagenes_progreso/image 20.png';

import fuegoIcon from '../assets/Progreso_img/Iconos_progreso/local_fire_department.svg';
import checkIcon from '../assets/Progreso_img/Iconos_progreso/check_circle.svg';
import barraNivelIcon from '../assets/Progreso_img/Iconos_progreso/android_cell_4_bar.svg';
import libroIcon from '../assets/Progreso_img/Iconos_progreso/two_pager.svg';
import dataCheckIcon from '../assets/Progreso_img/Iconos_progreso/data_check.svg';
import relojIcon from '../assets/Progreso_img/Iconos_progreso/schedule.svg';

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

  // Calcular número total de lecciones completadas
  let totalCompletadas = 0;
  if (progressData?.progreso?.modulos) {
    Object.values(progressData.progreso.modulos).forEach((mod) => {
      const lecciones = mod.lecciones ?? mod.lessons ?? {};
      totalCompletadas += Object.values(lecciones).filter((l) => l.completada || l.completed).length;
    });
  }

  const rachaDias = progressData?.gamificacion?.rachaDias ?? 1;
  const puntosTotales = progressData?.gamificacion?.puntosTotales ?? 70;
  const rolActual = progressData?.gamificacion?.rolActual ?? 'Nivel Intermedio';

  const diasSemana = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className="figma-progreso-container">
      {/* Encabezado con Mascota Mate */}
      <div className="figma-progreso-header">
        <div className="figma-progreso-header-text">
          <h1 className="figma-progreso-title">Progreso</h1>
          <p className="figma-progreso-subtitle">Mirá como venís en tu aprendizaje</p>
        </div>
        <img
          src={mateCelebracion}
          alt="Mate Celebración"
          className="figma-progreso-mate-img"
        />
      </div>

      {/* Tarjeta 1: Tu racha actual */}
      <div className="figma-streak-card">
        <div className="figma-streak-top-row">
          <div className="figma-streak-flame-circle">
            <img src={fuegoIcon} alt="Racha" />
          </div>
          <div className="figma-streak-info">
            <span className="figma-streak-label">Tu racha actual</span>
            <h2 className="figma-streak-days">{rachaDias} {rachaDias === 1 ? 'día' : 'días'}</h2>
            <span className="figma-streak-subtext">Seguí así</span>
          </div>
        </div>

        {/* Días de la semana con checks */}
        <div className="figma-streak-days-row">
          {diasSemana.map((dia, index) => {
            const esActivo = index < Math.min(rachaDias, 7);
            return (
              <div key={index} className="figma-streak-day-item">
                <span className="figma-streak-day-name">{dia}</span>
                {esActivo ? (
                  <img src={checkIcon} alt="Completado" className="figma-streak-check" />
                ) : (
                  <div className="figma-streak-empty-circle"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tarjeta 2: Tus puntos */}
      <div className="figma-points-card">
        <div className="figma-points-top-row">
          <img src={estrellaImg} alt="Puntos" className="figma-points-star-img" />
          <div className="figma-points-info">
            <span className="figma-points-label">Tus puntos</span>
            <h2 className="figma-points-value">{puntosTotales} puntos</h2>
          </div>
        </div>

        <div className="figma-points-banner">
          <p className="figma-points-banner-text">
            Sumás puntos por cada lección completada y ejercicio resuelto.
          </p>
          <img src={podioImg} alt="Podio de puntos" className="figma-points-podium-img" />
        </div>
      </div>

      {/* Tarjeta 3: Nivel actual */}
      <div className="figma-level-card">
        <div className="figma-level-left">
          <img src={barraNivelIcon} alt="Nivel" className="figma-level-icon" />
          <div className="figma-level-info">
            <span className="figma-level-label">Nivel actual</span>
            <h3 className="figma-level-name">{rolActual}</h3>
          </div>
        </div>
        <img src={escudoNivelImg} alt="Escudo de nivel" className="figma-level-shield-img" />
      </div>

      {/* Sección: Tus logros (3 Métricas) */}
      <div className="figma-metrics-section">
        <h2 className="figma-metrics-section-title">Tus logros</h2>

        <div className="figma-metrics-grid">
          {/* Métricas 1: Lecciones completadas */}
          <div className="figma-metric-card">
            <img src={libroIcon} alt="Lecciones completadas" className="figma-metric-icon" />
            <h3 className="figma-metric-value">{totalCompletadas || 3}</h3>
            <p className="figma-metric-label">Lecciones completadas</p>
          </div>

          {/* Métricas 2: Ejercicios correctos */}
          <div className="figma-metric-card figma-metric-card-highlight">
            <img src={dataCheckIcon} alt="Ejercicios correctos" className="figma-metric-icon" />
            <h3 className="figma-metric-value">86%</h3>
            <p className="figma-metric-label">Ejercicios correctos</p>
          </div>

          {/* Métricas 3: Tiempo aprendiendo */}
          <div className="figma-metric-card">
            <img src={relojIcon} alt="Tiempo aprendiendo" className="figma-metric-icon" />
            <h3 className="figma-metric-value">10 min</h3>
            <p className="figma-metric-label">Tiempo aprendiendo</p>
          </div>
        </div>
      </div>

      {/* Sección de Medallas (se mantiene intacta como fue solicitado) */}
      <div style={{ marginTop: '28px' }}>
        <Logros apiCall={apiCall} embedded={true} />
      </div>
    </div>
  );
}
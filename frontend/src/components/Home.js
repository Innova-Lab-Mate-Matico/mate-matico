import React from 'react';
import './Home.css';

// Assets oficiales para el Home / Inicio
import holaMate from '../assets/HOLA.png';
import mateIA from '../assets/mate_IA.png';
import aritmeticaPng from '../assets/aritmetica.png';
import percentSvg from '../assets/percent.svg';

import frame11Svg from '../assets/Frame 11.svg';
import kidStarSvg from '../assets/kid_star.svg';
import fuegoIcon from '../assets/Progreso_img/Iconos_progreso/local_fire_department.svg';

export default function Home({ user, progress, onNavigate }) {
  const rachaDias = user?.rachaDias ?? 1;
  const puntosTotales = user?.puntosTotales ?? 25;

  return (
    <div className="home-container">
      {/* Saludo Principal */}
      <div className="home-header">
        <div className="home-header-text">
          <h1 className="home-title">¡Hola!</h1>
          <h2 className="home-subtitle">¿Listo para seguir aprendiendo?</h2>
        </div>
        <img src={holaMate} alt="Mate Saludo" className="home-mate-img" />
      </div>

      {/* Tarjeta de Estadísticas Rápidas (Racha + Puntos) */}
      <div className="home-stats-card">
        <div className="home-stat-item">
          <div className="home-stat-icon-flame">
            <img src={fuegoIcon} alt="Racha" />
          </div>
          <div className="home-stat-text">
            <span className="home-stat-label">Racha</span>
            <h3 className="home-stat-value">{rachaDias} {rachaDias === 1 ? 'día' : 'días'}</h3>
            <span className="home-stat-subtext">¡Seguí así!</span>
          </div>
        </div>

        <div className="home-stats-divider"></div>

        <div className="home-stat-item">
          <div className="home-stat-icon-star">
            <img src={kidStarSvg} alt="Puntos" />
          </div>
          <div className="home-stat-text">
            <span className="home-stat-label">Puntos</span>
            <h3 className="home-stat-value">{puntosTotales}</h3>
            <span className="home-stat-subtext">acumulados</span>
          </div>
        </div>
      </div>

      {/* Tarjeta Destacada: Practicá con IA */}
      <div className="home-ia-card">
        <div className="home-ia-header">
          <div className="home-ia-badge-container">
            <img src={frame11Svg} alt="Nuevo" className="home-ia-frame11-img" />
            <span className="home-ia-badge">Nuevo</span>
          </div>
          <img src={mateIA} alt="Mate IA Mascot" className="home-mate-ia-img" />
        </div>

        <div className="home-ia-body">
          <h3 className="home-ia-title">Practicá con IA</h3>
          <p className="home-ia-desc">
            Resolvé ejercicios personalizados según tu nivel y los temas que elegiste.
          </p>

          <button
            type="button"
            className="home-ia-btn"
            onClick={() => onNavigate('practicar')}
          >
            Comenzar a practicar
          </button>
        </div>
      </div>

      {/* Sección: Módulos recomendados */}
      <div className="home-recommended-section">
        <h2 className="home-recommended-title">Módulos recomendados</h2>

        <div className="home-recommended-grid">
          {/* Tarjeta 1: Base aritmética */}
          <div
            className="home-recommended-card home-card-green"
            onClick={() => onNavigate('lecciones', 'aritmetica')}
          >
            <div className="home-card-top">
              <div className="home-card-icon-box home-icon-green">
                <img src={aritmeticaPng} alt="Base aritmética" className="figma-svg-icon" />
              </div>
              <span className="home-card-badge-actual">Actual</span>
            </div>
            <h3 className="home-card-title">Base aritmética</h3>
          </div>

          {/* Tarjeta 2: Porcentajes */}
          <div
            className="home-recommended-card home-card-blue"
            onClick={() => onNavigate('lecciones', 'porcentajes')}
          >
            <div className="home-card-top">
              <div className="home-card-icon-box home-icon-blue">
                <img src={percentSvg} alt="Porcentajes" className="figma-svg-icon" />
              </div>
            </div>
            <h3 className="home-card-title">Porcentajes</h3>
          </div>
        </div>

        {/* Enlace Ver todos */}
        <button
          type="button"
          className="home-see-all-link"
          onClick={() => onNavigate('lecciones')}
        >
          Ver todos
        </button>
      </div>
    </div>
  );
}

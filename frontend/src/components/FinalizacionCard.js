import React from 'react';
import '../styles/completo.css';

import iconoNivel from '../assets/nivel.png';
import mateEscolar from '../assets/mate_escolar.png';
import mateProfesor from '../assets/mate_profesor.png';
import mateAcademico from '../assets/mate_academico.png';

function FinalizacionCard({
  onComplete,
  points = 25,
  userRole = "principiante"
}) {

  const continuar = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const getMascotaData = () => {
    const r = (userRole || '').toLowerCase();
    switch (r) {
      case 'avanzado':
      case 'experto':
        return {
          imgSrc: mateAcademico,
          bubbleTop: '¡Nivel Experto!',
          bubbleBottom: '¡Sos imparable! Seguí dominando las matemáticas.'
        };
      case 'intermedio':
      case 'secundario':
      case 'medio':
        return {
          imgSrc: mateEscolar,
          bubbleTop: '¡Nivel Intermedio!',
          bubbleBottom: '¡Excelente progreso! Tu dedicación da frutos.'
        };
      case 'principiante':
      case 'inicial':
      case 'basico':
      default:
        return {
          imgSrc: mateProfesor,
          bubbleTop: '¡Tú Puedes!',
          bubbleBottom: 'Seguí esforzándote día a día.'
        };
    }
  };

  const mascota = getMascotaData();

  return (
    <div className="finalizacion-card-wrapper">

      <div className="finalizacion-card">

        <div className="finalizacion-card__body">

          <div className="finalizacion-card__top-hero">
            <h1 className="finalizacion-card__main-title">
              ¡Felicitaciones!
            </h1>

            <p className="finalizacion-card__main-description">
              Terminaste esta lección y sumaste una nueva herramienta para tu día a día.
            </p>
          </div>


          <div className="finalizacion-card__features-box">

            <div className="finalizacion-card__text-stack-vertical">

              <span className="finalizacion-card__metric-label-small">
                Ganaste
              </span>

              <span className="finalizacion-card__metric-points-highlight">
                {points} puntos
              </span>

              <span className="finalizacion-card__metric-label-progress">
                Tu avance
              </span>

              <span className="finalizacion-card__metric-sublabel-progress">
                Progreso del módulo
              </span>

            </div>


            <div className="finalizacion-card__level-image-container">
              <img
                src={iconoNivel}
                alt="Progreso de nivel"
                className="finalizacion-card__level-img-wide"
              />
            </div>

          </div>


          <div className="finalizacion-card__motivation-box">

            <div className="finalizacion-card__motivation-avatar-container">

              <img
                src={mascota.imgSrc}
                alt="Mate"
                className="finalizacion-card__motivation-avatar-massive"
              />

            </div>


            <div className="finalizacion-card__motivation-text-stack">

              <span className="finalizacion-card__motivation-line-top">
                {mascota.bubbleTop}
              </span>

              <span className="finalizacion-card__motivation-line-bottom">
                {mascota.bubbleBottom}
              </span>

            </div>

          </div>

        </div>


        <div className="finalizacion-card__actions">

          <div className="finalizacion-card__btn-wrapper">

            <button
              className="primary-button"
              onClick={continuar}
            >
              Continuar
            </button>

          </div>

        </div>


      </div>

    </div>
  );
}

export default FinalizacionCard;

import React from 'react';
import '../styles/completo.css';

import iconoNivel from '../assets/nivel.png';
import avatarTuPuedes from '../assets/tuPuedes.png';

function FinalizacionCard({ onComplete }) {

  const continuar = () => {
    if (onComplete) {
      onComplete();
    }
  };

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
                25 puntos
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
                src={avatarTuPuedes}
                alt="Tú puedes"
                className="finalizacion-card__motivation-avatar-massive"
              />

            </div>


            <div className="finalizacion-card__motivation-text-stack">

              <span className="finalizacion-card__motivation-line-top">
                ¡Tú Puedes!
              </span>

              <span className="finalizacion-card__motivation-line-bottom">
                Seguí esforzándote
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


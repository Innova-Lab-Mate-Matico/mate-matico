import React from 'react';
import BotonAncla from './BotonAncla';

// Importaciones de Assets de imagen
import olaSuperior from '../assets/image 8.png';
import olaInferior from '../assets/image 10.png';
import matePrincipal from '../assets/vamos por un mate.png';
import mateSecundario from '../assets/contento.png';
import iconoCopa from '../assets/copa.png';

function DescansoCard({ onComplete, destinoAncla }) {
  return (
    <div className="descanso-card-wrapper">
     
      {/* Onda Decorativa Superior Izquierda */}
      <img src={olaSuperior} alt="" className="descanso-card__wave-top" />

      <div className="descanso-card">
       
        {/* Cuerpo de la tarjeta */}
        <div className="descanso-card__body">
         
          {/* Encabezado con texto e ilustración */}
          <div className="descanso-card__header-inline">
            <div className="descanso-card__header-text">
              <h1 className="descanso-card__title">¿Y si vamos por un mate?</h1>
              <p className="descanso-card__description">
                Tomate un descanso. Tu mente también necesita recargar energía.
              </p>
            </div>
            <img src={matePrincipal} alt="Mate cebado" className="descanso-card__avatar-mate" />
          </div>

          {/* Bloque de logros internos */}
          <div className="descanso-card__features-box">
           
            {/* Fila 1: Logro Copa */}
            <div className="descanso-card__row-achievement">
              <div className="descanso-card__icon-container">
                <img src={iconoCopa} alt="Logro" className="descanso-card__icon-img" />
              </div>
              <div>
                <h2 className="descanso-card__subtitle">¡Buen trabajo!</h2>
                <p className="descanso-card__subdescription">Llevás varios ejercicios completados.</p>
              </div>
            </div>

            {/* Fila 2: Motivación Mate */}
            <div className="descanso-card__row-motivation">
              <p className="descanso-card__motivation-text">
                Seguí así, lo estas haciendo muy bien
              </p>
              <img src={mateSecundario} alt="Mate feliz" className="descanso-card__motivation-img" />
            </div>

          </div>
        </div>

        {/* Sección de acciones integrada al Botón Ancla */}
          <div
           className="descanso-card__actions"
             onClick={(e) => {
            e.preventDefault();
            if (onComplete) {
            onComplete();
          }
       }}
        >
          <div className="microleccion1-card__actions" style={{ width: '100%' }}>
            <BotonAncla destino={destinoAncla}>
              Continuar
            </BotonAncla>
          </div>
        </div>

      </div>

      {/* Onda Decorativa Inferior Derecha */}
      <img src={olaInferior} alt="" className="descanso-card__wave-bottom" />

    </div>
  );
}

export default DescansoCard;

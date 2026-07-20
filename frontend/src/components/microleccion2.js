import React from 'react';
import './ejercicios.css';
import BotonAncla from './BotonAncla';
import mateIcon from '../assets/aprendamosJuntos.png';
import checkIcon from '../assets/check_circle.png';

function Microleccion2({ onContinuar }) {

  const handleIntercept = (e) => {
    e.preventDefault();

    if (onContinuar) {
      onContinuar();
    }
  };

  return (
    <div className="app-card microleccion2-card">

      <div className="microleccion2-hero">
        <img
          src={mateIcon}
          alt="Mascota Mate"
          className="microleccion2-hero__avatar"
        />

        <div className="microleccion2-dialog">
          <p className="microleccion2-dialog__text">
            ¡Mirá cómo se hace paso a paso!
          </p>
        </div>
      </div>

      <div className="microleccion2-steps">

        <div className="microleccion2-step">
          <div className="microleccion2-step__header">
            <span className="microleccion2-step__badge">1</span>
            <h3 className="microleccion2-step__title">
              Descomponemos 38
            </h3>
          </div>

          <div className="microleccion2-math">
            6 × 38 = 6 × (
            <span className="math--blue">30</span>
            {" + "}
            <span className="math--magenta">8</span>)
          </div>
        </div>

        <div className="microleccion2-step">
          <div className="microleccion2-step__header">
            <span className="microleccion2-step__badge">2</span>
            <h3 className="microleccion2-step__title">
              Multiplicamos
            </h3>
          </div>

          <div className="microleccion2-math">
            6 × <span className="math--blue">30</span> =
            <span className="math--blue">180</span>
          </div>
        </div>

        <div className="microleccion2-step">
          <div className="microleccion2-step__header">
            <span className="microleccion2-step__badge">3</span>
            <h3 className="microleccion2-step__title">
              Multiplicamos
            </h3>
          </div>

          <div className="microleccion2-math">
            6 × <span className="math--magenta">8</span> =
            <span className="math--magenta">48</span>
          </div>
        </div>

        <div className="microleccion2-step">
          <div className="microleccion2-step__header">
            <span className="microleccion2-step__badge">4</span>
            <h3 className="microleccion2-step__title">
              Sumamos los resultados
            </h3>
          </div>

          <div className="microleccion2-math">
            <span className="math--blue">180</span> +
            <span className="math--magenta">48</span> =
            <span className="math--green">228</span>
          </div>
        </div>

      </div>

      <div className="microleccion2-success">

        <img
          src={checkIcon}
          alt="Check Éxito"
          className="microleccion2-success__icon"
        />

        <div className="microleccion2-success__content">
          <h4 className="microleccion2-success__title">
            ¡Listo!
          </h4>

          <p className="microleccion2-success__text">
            El resultado es <strong className="math--green">228</strong>
          </p>
        </div>

      </div>

      <div
        className="microleccion2-card__actions"
        onClick={handleIntercept}
      >
        <BotonAncla destino="multipleChoice">
          Continuar
        </BotonAncla>
      </div>

    </div>
  );
}

export default Microleccion2;

import React from 'react';
import './ejercicios.css';
import BotonAncla from './BotonAncla';
import luzIcon from '../assets/luz.png';
import changuitoIcon from '../assets/changuito.png';

function Microleccion1({ onContinuar }) {

  const handleIntercept = (e) => {
    e.preventDefault();

    if (onContinuar) {
      onContinuar();
    }
  };

  return (
    <div className="microleccion1-wrapper">

      <div className="app-card microleccion1-card">

        <h1 className="microleccion1__main-title">
          ¿Podés multiplicar sin calculadora?
        </h1>

        <div className="microleccion1-card__section microleccion1-card__section--explicacion">

          <div className="microleccion1-card__image-box">
            <img
              src={luzIcon}
              alt="Icono idea"
              className="microleccion1-card__img"
            />
          </div>

          <h2 className="microleccion1-card__title">
            Explicación breve
          </h2>

          <p className="microleccion1-card__description">
            Cuando multiplicamos un número grande, podemos separarlo en partes más fáciles, multiplicar cada parte por separado y sumar los resultados. Esto se llama <strong>propiedad distributiva</strong> y lo usamos todo el tiempo sin darnos cuenta.
          </p>

        </div>

        <div className="microleccion1-card__section microleccion1-card__section--ejemplo">

          <div className="microleccion1-card__image-box">
            <img
              src={changuitoIcon}
              alt="Icono de carrito"
              className="microleccion1-card__img"
            />
          </div>

          <h2 className="microleccion1-card__title">
            Ejemplo de situación cotidiana
          </h2>

          <p className="microleccion1-card__description">
            Comprás 6 cuotas de $38 para pagar un par de zapatillas. En vez de hacer <strong>6 × 38</strong>, separás el 38 en <strong>30 + 8</strong> y multiplicás por partes.
          </p>

        </div>

        <div
          className="microleccion1-card__actions"
          onClick={handleIntercept}
        >
          <BotonAncla destino="microleccion2">
            Continuar
          </BotonAncla>
        </div>

      </div>

    </div>
  );
}

export default Microleccion1;
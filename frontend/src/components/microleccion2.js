import React, { useState, useEffect } from 'react';
import './ejercicios.css';
import './NumericExercise.css';
import BotonAncla from './BotonAncla';
import mateIcon from '../assets/aprendamosJuntos.png';
import checkIcon from '../assets/check_circle.png';
import schedule from "../assets/schedule.svg";
import trabajo1 from "../assets/trabajo 1.png";
import calendarMonth from "../assets/calendar_month.svg";

function Microleccion2({ onContinuar }) {
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    let day = 1;
    const interval = setInterval(() => {
      day++;
      setActiveDay(day);
      if (day >= 23) {
        clearInterval(interval);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const days = Array.from({ length: 23 }, (_, i) => i + 1);

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

      {/* Ejemplo Visual Interactivo con Animación del Calendario */}
      <div style={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '800', color: '#7b61ff', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'Poppins', sans-serif" }}>
          💡 Ejemplo: 9 horas × 23 días
        </h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#475569', lineHeight: '1.4', fontFamily: "'Poppins', sans-serif" }}>
          Imaginate calcular cuánto trabajás en el mes: 9 horas por día durante 23 días (<strong>9 × 23</strong>). Podés multiplicar por partes para resolverlo fácilmente sin calculadora:
        </p>

        <div className="exercise-box" style={{ marginBottom: '14px' }}>
          <div className="exercise-text">
            <img src={schedule} alt="" className="small-icon" />
            <p>Cada día trabajás</p>
            <h3>9 horas</h3>
          </div>
          <img src={trabajo1} alt="Trabajo" className="work-image" />
        </div>

        <div className="calendar-box" style={{ marginBottom: '14px' }}>
          <div className="calendar-info">
            <img src={calendarMonth} alt="" className="small-icon" />
            <p>Durante un total de</p>
            <h3>23 días</h3>
          </div>
          <div className="calendar-grid">
            {days.map((day) => (
              <div
                key={day}
                className={day <= activeDay ? "calendar-day active" : "calendar-day"}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr style={{ width: '100%', border: '0', borderTop: '1px dashed #e2e8f0', margin: '0 0 16px 0' }} />

      <div className="microleccion2-steps">

        <div className="microleccion2-step">
          <div className="microleccion2-step__header">
            <span className="microleccion2-step__badge">1</span>
            <h3 className="microleccion2-step__title">
              Descomponemos 23
            </h3>
          </div>

          <div className="microleccion2-math">
            9 × 23 = 9 × (
            <span className="math--blue">20</span>
            {" + "}
            <span className="math--magenta">3</span>)
          </div>
        </div>

        <div className="microleccion2-step">
          <div className="microleccion2-step__header">
            <span className="microleccion2-step__badge">2</span>
            <h3 className="microleccion2-step__title">
              Multiplicamos decenas
            </h3>
          </div>

          <div className="microleccion2-math">
            9 × <span className="math--blue">20</span> =
            <span className="math--blue">180</span>
          </div>
        </div>

        <div className="microleccion2-step">
          <div className="microleccion2-step__header">
            <span className="microleccion2-step__badge">3</span>
            <h3 className="microleccion2-step__title">
              Multiplicamos unidades
            </h3>
          </div>

          <div className="microleccion2-math">
            9 × <span className="math--magenta">3</span> =
            <span className="math--magenta">27</span>
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
            <span className="math--magenta">27</span> =
            <span className="math--green">207</span>
          </div>
        </div>

      </div>

      <div className="microleccion2-success" style={{ marginTop: '16px' }}>

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
            El resultado es <strong className="math--green">207</strong> horas
          </p>
        </div>

      </div>

      <div
        className="microleccion2-card__actions"
        onClick={handleIntercept}
        style={{ marginTop: '20px' }}
      >
        <BotonAncla destino="multipleChoice">
          Continuar
        </BotonAncla>
      </div>

    </div>
  );
}

export default Microleccion2;
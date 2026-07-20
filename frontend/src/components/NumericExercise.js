import React, { useState, useEffect } from "react";
import "./NumericExercise.css";

import trabajo1 from "../assets/trabajo 1.png";
import schedule from "../assets/schedule.svg";
import calendarMonth from "../assets/calendar_month.svg";
import guino from "../assets/Guiño.png";

import arrow3 from "../assets/Arrow 3.svg";
import arrow2 from "../assets/Arrow 2.svg";

import frame5 from "../assets/Frame 5.png";
import imagen16 from "../assets/image16.png";
import aprendamosJuntos from "../assets/aprendamosJuntos.png";

function NumericExercise({ onComplete }) {

  const [screen, setScreen] = useState("exercise");
  const [answer, setAnswer] = useState("");
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {

    if (screen !== "exercise") return;

    let day = 1;

    const interval = setInterval(() => {

      day++;

      setActiveDay(day);

      if (day >= 23) {
        clearInterval(interval);
      }

    }, 180);

    return () => clearInterval(interval);

  }, [screen]);

  const checkAnswer = () => {

    if (screen === "exercise") {
      setScreen("hint");
      return;
    }

    if (screen === "hint") {
      setScreen("correct");
      return;
    }

  };

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (

    <div className="numeric-exercise-page">

      {/* ==========================
          TARJETA 1
      ========================== */}

      {screen === "exercise" && (

       <div className="app-card numeric-exercise-container">

          <div className="card-content">

            <h2 className="question">
              Trabajás <span className="highlight">9 horas</span> por día durante{" "}
              <span className="highlight">23 días</span> este mes.
              <br />
              ¿Cuántas horas trabajaste en total?
            </h2>

            <div className="exercise-box">

              <div className="exercise-text">

                <img
                  src={schedule}
                  alt=""
                  className="small-icon"
                />

                <p>Cada día trabajás</p>

                <h3>9 horas</h3>

              </div>

              <img
                src={trabajo1}
                alt="Trabajo"
                className="work-image"
              />

            </div>

            <div className="calendar-box">

              <div className="calendar-info">

                <img
                  src={calendarMonth}
                  alt=""
                  className="small-icon"
                />

                <p>Y lo hacés durante</p>

                <h3>23 días</h3>

              </div>

              <div className="calendar-grid">

                {days.map((day) => (

                  <div
                    key={day}
                    className={
                      day <= activeDay
                        ? "calendar-day active"
                        : "calendar-day"
                    }
                  >
                    {day}
                  </div>

                ))}

              </div>

            </div>

            <label className="input-label">
              Ingresá tu respuesta
            </label>

            <div className="input-wrapper">

              <input
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="answer-input"
              />

              <span className="hours-label">
                Hs.
              </span>

            </div>

            <div className="mate-container">

              <img
                src={guino}
                alt=""
                className="mascot float"
              />

              <div className="speech-bubble">
                Pulsame y te
                <br />
                paso una pista
              </div>

            </div>

          </div>

          <button
            className="primary-button"
            onClick={checkAnswer}
          >
            Comprobá la respuesta
          </button>

        </div>

      )}
      {/* ==========================
    TARJETA 2 - EXPLICACIÓN
========================== */}

{screen === "hint" && (

<div className="app-card numeric-hint-card">

    <div className="back-text">
        ← volver
    </div>

    {/* BLOQUE HORAS */}

    <div className="hint-card">

        <p className="hint-title">
            Cada día trabajás
        </p>

        <div className="hours-icons">

            {Array.from({ length: 9 }).map((_, i) => (

                <img
                    key={i}
                    src={schedule}
                    alt=""
                    className="mini-icon"
                />

            ))}

        </div>

        <h3 className="hint-number">
            9 horas
        </h3>

    </div>

    {/* BLOQUE DÍAS */}

    <div className="hint-card">

        <p className="hint-title">
            Ese mismo día se repite por
        </p>

        <div className="calendar-icons">

            {Array.from({ length: 23 }).map((_, i) => (

                <img
                    key={i}
                    src={calendarMonth}
                    alt=""
                    className="mini-calendar"
                />

            ))}

        </div>

        <h3 className="hint-number">
            23 días
        </h3>

    </div>

    {/* OPERACIÓN */}

    <div className="operation-card">

    <p className="operation-title">
        Serían 9 horas × 23 días
    </p>

    {/* PASO 1 */}

    <div className="step-one">

        <div className="equation">

            <div className="step-circle equation-circle">
                1
            </div>

            <span>9 × 23 = 9 × (</span>

            <span className="blue">
                20
            </span>

            <span> + </span>

            <span className="purple">
                3
            </span>

            <span>)</span>

            <img
                src={arrow3}
                alt=""
                className="arrow-blue"
            />

            <img
                src={arrow2}
                alt=""
                className="arrow-pink"
            />

        </div>

    </div>

    {/* PASOS 2 Y 3 */}

    <div className="step-two">

        <div className="mini-step">

            <div className="step-circle">
                2
            </div>

            <small>
                Multiplicamos
            </small>

            <p>
                9 × <span className="blue">20</span> =
                <span className="blue">180</span>
            </p>

        </div>

        <div className="mini-step">

            <div className="step-circle">
                3
            </div>

            <small>
                Multiplicamos
            </small>

            <p>
                9 × <span className="purple">3</span> =
                <span className="purple">27</span>
            </p>

        </div>

    </div>

    {/* PASO 4 */}

    <div className="step-three">

        <div className="sum-box">

            <div className="step-circle">
                4
            </div>

            <div className="sum-title">
                Sumamos los resultados
            </div>

            <div className="sum-line blue">
                180
            </div>

            <div className="sum-line purple">
                + 27
            </div>

            <hr />

            <div className="sum-result green">
                = 2?7
            </div>

        </div>

        <img
            src={guino}
            alt=""
            className="hint-mascot"
        />

    </div>

</div>

    <button
        className="primary-button"
        onClick={checkAnswer}
    >
        Comprobá la respuesta
    </button>

</div>

)}

{/* ==========================
    TARJETA 3 - CORRECTO
========================== */}

{screen === "correct" && (

<div className="app-card numeric-feedback-card">

    <div className="card-content">

      <img
        src={frame5}
        alt="Correcto"
        className="feedback-icon"
      />

      <h2 className="correct-title">
        ¡Excelente!
      </h2>

      <div className="points">

        <img
          src={imagen16}
          alt=""
          className="star-image"
        />

        <span>+15 puntos</span>

      </div>

    </div>

    <div className="card-footer">

      <div className="character-box">

        <img
          src={aprendamosJuntos}
          alt=""
          className="mascot"
        />

        <div className="speech-bubble">
          ¡Muy bien!
          <br />
          Seguimos aprendiendo juntos.
        </div>

      </div>

      <button
        className="primary-button"
        onClick={onComplete}
      >
        Continuar
      </button>

    </div>

  </div>

)}

    </div>

  );

}

export default NumericExercise;
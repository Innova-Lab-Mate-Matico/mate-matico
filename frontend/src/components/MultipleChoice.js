import React, { useState } from "react";
import "./MultipleChoice.css";

// Tarjeta 3
import tuPuedes from "../assets/tuPuedes.png";

// Tarjeta 4
import negativo from "../assets/Negativo.png";
import descanso from "../assets/descanso.png";

// Tarjeta 5
import frame5 from "../assets/Frame 5.png";
import imagen16 from "../assets/image16.png";
import mateLibreta from "../assets/aprendamosJuntos.png";

 function MultipleChoice({ onComplete })  {
  const [screen, setScreen] = useState("question");
  const [selectedOption, setSelectedOption] = useState(null);

  const correctAnswer = 2;

  const options = [
    "$582",
    "$574",
    "$584",
    "$560",
  ];

  const checkAnswer = () => {
    if (selectedOption === null) return;

    if (selectedOption === correctAnswer) {
      setScreen("correct");
    } else {
      setScreen("wrong");
    }
  };

  const continuar = () => {
  if (onComplete) {
    onComplete();
  }
 };

  return (
    <div className="multiple-choice-container">

      {/* =========================
          TARJETA 3
      ========================== */}

      {screen === "question" && (
        <div className=" app-card multiple-choice-card">

          <div className="card-content">

          

            <h2 className="question">
              Comprás 8 camisetas de fútbol a $73 cada una. Usando
              la propiedad distributiva, ¿cuánto pagás en total?
             
            </h2>

            <div className="options">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${
                    selectedOption === index ? "selected" : ""
                  }`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </button>
              ))}
            </div>

          </div>

          <div className="card-footer">

            <div className="character-box">

              <img
                src={tuPuedes}
                alt="Mascota"
                className="mascot"
              />

              <div className="speech-bubble">
                Mate a mate vas aprendiendo.
              </div>

            </div>

            <button
              className="primary-button"
              onClick={checkAnswer}
            >
              Comprobá la respuesta
            </button>

          </div>

        </div>
      )}{/* =========================
      TARJETA 4
========================== */}

{screen === "wrong" && (
  <div className=" app-card multiple-choice-card feedback-card">

    <div className="card-content">

      <img
        src={negativo}
        alt="Incorrecto"
        className="feedback-icon"
      />

      <h2 className="wrong-title">
        Casi lo tenés
      </h2>

      <p className="feedback-subtitle">
        Esta vez no salió, pero estás más cerca de entenderlo.
      </p>

      <div className="explanation-box">

        <h3>Explicación breve</h3>

       <div className="operation-row">

      <span className="pill">
       8 × (70 + 3)
     </span>

     <span className="operator">
         =
     </span>

    <span className="pill">
       560
    </span>

   <span className="operator">
         +
   </span>

   <span className="pill">
      24
  </span>

 </div>

        <div className="result-row">
          <span>Respuesta</span>
          <span>➜</span>
          <strong>584</strong>
        </div>

      </div>

    </div>

    <div className="card-footer">

      <div className="character-box">

        <img
          src={descanso}
          alt="Mascota"
          className="mascot"
        />

        <div className="speech-bubble">
          Tomate tu tiempo. Los matemáticos también  aprenden mate a mate.
        </div>

      </div>

      <button
        className="primary-button"
        onClick={continuar}
      >
        Continuar
      </button>

      </div>

      </div>
  )}

  

      {/* =========================
          TARJETA 5
      ========================== */}

      {screen === "correct" && (
        <div className=" app-card multiple-choice-card feedback-card">

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
                alt="Estrella"
                className="star-image"
              />

              <span>+10 puntos</span>

            </div>

          </div>

          <div className="card-footer">

            <div className="character-box">

              <img
                src={mateLibreta}
                alt="Mascota"
                className="mascot"
              />

              <div className="speech-bubble">
                ¡Muy bien! Seguimos aprendiendo juntos.
              </div>

            </div>

            <button
              className="primary-button"
              onClick={continuar}
            >
              Continuar
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default MultipleChoice;
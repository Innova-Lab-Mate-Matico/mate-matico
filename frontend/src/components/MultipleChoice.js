import React, { useState } from "react";
import "./MultipleChoice.css";
import Calculadora from './Calculadora';
import { EfectosService } from '../services/EfectosService';
import Microleccion1 from './microleccion1';
import Microleccion2 from './microleccion2';
import DynamicTheoryCard from './DynamicTheoryCard';
import { TutorMateicoChat } from './DynamicTheoryCard';
import mateico2Img from '../assets/Mateico2.png';

// Tarjeta 3
import tuPuedes from "../assets/tuPuedes.png";

// Tarjeta 4
import negativo from "../assets/Negativo.png";
import descanso from "../assets/descanso.png";

// Tarjeta 5
import frame5 from "../assets/Frame 5.png";
import imagen16 from "../assets/image16.png";
import mateLibreta from "../assets/aprendamosJuntos.png";

function MultipleChoice({ ejercicio, moduleId, lessonId, teoria, apiCall, onAnswerSuccess, onComplete })  {
  const [screen, setScreen] = useState("question");
  const [selectedOption, setSelectedOption] = useState(null);
  const [showTheory, setShowTheory] = useState(false);
  const [currentTheoryIndex, setCurrentTheoryIndex] = useState(0);
  const [showMateico, setShowMateico] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [showCalc, setShowCalc] = useState(false);
  const [isMuted, setIsMuted] = useState(EfectosService.isMuted());

  const question = ejercicio ? (ejercicio.enunciado ?? ejercicio.prompt) : "Comprás 8 camisetas de fútbol a $73 cada una. Usando la propiedad distributiva, ¿cuánto pagás en total?";
  const options = ejercicio ? (ejercicio.opciones ?? []) : [
    "$582",
    "$574",
    "$584",
    "$560",
  ];

  const checkAnswer = async () => {
    if (selectedOption === null) return;

    const answerValue = options[selectedOption];

    // Si no hay ejercicio del backend, usar comportamiento estático
    if (!ejercicio) {
      if (selectedOption === 2) {
        setScreen("correct");
      } else {
        setScreen("wrong");
      }
      return;
    }

    try {
      const result = await apiCall('/exercises/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          lessonId,
          exerciseId: ejercicio.id,
          answer: String(answerValue),
          semilla: ejercicio.semilla,
          operandos: ejercicio.operandos
        })
      });

      if (result.correcto) {
        setPointsAwarded(result.puntosGanados ?? 10);
        if (onAnswerSuccess) {
          onAnswerSuccess(result.puntosGanados ?? 10);
        }
        setScreen("correct");
        EfectosService.reproducirSonido('acierto');
      } else {
        setErrorMsg(result.explicacionError ?? "La respuesta no es correcta.");
        setScreen("wrong");
        EfectosService.reproducirSonido('error');
      }
    } catch (err) {
      console.error("Error al validar ejercicio de opción múltiple:", err);
      setErrorMsg(ejercicio?.explicacionError || "La respuesta elegida no es correcta.");
      // Fallback local
      if (String(answerValue) === String(ejercicio.respuestaCorrecta)) {
        setScreen("correct");
      } else {
        setScreen("wrong");
      }
    }
  };

  const continuar = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="multiple-choice-container">

      {screen === "question" && (
        <div className="exercise-layout-wrapper">
          <div className=" app-card multiple-choice-card">

          <div className="card-content">

          

            <h2 className="question">
              {question}
            </h2>

            {/* Botón calculadora y volumen */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  EfectosService.toggleMute();
                  setIsMuted(EfectosService.isMuted());
                }}
                style={{
                  background: '#f1f0ff',
                  color: '#7b61ff',
                  border: '1.5px solid rgba(123,97,255,0.25)',
                  borderRadius: '10px',
                  padding: '5px 12px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
                aria-label={isMuted ? "Activar sonido" : "Desactivar sonido"}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                type="button"
                onClick={() => setShowCalc(v => !v)}
                style={{
                  background: showCalc ? '#7b61ff' : '#f1f0ff',
                  color: showCalc ? '#fff' : '#7b61ff',
                  border: '1.5px solid rgba(123,97,255,0.25)',
                  borderRadius: '10px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s',
                }}
                aria-label="Abrir calculadora"
              >
                🧮 Calculadora
              </button>

              {((teoria && teoria.length > 0) || lessonId === 'multiplicacion') && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTheory(true);
                    setCurrentTheoryIndex(0);
                  }}
                  style={{
                    background: '#f1f0ff',
                    color: '#7b61ff',
                    border: '1.5px solid rgba(123,97,255,0.25)',
                    borderRadius: '10px',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s',
                  }}
                  aria-label="Ver teoría del tema"
                >
                  💡 Ver Teoría
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowMateico(true)}
                style={{
                  background: 'linear-gradient(135deg, #7b61ff 0%, #a855f7 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(123,97,255,0.3)',
                }}
                aria-label="Preguntarle a Mateico"
              >
                <img src={mateico2Img} alt="Mateico" style={{ width: '22px', height: '22px', objectFit: 'contain' }} /> Mateico
              </button>
            </div>

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
        {showCalc && <Calculadora onClose={() => setShowCalc(false)} />}
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

        <p style={{ marginTop: '10px', fontSize: '0.92rem', color: '#4b5563', lineHeight: '1.4', fontWeight: '500' }}>
          {errorMsg || "La respuesta elegida no es correcta. Revisá el enunciado e intentalo de nuevo."}
        </p>

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
        <button
          className="primary-button"
          onClick={() => {
            setSelectedOption(null);
            setScreen("question");
          }}
          style={{ width: '100%' }}
        >
          Intentar de nuevo
        </button>
        <span 
          onClick={continuar} 
          style={{ 
            fontSize: '0.85rem', 
            color: '#64748b', 
            textDecoration: 'underline', 
            cursor: 'pointer', 
            textAlign: 'center', 
            fontWeight: '600',
            marginTop: '4px'
          }}
        >
          Saltar ejercicio
        </span>
      </div>

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

              <span>+{pointsAwarded || 10} puntos</span>

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

      {showMateico && (
        <div className="theory-overlay-backdrop" onClick={() => setShowMateico(false)}>
          <div className="theory-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="theory-modal-close"
              onClick={() => setShowMateico(false)}
              aria-label="Cerrar chat Mateico"
            >
              ×
            </button>
            <div className="theory-modal-content">
              <TutorMateicoChat
                moduleId={moduleId}
                lessonId={lessonId}
                theoryId={ejercicio?.theoryId || lessonId}
                apiCall={apiCall}
                defaultOpen={true}
              />
            </div>
          </div>
        </div>
      )}

      {showTheory && (
        <div className="theory-overlay-backdrop" onClick={() => setShowTheory(false)}>
          <div className="theory-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="theory-modal-close" 
              onClick={() => setShowTheory(false)}
              aria-label="Cerrar teoría"
            >
              ×
            </button>
            <div className="theory-modal-content">
              {lessonId === 'multiplicacion' ? (
                currentTheoryIndex === 0 ? (
                  <Microleccion1 onContinuar={() => setCurrentTheoryIndex(1)} />
                ) : (
                  <Microleccion2 onContinuar={() => setShowTheory(false)} />
                )
              ) : (
                teoria && teoria.length > 0 && (
                  <DynamicTheoryCard 
                    theory={teoria[currentTheoryIndex]} 
                    onContinuar={() => {
                      if (currentTheoryIndex < teoria.length - 1) {
                        setCurrentTheoryIndex(prev => prev + 1);
                      } else {
                        setShowTheory(false);
                      }
                    }} 
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultipleChoice;
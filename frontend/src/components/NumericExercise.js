import React, { useState, useEffect } from "react";
import "./NumericExercise.css";
import Calculadora from './Calculadora';
import { EfectosService } from '../services/EfectosService';
import Microleccion1 from './microleccion1';
import Microleccion2 from './microleccion2';
import DynamicTheoryCard from './DynamicTheoryCard';

import trabajo1 from "../assets/trabajo 1.png";
import schedule from "../assets/schedule.svg";
import calendarMonth from "../assets/calendar_month.svg";
import guino from "../assets/Guiño.png";

import arrow3 from "../assets/Arrow 3.svg";
import arrow2 from "../assets/Arrow 2.svg";

import frame5 from "../assets/Frame 5.png";
import imagen16 from "../assets/image16.png";
import aprendamosJuntos from "../assets/aprendamosJuntos.png";
import negativo from "../assets/Negativo.png";
import descanso from "../assets/descanso.png";
import "./MultipleChoice.css";

function NumericExercise({ ejercicio, index, moduleId, lessonId, teoria, apiCall, onAnswerSuccess, onComplete }) {

  const [screen, setScreen] = useState("exercise");
  const [answer, setAnswer] = useState("");
  const [showTheory, setShowTheory] = useState(false);
  const [currentTheoryIndex, setCurrentTheoryIndex] = useState(0);
  const [activeDay, setActiveDay] = useState(1);
  const [hintText, setHintText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [showHintBubble, setShowHintBubble] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [isMuted, setIsMuted] = useState(EfectosService.isMuted());

  const num1 = ejercicio ? (ejercicio.operandos?.num1 ?? 9) : 9;
  const num2 = ejercicio ? (ejercicio.operandos?.num2 ?? 23) : 23;
  const isFigmaExercise = false;

  const getAdaptiveHint = () => {
    // Si la API nos devolvió un comodín real y específico (no genérico), lo usamos prioritariamente
    if (hintText && hintText !== "Pista: Revisa la operación paso a paso.") {
      return hintText;
    }

    if (ejercicio?.comodinPista) {
      return ejercicio.comodinPista;
    }

    if (!ejercicio) {
      return "Pista: Pensá en descomponer el cálculo en pasos más pequeños.";
    }

    const { tipoGenerador, operandos } = ejercicio;
    const gen = tipoGenerador || '';

    if (gen.includes('suma') && !gen.includes('cocina') && !gen.includes('fraccion')) {
      const a = operandos?.a ?? operandos?.num1 ?? 0;
      const b = operandos?.b ?? operandos?.num2 ?? 0;
      return `Pista: Empezá sumando las unidades (${a % 10} + ${b % 10}) y luego agregá las decenas.`;
    }

    if (gen.includes('resta')) {
      const a = operandos?.a ?? operandos?.num1 ?? 0;
      const b = operandos?.b ?? operandos?.num2 ?? 0;
      return `Pista: Pensá cuánto le falta a ${b} para llegar a ${a}, o restá primero las decenas y luego las unidades.`;
    }
    
    if (gen.includes('mult') || gen.includes('multiplicacion')) {
      const a = operandos?.a ?? operandos?.num1 ?? num1;
      const b = operandos?.b ?? operandos?.num2 ?? num2;
      if (b % 10 === 0) {
        return `Pista: Podés multiplicar ${a} × ${b / 10} y luego agregar un cero al resultado.`;
      }
      return `Pista: Podés multiplicar por partes: ${a} × ${b} es lo mismo que (${a} × ${Math.floor(b / 10) * 10}) + (${a} × ${b % 10}).`;
    }

    if (gen.includes('div') || gen.includes('division')) {
      const a = operandos?.a ?? operandos?.num1 ?? 0;
      const b = operandos?.b ?? operandos?.num2 ?? 0;
      return `Pista: Pensá qué número de una cifra o dos multiplicado por ${b} da como resultado ${a}.`;
    }

    if (gen.includes('porcentaje')) {
      const base = operandos?.base ?? 0;
      const pct = operandos?.porcentaje ?? 10;
      if (pct === 10) {
        return `Pista: Calcular el 10% es muy sencillo, solo tenés que dividir ${base} entre 10.`;
      }
      if (pct === 50) {
        return `Pista: Calcular el 50% es equivalente a calcular su mitad.`;
      }
      return `Pista: El ${pct}% es lo mismo que tomar la fracción ${pct}/100 de ${base}.`;
    }

    if (gen.includes('aumento')) {
      const precio = operandos?.precio ?? 0;
      const pct = operandos?.porcentaje ?? 0;
      return `Pista: Primero calculá el ${pct}% de $${precio} y luego sumale ese resultado al valor original.`;
    }

    return "Pista de Mate-Mático: Leé detenidamente el enunciado y resolvé los pasos uno a uno.";
  };

  const currentHint = getAdaptiveHint();

  useEffect(() => {

    if (screen !== "exercise") return;

    let day = 1;

    const interval = setInterval(() => {

      day++;

      setActiveDay(day);

      if (day >= num2) {
        clearInterval(interval);
      }

    }, 180);

    return () => clearInterval(interval);

  }, [screen, num2]);

  const checkAnswer = async () => {
    if (!answer.trim()) return;

    // Si no hay ejercicio del backend, usar comportamiento estático
    if (!ejercicio) {
      if (screen === "exercise") {
        setScreen("hint");
        return;
      }
      if (screen === "hint") {
        setScreen("correct");
        return;
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
          answer: Number(answer),
          semilla: ejercicio.semilla,
          operandos: ejercicio.operandos
        })
      });

      if (result.correcto) {
        setPointsAwarded(result.puntosGanados ?? 15);
        if (onAnswerSuccess) {
          onAnswerSuccess(result.puntosGanados ?? 15);
        }
        setScreen("correct");
        EfectosService.reproducirSonido('acierto');
      } else {
        setErrorMsg(result.explicacionError ?? "La respuesta no es correcta.");
        setHintText(result.comodinPista ?? "Pista: Revisa la operación paso a paso.");
        setScreen("hint");
        EfectosService.reproducirSonido('error');
      }
    } catch (err) {
      console.error("Error al validar ejercicio numérico:", err);
      setErrorMsg(ejercicio?.explicacionError || "La respuesta ingresada no es correcta.");
      // Fallback local
      const correctVal = ejercicio.operandos?.num1 * ejercicio.operandos?.num2;
      if (Number(answer) === Number(correctVal)) {
        setScreen("correct");
      } else {
        setScreen("hint");
      }
    }
  };

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (

    <div className="numeric-exercise-page">

      {screen === "exercise" && (
        <div className="exercise-layout-wrapper">
          <div className="app-card numeric-exercise-container">

          <div className="card-content">

            <h2 className="question">
              {ejercicio ? (ejercicio.enunciado ?? ejercicio.prompt) : (
                <>
                  Trabajás <span className="highlight">9 horas</span> por día durante{" "}
                  <span className="highlight">23 días</span> este mes.
                  <br />
                  ¿Cuántas horas trabajaste en total?
                </>
              )}
            </h2>

            {/* Botón calculadora y volumen */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
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
            </div>

            {isFigmaExercise && (
              <>
                <div className="exercise-box">
                  <div className="exercise-text">
                    <img src={schedule} alt="" className="small-icon" />
                    <p>Cada día trabajás</p>
                    <h3>{num1} horas</h3>
                  </div>
                  <img src={trabajo1} alt="Trabajo" className="work-image" />
                </div>

                <div className="calendar-box">
                  <div className="calendar-info">
                    <img src={calendarMonth} alt="" className="small-icon" />
                    <p>Y lo hacés durante</p>
                    <h3>{num2} días</h3>
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
              </>
            )}

            <label className="input-label" style={{ display: 'block', width: '100%', textAlign: 'center', marginBottom: '8px' }}>
              Ingresá tu respuesta
            </label>

            <div className="input-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'relative' }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={answer}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setAnswer(val);
                  }
                }}
                className="answer-input"
                style={!isFigmaExercise ? { width: '100%', maxWidth: '240px', textAlign: 'center' } : {}}
              />
              {isFigmaExercise && (
                <span className="hours-label">
                  Hs.
                </span>
              )}
            </div>

            <div 
              className="mate-container"
              onClick={() => setShowHintBubble(prev => !prev)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                gap: '12px',
                marginTop: '15px'
              }}
            >
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

              {showHintBubble && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '95px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '260px',
                    backgroundColor: '#7b61ff',
                    color: '#ffffff',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(123, 97, 255, 0.35)',
                    zIndex: 100,
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'default'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#7b61ff',
                    }}
                  />
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHintBubble(false);
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      opacity: 0.8,
                      fontSize: '11px'
                    }}
                  >
                    ✕
                  </div>
                  <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>💡 Pista de Mate-Mático</strong>
                  {currentHint}
                </div>
              )}
            </div>

          </div>

          <button
            className="primary-button"
            onClick={checkAnswer}
          >
            Comprobá la respuesta
          </button>

          </div>
          {showCalc && <Calculadora onClose={() => setShowCalc(false)} onInsertResult={(v) => setAnswer(v)} />}
        </div>
      )}
      {/* ==========================
    TARJETA 2 - EXPLICACIÓN
========================== */}

{screen === "hint" && (
  <div className="app-card multiple-choice-card feedback-card">

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

      <div className="explanation-box" style={{ width: '100%', boxSizing: 'border-box' }}>

        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#7b61ff', marginBottom: '8px', fontFamily: "'Poppins', sans-serif" }}>Pista de Mate-Mático</h3>
        <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.4', fontWeight: '500', margin: '0 0 12px 0' }}>
          {getAdaptiveHint()}
        </p>

        {errorMsg && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ef4444', marginBottom: '4px', margin: '0' }}>¿Por qué falló?</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.4', margin: '0' }}>{errorMsg}</p>
          </div>
        )}

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
          Tomate tu tiempo. Los matemáticos también aprenden mate a mate.
        </div>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
        <button
          className="primary-button"
          onClick={() => {
            setAnswer("");
            setScreen("exercise");
          }}
          style={{ width: '100%' }}
        >
          Intentar de nuevo
        </button>
        <span 
          onClick={() => {
            if (onComplete) {
              onComplete();
            }
          }} 
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

        <span>+{pointsAwarded || 15} puntos</span>

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

export default NumericExercise;
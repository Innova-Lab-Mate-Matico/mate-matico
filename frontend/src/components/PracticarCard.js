import React, { useState } from "react";
import telemetry from "../services/TelemetryService";
import { EfectosService } from "../services/EfectosService";
import ExerciseDispatcher from "./exercises/ExerciseDispatcher";
import Calculadora from "./Calculadora";
import "./PracticarCard.css";

// ============================
// IMÁGENES & ASSETS
// ============================
import image2 from "../assets/image 2.png";
import matecitoTech1 from "../assets/matecitoTech1.png";
import matecitoTech2 from "../assets/matecitoTech2.png";

import androidCell4Bar from "../assets/android_cell_4_bar.svg";
import bookRibbon from "../assets/book_ribbon.svg";
import formatListBulleted from "../assets/format_list_bulleted.svg";

import frame11 from "../assets/Frame 11.svg";
import group52 from "../assets/Group 52.svg";
import mateicoImg from "../assets/Mateico.png";

function PracticarCard({ apiCall, onBack, onNavigate, onRefreshProfile }) {
  // Filtros del formulario
  const [level, setLevel] = useState(1); // 0: Principiante, 1: Intermedio, 2: Avanzado
  const [section, setSection] = useState("Suma y Resta");
  const [structure, setStructure] = useState("multiple_choice");

  // Estados de generación y resolución
  const [loading, setLoading] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [aiExercise, setAiExercise] = useState(null); // { exercise, source }
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [attempt, setAttempt] = useState(1);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Generar ejercicio vía API
  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setValidationResult(null);
    setSelectedAnswer("");
    setAttempt(1);

    try {
      const data = await apiCall("/exercises/generate-ai", {
        method: "POST",
        body: JSON.stringify({
          level: Number(level),
          section,
          structure,
        }),
      });

      if (data && data.exercise) {
        setAiExercise(data);
        telemetry.track("ejercicio_iniciado", {
          modulo_id: "practica_ia",
          modulo_nombre: "Práctica con IA",
          leccion_id: `ia_${section.toLowerCase().replace(/\s+/g, '_')}`,
          leccion_nombre: section,
          ejercicio_id: data.exercise.id,
          ejercicio_nombre: data.exercise.description?.slice(0, 40) || 'Ejercicio IA',
          categoria: "Práctica IA",
          tema: section,
          nivel: level === 0 ? "Principiante" : level === 1 ? "Intermedio" : "Avanzado",
          dificultad: level === 0 ? "Fácil" : level === 1 ? "Media" : "Difícil",
          fuente_ia: data.source || "groq"
        });
      } else {
        throw new Error("No se pudo generar el ejercicio.");
      }
    } catch (err) {
      console.error("Error al generar ejercicio con IA:", err);
      setErrorMsg(
        err.message || "Ocurrió un inconveniente al conectar con el motor de IA. Reintentá en unos momentos."
      );
    } finally {
      setLoading(false);
    }
  };

  // Validar respuesta del ejercicio de IA
  const handleValidateAnswer = async (answerOverride) => {
    const answerToValidate = String(answerOverride || selectedAnswer || '').trim();
    if (!answerToValidate || validating || !aiExercise) return;

    setValidating(true);
    try {
      const { exercise } = aiExercise;
      const res = await apiCall("/exercises/validate-ai", {
        method: "POST",
        body: JSON.stringify({
          exerciseId: exercise.id,
          answer: answerToValidate,
          validationToken: exercise.validationToken,
          attempt,
        }),
      });

      setValidationResult(res);

      if (res.correcto) {
        EfectosService.reproducirSonido('acierto');
        EfectosService.dispararConfeti();
        telemetry.track("ejercicio_completado", {
          modulo_id: "practica_ia",
          modulo_nombre: "Práctica con IA",
          leccion_id: `ia_${section.toLowerCase().replace(/\s+/g, '_')}`,
          leccion_nombre: section,
          ejercicio_id: exercise.id,
          ejercicio_nombre: exercise.description?.slice(0, 40) || 'Ejercicio IA',
          categoria: "Práctica IA",
          tema: section,
          nivel: level === 0 ? "Principiante" : level === 1 ? "Intermedio" : "Avanzado",
          dificultad: level === 0 ? "Fácil" : level === 1 ? "Media" : "Difícil",
          resultado: "correcto",
          intentos: attempt,
          puntaje: res.puntosGanados ?? 10,
          tiempo_segundos: 30
        });
        if (onRefreshProfile) {
          onRefreshProfile(res);
        }
      } else {
        EfectosService.reproducirSonido('error');
        setAttempt((prev) => prev + 1);
        telemetry.track("ejercicio_fallado", {
          modulo_id: "practica_ia",
          modulo_nombre: "Práctica con IA",
          leccion_id: `ia_${section.toLowerCase().replace(/\s+/g, '_')}`,
          leccion_nombre: section,
          ejercicio_id: exercise.id,
          ejercicio_nombre: exercise.description?.slice(0, 40) || 'Ejercicio IA',
          categoria: "Práctica IA",
          tema: section,
          nivel: level === 0 ? "Principiante" : level === 1 ? "Intermedio" : "Avanzado",
          dificultad: level === 0 ? "Fácil" : level === 1 ? "Media" : "Difícil",
          resultado: "incorrecto",
          intentos: attempt
        });
      }
    } catch (err) {
      console.error("Error al validar respuesta:", err);
      setValidationResult({
        correcto: false,
        explicacionError: "Ocurrió un error al validar la respuesta. Por favor reintentá.",
      });
    } finally {
      setValidating(false);
    }
  };

  // Resetear para cambiar filtros
  const handleResetFilters = () => {
    setAiExercise(null);
    setValidationResult(null);
    setSelectedAnswer("");
    setErrorMsg(null);
    setAttempt(1);
  };

  // Finalizar práctica y salir al menú principal
  const handleFinishPractice = () => {
    telemetry.track("ejercicio_abandonado", {
      modulo_id: "practica_ia",
      modulo_nombre: "Práctica con IA",
      leccion_id: `ia_${section.toLowerCase().replace(/\s+/g, '_')}`,
      leccion_nombre: section,
      categoria: "Práctica IA",
      tema: section,
      nivel: level === 0 ? "Principiante" : level === 1 ? "Intermedio" : "Avanzado"
    });
    setAiExercise(null);
    setValidationResult(null);
    setSelectedAnswer("");
    setErrorMsg(null);
    setAttempt(1);
    if (onBack) {
      onBack();
    }
  };

  // -------------------------------------------------------------
  // VISTA 1: EJERCICIO GENERADO POR IA (EN CURSO O COMPLETADO)
  // -------------------------------------------------------------
  if (aiExercise && aiExercise.exercise) {
    const { exercise, source } = aiExercise;
    const isCompleted = validationResult?.correcto === true;

    return (
      <div className="exercise-layout-wrapper" style={{ maxWidth: showCalc ? '920px' : '600px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
        <div className="app-card practicar-card" style={{ flex: '1', maxWidth: '600px', margin: 0 }}>
          <img src={image2} alt="" className="card-top-wave" />

        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="back-button" onClick={handleResetFilters}>
            ← Ajustar filtros
          </button>
          <button 
            type="button" 
            onClick={handleFinishPractice}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Finalizar práctica 🏁
          </button>
        </div>

        <div className="card-content" style={{ padding: '10px 0 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={mateicoImg} alt="Mateico IA" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#163b74', margin: 0 }}>
                  Ejercicio Práctico ({section})
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Nivel {level === 0 ? '0 (Principiante)' : level === 1 ? '1 (Intermedio)' : '2 (Avanzado)'} • {source === 'gemini' ? '✨ Gemini' : '⚡ Groq Llama 3.3'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCalc(true)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: '700',
                color: '#475569',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              <span>🧮</span>
              <span>Calculadora</span>
            </button>
          </div>

          {/* Enunciado (Solo para opciones multiples clasicas o entradas directas) */}
          {exercise.type !== 'detective' && exercise.type !== 'decision' && structure !== 'detective' && structure !== 'decision' && (
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '18px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.98rem', color: '#1e293b', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
                {exercise.description}
              </p>
            </div>
          )}

          {/* Ejercicios de Pensamiento Matemático (Detective, Decisión, etc.) o Múltiple Opción / Entrada */}
          {exercise.type === 'detective' || exercise.type === 'decision' || structure === 'detective' || structure === 'decision' ? (
            <div style={{ marginBottom: '20px' }}>
              <ExerciseDispatcher
                exercise={{
                  ...exercise,
                  type: exercise.type || structure,
                  consigna: exercise.consigna || exercise.description,
                  title: exercise.title || (structure === 'detective' ? 'Detective de errores' : 'Dilema de compra')
                }}
                onAnswer={(ans) => {
                  setSelectedAnswer(ans);
                  handleValidateAnswer(ans);
                }}
                feedback={validationResult}
                isAnswered={isCompleted}
              />
            </div>
          ) : exercise.type === 'multiple_choice' && exercise.answers ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {exercise.answers.map((ans, idx) => {
                const isSelected = selectedAnswer === ans;
                let btnStyle = {
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: '2px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  textAlign: 'left',
                  cursor: isCompleted ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                };

                if (isSelected) {
                  btnStyle.borderColor = '#7b61ff';
                  btnStyle.background = '#f5f3ff';
                  btnStyle.color = '#7b61ff';
                }

                if (isCompleted && isSelected) {
                  btnStyle.borderColor = '#10b981';
                  btnStyle.background = '#ecfdf5';
                  btnStyle.color = '#065f46';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    style={btnStyle}
                    disabled={isCompleted || validating}
                    onClick={() => setSelectedAnswer(ans)}
                  >
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isSelected ? '#7b61ff' : '#f1f5f9', color: isSelected ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{ans}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#163b74', marginBottom: '8px' }}>
                Tu respuesta:
              </label>
              <input
                type="text"
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Ingresá tu respuesta o número..."
                disabled={isCompleted || validating}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          )}

          {/* Feedback de error o pista */}
          {validationResult && !validationResult.correcto && (
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <strong style={{ display: 'block', color: '#b45309', marginBottom: '6px', fontSize: '0.9rem' }}>
                {attempt === 2 ? '💡 Pista de Mateico:' : '📖 Explicación paso a paso:'}
              </strong>
              <p style={{ fontSize: '0.9rem', color: '#78350f', margin: 0, lineHeight: '1.4' }}>
                {attempt === 2 ? (exercise.hint || validationResult.explicacionError) : (exercise.explanation || validationResult.explicacionError)}
              </p>
            </div>
          )}

          {/* Pantalla de Éxito */}
          {isCompleted && (
            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🎉</span>
              <h3 style={{ color: '#065f46', fontSize: '1.2rem', fontWeight: '800', margin: '0 0 6px 0' }}>
                ¡Excelente respuesta!
              </h3>
              <p style={{ color: '#047857', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                Ganaste <strong>+{validationResult.puntosGanados ?? 10} puntos</strong>. ¡Seguí así!
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary-button generar-button"
                  onClick={handleGenerate}
                  style={{ flex: '1', minWidth: '170px', padding: '12px 18px', fontSize: '0.9rem' }}
                >
                  Generar otro ejercicio ✨
                </button>
                <button
                  type="button"
                  onClick={handleFinishPractice}
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    padding: '12px 18px',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  Finalizar práctica 🏁
                </button>
              </div>
            </div>
          )}
        </div>

        {!isCompleted && exercise.type !== 'detective' && exercise.type !== 'decision' && structure !== 'detective' && structure !== 'decision' && (
          <div className="card-footer">
            <button
              className="primary-button generar-button"
              onClick={handleValidateAnswer}
              disabled={!selectedAnswer.trim() || validating}
            >
              <span>{validating ? 'Comprobando...' : 'Comprobar respuesta'}</span>
            </button>
          </div>
        )}
        </div>

        {/* MODAL CALCULADORA MATE-MÁTICO */}
        {showCalc && (
          <Calculadora
            onClose={() => setShowCalc(false)}
            onInsertResult={(v) => setSelectedAnswer(String(v))}
          />
        )}

        {/* MODAL DE CARGA MATEICO */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px 24px',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              border: '2px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <img src={image2} alt="" className="card-top-wave" style={{ opacity: 0.6 }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <img 
                  src={mateicoImg} 
                  alt="Mateico creando..." 
                  style={{ 
                    width: '85px', 
                    height: '85px', 
                    objectFit: 'contain',
                    marginBottom: '16px'
                  }} 
                />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#163b74', margin: '0 0 8px 0' }}>
                  ¡Mateico está pensando! ✨
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                  Creando un nuevo ejercicio exclusivo de <strong>{section}</strong> para tu nivel...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA 2: FORMULARIO PRINCIPAL (FIGMA MATCHING)
  // -------------------------------------------------------------
  return (
    <div className="app-card practicar-card">
      {/* OLA DECORATIVA SUPERIOR DERECHA */}
      <img src={image2} alt="" className="card-top-wave" />

      {/* HEADER */}
      <div className="card-header">
        <button className="back-button" onClick={onBack}>
          ← volver
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="card-content">
        <h1 className="practicar-title">Practicar</h1>

        {/* HERO */}
        <section className="hero-section">
          <div className="hero-text">
            <h2>Practicá a tu manera</h2>
            <p>
              Elegí cómo querés practicar
              <br />
              y la IA generará ejercicios
              <br />
              para vos.
            </p>
          </div>

          <div className="hero-decoration">
            <img src={matecitoTech1} alt="Matecito IA" className="hero-image" />
          </div>
        </section>

        {/* MENSAJE DE ERROR SI EL BACKEND FALLA */}
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* FILTRO 1: NIVEL DE DIFICULTAD */}
        <div className="filter-group">
          <label>Nivel de dificultad</label>
          <div className="filter-row">
            <div className="circle-icon">
              <img src={androidCell4Bar} alt="" />
            </div>
            <select
              className="filter-select"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              disabled={loading}
            >
              <option value={0}>Nivel 0 (Principiante)</option>
              <option value={1}>Nivel 1 (Intermedio)</option>
              <option value={2}>Nivel 2 (Avanzado)</option>
            </select>
          </div>
        </div>

        {/* FILTRO 2: APARTADO TEMÁTICO */}
        <div className="filter-group">
          <label>Apartado temático</label>
          <div className="filter-row">
            <div className="circle-icon">
              <img src={bookRibbon} alt="" />
            </div>
            <select
              className="filter-select"
              value={section}
              onChange={(e) => {
                const val = e.target.value;
                setSection(val);
                if (val === 'Pensamiento matemático') {
                  setStructure('detective');
                } else if (structure === 'detective' || structure === 'decision') {
                  setStructure('multiple_choice');
                }
              }}
              disabled={loading}
            >
              <option value="Suma y Resta">Suma y resta</option>
              <option value="Multiplicación">Multiplicación</option>
              <option value="División">División</option>
              <option value="Fracciones">Fracciones</option>
              <option value="Ecuaciones">Porcentajes y finanzas</option>
              <option value="Pensamiento matemático">Pensamiento matemático (Detective y Dilemas)</option>
            </select>
          </div>
        </div>

        {/* FILTRO 3: ESTRUCTURA DE LA RESPUESTA */}
        <div className="filter-group">
          <label>Estructura de la respuesta</label>
          <div className="filter-row">
            <div className="circle-icon">
              <img src={formatListBulleted} alt="" />
            </div>
            <select
              className="filter-select"
              value={structure}
              onChange={(e) => setStructure(e.target.value)}
              disabled={loading}
            >
              {section === 'Pensamiento matemático' ? (
                <>
                  <option value="detective">Detective (Buscar error en ticket)</option>
                  <option value="decision">Dilema de compra (Opción A vs B)</option>
                </>
              ) : (
                <>
                  <option value="multiple_choice">Opción múltiple</option>
                  <option value="input">Entrada libre de texto / número</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* TARJETA INFO IA */}
        <div className="info-card ia-card">
          <img src={frame11} alt="IA" className="ia-icon" />
          <p>
            La IA creará ejercicios a tu medida,
            <br />
            para que aprendas y sigas
            <br />
            mejorando.
          </p>
        </div>

        {/* TARJETA MATE */}
        <div className="info-card mate-card">
          <img src={matecitoTech2} alt="Matecito" className="mate-info" />
          <p>
            Podés cambiar los filtros
            <br />
            cuando quieras para
            <br />
            practicar temas o niveles.
          </p>
        </div>
      </div>

      {/* BOTÓN DE GENERACIÓN */}
      <div className="card-footer">
        <button
          className="primary-button generar-button"
          onClick={handleGenerate}
          disabled={loading}
        >
          <span>{loading ? "Mateico está creando el ejercicio..." : "Generar ejercicio"}</span>
          <img src={group52} alt="" className="button-icon" />
        </button>
      </div>

      {/* MODAL CALCULADORA MATE-MÁTICO (EN VISTA FILTROS) */}
      {showCalc && (
        <Calculadora
          onClose={() => setShowCalc(false)}
          onInsertResult={(v) => setSelectedAnswer(String(v))}
        />
      )}

      {/* MODAL DE CARGA MATEICO (EN VISTA FILTROS) */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '36px 24px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '2px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <img src={image2} alt="" className="card-top-wave" style={{ opacity: 0.6 }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <img 
                src={mateicoImg} 
                alt="Mateico creando..." 
                style={{ 
                  width: '85px', 
                  height: '85px', 
                  objectFit: 'contain',
                  marginBottom: '16px'
                }} 
              />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#163b74', margin: '0 0 8px 0' }}>
                ¡Mateico está pensando! ✨
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                Creando un nuevo ejercicio exclusivo de <strong>{section}</strong> para tu nivel...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticarCard;

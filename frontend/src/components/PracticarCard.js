import React, { useState } from "react";
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

function PracticarCard({ apiCall, onBack, onNavigate }) {
  // Filtros del formulario
  const [level, setLevel] = useState(1); // 0: Principiante, 1: Intermedio, 2: Avanzado
  const [section, setSection] = useState("Suma y Resta");
  const [structure, setStructure] = useState("multiple_choice");

  // Estados de generación y resolución
  const [loading, setLoading] = useState(false);
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
    setAiExercise(null);
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
  const handleValidateAnswer = async () => {
    if (!selectedAnswer.trim() || validating || !aiExercise) return;

    setValidating(true);
    try {
      const { exercise } = aiExercise;
      const res = await apiCall("/exercises/validate-ai", {
        method: "POST",
        body: JSON.stringify({
          exerciseId: exercise.id,
          answer: selectedAnswer,
          validationToken: exercise.validationToken,
          attempt,
        }),
      });

      setValidationResult(res);

      if (!res.correcto) {
        setAttempt((prev) => prev + 1);
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

  // -------------------------------------------------------------
  // VISTA 1: EJERCICIO GENERADO POR IA (EN CURSO O COMPLETADO)
  // -------------------------------------------------------------
  if (aiExercise && aiExercise.exercise) {
    const { exercise, source } = aiExercise;
    const isCompleted = validationResult?.correcto === true;

    return (
      <div className="app-card practicar-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <img src={image2} alt="" className="card-top-wave" />

        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="back-button" onClick={handleResetFilters}>
            ← Ajustar filtros
          </button>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7b61ff', background: 'rgba(123, 97, 255, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
            {source === 'gemini' ? '✨ Gemini MathGen' : '🎲 Motor Adaptativo'}
          </span>
        </div>

        <div className="card-content" style={{ padding: '10px 0 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src={mateicoImg} alt="Mateico IA" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#163b74', margin: 0 }}>
                Ejercicio Práctico ({section})
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Nivel {level === 0 ? '0 (Principiante)' : level === 1 ? '1 (Intermedio)' : '2 (Avanzado)'}
              </span>
            </div>
          </div>

          {/* Enunciado */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '18px', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.98rem', color: '#1e293b', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
              {exercise.description}
            </p>
          </div>

          {/* Opciones Múltiples o Entrada Libre */}
          {exercise.type === 'multiple_choice' && exercise.answers ? (
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
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="primary-button generar-button"
                  onClick={handleGenerate}
                  style={{ width: 'auto', padding: '12px 24px' }}
                >
                  Generar otro ejercicio ✨
                </button>
              </div>
            </div>
          )}
        </div>

        {!isCompleted && (
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
              onChange={(e) => setSection(e.target.value)}
              disabled={loading}
            >
              <option value="Suma y Resta">Suma y resta</option>
              <option value="Multiplicación">Multiplicación</option>
              <option value="División">División</option>
              <option value="Fracciones">Fracciones</option>
              <option value="Ecuaciones">Porcentajes y finanzas</option>
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
              <option value="multiple_choice">Opción múltiple</option>
              <option value="input">Entrada libre de texto / número</option>
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
    </div>
  );
}

export default PracticarCard;

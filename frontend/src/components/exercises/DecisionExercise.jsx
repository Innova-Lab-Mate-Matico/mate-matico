import React, { useState } from 'react';
import TutorBubble from './TutorBubble';
import './PensamientoMatematico.css';

export default function DecisionExercise({ exercise, onAnswer, feedback, isAnswered }) {
  const [selectedId, setSelectedId] = useState(null);

  const { title, consigna, opcionA, opcionB, opcionC, pista } = exercise;
  const targetCorrect = String(exercise.correctAnswer || exercise.respuestaCorrecta || 'A').toUpperCase().trim();

  const handleSelect = (id) => {
    if (isAnswered) return;
    setSelectedId(id);
  };

  const handleSubmit = () => {
    if (!selectedId || isAnswered) return;
    onAnswer(selectedId);
  };

  const aiOptions = (exercise.answers && exercise.answers.length > 0) ? exercise.answers : [];

  const getCardClass = (cardId) => {
    let classes = `decision-card-option`;
    if (selectedId === cardId) classes += ` selected-${cardId}`;
    if (isAnswered) {
      if (targetCorrect === cardId || targetCorrect.includes(cardId)) {
        classes += ` correct`;
      } else if (selectedId === cardId) {
        classes += ` wrong`;
      }
    }
    return classes;
  };

  return (
    <div className="detective-card">
      {/* Tutor Bubble con Mateico2 apuntando a la izquierda (align="right") */}
      <TutorBubble
        title="Consejo Estratégico de Mateico"
        align="right"
        text={pista || exercise.hint || "Compará el desembolso o los datos antes de decidir."}
      />

      {title && (
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          ⚖️ {title}
        </h3>
      )}

      {consigna && (
        <p style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '16px' }}>
          {consigna}
        </p>
      )}

      {/* Grid Comparativo Opción A vs Opción B vs Opción C (Símétrico) */}
      {opcionA && opcionB ? (
        <div className={`decision-cards-grid ${opcionC ? 'has-3-options' : ''}`}>
          <div
            className={getCardClass('A')}
            onClick={() => handleSelect('A')}
          >
            <span className="decision-option-badge">
              Opción A {isAnswered && targetCorrect === 'A' ? '✅ Correcta' : ''}
            </span>
            <div className="decision-option-title">{opcionA.titulo}</div>
            <div className="decision-option-amount">${opcionA.montoTotal?.toLocaleString('es-AR')}</div>
            <div className="decision-option-subtext">{opcionA.detalle}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              {opcionA.subtexto}
            </div>
          </div>

          <div
            className={getCardClass('B')}
            onClick={() => handleSelect('B')}
          >
            <span className="decision-option-badge" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              Opción B {isAnswered && targetCorrect === 'B' ? '✅ Correcta' : ''}
            </span>
            <div className="decision-option-title">{opcionB.titulo}</div>
            <div className="decision-option-amount" style={{ color: '#7c3aed' }}>
              ${opcionB.montoTotal?.toLocaleString('es-AR')}
            </div>
            <div className="decision-option-subtext">{opcionB.detalle}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              {opcionB.subtexto}
            </div>
          </div>

          {opcionC && (
            <div
              className={getCardClass('C')}
              onClick={() => handleSelect('C')}
            >
              <span className="decision-option-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                Opción C {isAnswered && targetCorrect === 'C' ? '✅ Correcta' : ''}
              </span>
              <div className="decision-option-title">{opcionC.titulo}</div>
              <div className="decision-option-amount" style={{ color: '#0284c7' }}>
                ${opcionC.montoTotal?.toLocaleString('es-AR')}
              </div>
              <div className="decision-option-subtext">{opcionC.detalle}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                {opcionC.subtexto}
              </div>
            </div>
          )}
        </div>
      ) : aiOptions.length > 0 ? (
        <div className="detective-options-grid" style={{ marginBottom: '16px' }}>
          {aiOptions.map((opt, idx) => {
            const optStr = String(opt);
            const letter = String.fromCharCode(65 + idx);
            let btnClass = 'detective-option-btn';
            if (selectedId === optStr) btnClass += ' selected';
            if (isAnswered) {
              if (optStr === String(exercise.correctAnswer)) btnClass += ' correct';
              else if (selectedId === optStr) btnClass += ' wrong';
            }

            return (
              <button
                key={idx}
                className={btnClass}
                onClick={() => handleSelect(optStr)}
                disabled={isAnswered}
              >
                <strong>{letter})</strong> {optStr}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#163b74', marginBottom: '8px' }}>
            Tu respuesta:
          </label>
          <input
            type="text"
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            placeholder="Ingresá la cifra o respuesta..."
            disabled={isAnswered}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
      )}

      {!isAnswered && (
        <button
          className="btn-confirm-thinking"
          onClick={handleSubmit}
          disabled={!selectedId}
        >
          Elegir Mejor Opción
        </button>
      )}

      {isAnswered && feedback && (
        <div style={{
          marginTop: '16px',
          padding: '14px',
          borderRadius: '14px',
          background: feedback.correcto ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${feedback.correcto ? '#86efac' : '#fca5a5'}`,
          color: feedback.correcto ? '#15803d' : '#b91c1c',
          fontWeight: '700',
          fontSize: '0.95rem'
        }}>
          {feedback.correcto ? '🎉 ¡Decisión Inteligente! ' : '⚠️ '}
          {feedback.retroalimentacion || feedback.mensaje}
        </div>
      )}
    </div>
  );
}

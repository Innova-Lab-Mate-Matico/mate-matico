import React, { useState, useEffect } from 'react';
import TutorBubble from './TutorBubble';
import './PensamientoMatematico.css';

export default function DetectiveExercise({ exercise = {}, onAnswer, feedback, isAnswered, onComplete, userRole }) {
  const [selectedOptId, setSelectedOptId] = useState(null);

  const { title, consigna, ticket, opciones, pista } = exercise;

  // Normalizar lista de opciones (curadas u obtenidas de la IA)
  const listOptions = (opciones && opciones.length > 0)
    ? opciones.map(o => typeof o === 'string' ? { id: o, texto: o, correcta: o === exercise.correctAnswer } : o)
    : (exercise.answers && exercise.answers.length > 0)
      ? exercise.answers.map(a => ({ id: String(a), texto: String(a), correcta: String(a) === String(exercise.correctAnswer) }))
      : [];

  const isEstimacion = exercise.tipo === 'estimacion' || exercise.type === 'estimacion';

  const getInitialTime = () => {
    const role = String(userRole || '').toLowerCase();
    if (role.includes('avanzado') || role.includes('experto') || role === '2') return 10;
    if (role.includes('intermedio') || role === '1') return 15;
    return 20; // principiante / 0
  };

  const [timeLeft, setTimeLeft] = useState(() => getInitialTime());
  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    if (!isEstimacion || isAnswered || timeExpired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeExpired(true);
          onAnswer("TIEMPO_AGOTADO");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isEstimacion, isAnswered, timeExpired]);

  const handleSelectOption = (optId) => {
    if (isAnswered || timeExpired) return;
    setSelectedOptId(optId);
  };

  const handleSubmit = () => {
    if (!selectedOptId || isAnswered || timeExpired) return;
    onAnswer(selectedOptId);
  };

  return (
    <div className="detective-card">
      <style>{`
        @keyframes timer-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>

      {isEstimacion && !isAnswered && !timeExpired && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: timeLeft <= 5 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${timeLeft <= 5 ? '#fecaca' : '#bbf7d0'}`,
          padding: '10px 16px',
          borderRadius: '12px',
          marginBottom: '16px',
          fontFamily: "'Poppins', sans-serif",
          fontWeight: '700',
          transition: 'all 0.3s ease'
        }}>
          <span style={{ fontSize: '1.2rem' }}>⏱️</span>
          <span style={{
            color: timeLeft <= 5 ? '#dc2626' : '#16a34a',
            fontSize: '1.1rem',
            animation: timeLeft <= 5 ? 'timer-pulse 1s infinite' : 'none'
          }}>
            Tiempo restante: {timeLeft}s
          </span>
        </div>
      )}

      {/* Tutor Bubble con Mateico apuntando a la derecha (align="left") */}
      <TutorBubble
        title="Orientación de Mateico"
        align="left"
        text={pista || exercise.hint || "Revisá los datos del problema con atención."}
      />

      {title && (
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          🕵️ {title}
        </h3>
      )}

      {consigna && (
        <p style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '16px' }}>
          {consigna}
        </p>
      )}

      {/* Renderizado de la Factura / Ticket */}
      {ticket && (
        <div className="ticket-receipt">
          <div className="ticket-header">
            <div className="ticket-title">{ticket.empresa}</div>
            <div className="ticket-date">{ticket.fecha}</div>
          </div>

          <div className="ticket-items-list">
            {(ticket.items || []).map((item, idx) => (
              <div key={idx} className="ticket-item-row">
                <span>{item.nombre}</span>
                <span>${item.precio?.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>

          <div className="ticket-summary-divider" />

          <div className="ticket-summary-row">
            <span>Subtotal:</span>
            <span>${ticket.subtotal?.toLocaleString('es-AR')}</span>
          </div>

          {ticket.descuentoTexto && (
            <div className="ticket-summary-row error-highlight">
              <span>{ticket.descuentoTexto}:</span>
              <span>-${ticket.descuentoAplicado?.toLocaleString('es-AR')}</span>
            </div>
          )}

          {ticket.recargoTexto && (
            <div className="ticket-summary-row error-highlight">
              <span>{ticket.recargoTexto}:</span>
              <span>+${ticket.descuentoAplicado?.toLocaleString('es-AR')}</span>
            </div>
          )}

          <div className="ticket-total-row">
            <span>TOTAL COBRADO:</span>
            <span>${ticket.totalCobrado?.toLocaleString('es-AR')}</span>
          </div>
        </div>
      )}

      {/* Opciones de Selección o Entrada de Texto */}
      {listOptions.length > 0 ? (
        <div className="detective-options-grid">
          {listOptions.map((opt, idx) => {
            const optId = opt.id || String(idx);
            let btnClass = 'detective-option-btn';
            if (selectedOptId === optId) btnClass += ' selected';
            if (isAnswered || timeExpired) {
              if (opt.correcta) btnClass += ' correct';
              else if (selectedOptId === optId) btnClass += ' wrong';
            }

            return (
              <button
                key={optId}
                className={btnClass}
                onClick={() => handleSelectOption(optId)}
                disabled={isAnswered || timeExpired}
              >
                {opt.texto}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#163b74', marginBottom: '8px' }}>
            Escribí tu respuesta:
          </label>
          <input
            type="text"
            value={selectedOptId || ''}
            onChange={(e) => setSelectedOptId(e.target.value)}
            placeholder="Ingresá la cifra o respuesta..."
            disabled={isAnswered || timeExpired}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '2px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
      )}

      {!isAnswered && !timeExpired && (
        <button
          className="btn-confirm-thinking"
          onClick={handleSubmit}
          disabled={!selectedOptId}
        >
          Confirmar Respuesta
        </button>
      )}

      {timeExpired && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          borderRadius: '14px',
          background: '#fef2f2',
          border: '1.5px solid #fca5a5',
          color: '#b91c1c',
          fontWeight: '700',
          fontSize: '0.95rem',
          textAlign: 'center'
        }}>
          ⚠️ ¡El tiempo se agotó! La respuesta correcta era:<br />
          <strong style={{ fontSize: '1.05rem', color: '#991b1b', display: 'block', marginTop: '6px' }}>
            {listOptions.find(o => o.correcta)?.texto || exercise.correctAnswer || ''}
          </strong>
        </div>
      )}

      {timeExpired && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-confirm-thinking"
            onClick={() => {
              if (onComplete) onComplete();
            }}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              margin: '0',
              padding: '14px 24px',
              fontSize: '1rem',
              maxWidth: '320px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
            }}
          >
            Continuar lección ➔
          </button>
        </div>
      )}

      {!timeExpired && isAnswered && feedback && (
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
          {feedback.correcto ? '🎉 ¡Correcto! ' : '⚠️ '}
          {feedback.retroalimentacion || feedback.mensaje}
        </div>
      )}
    </div>
  );
}

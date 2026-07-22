import React, { useState } from 'react';
import './ejercicios.css';
import BotonAncla from './BotonAncla';
import luzIcon from '../assets/luz.png';
import changuitoIcon from '../assets/changuito.png';

function renderVisualAid(theoryId) {
  if (theoryId === 'fracciones-equivalentes') {
    return (
      <div style={{
        margin: '20px auto',
        padding: '15px',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '1.5px solid #e5e7eb',
        maxWidth: '400px'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#163b74', marginBottom: '15px', textAlign: 'center' }}>
          Visualización: 1/2 es equivalente a 2/4
        </h3>
        
        {/* Barra 1/2 */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563', marginBottom: '5px' }}>
            Barra A (Dividida en 2, tomamos 1) → <strong>1/2</strong>
          </div>
          <div style={{
            width: '100%',
            height: '35px',
            display: 'flex',
            borderRadius: '8px',
            border: '2px solid #7b61ff',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #7b61ff 0%, #6366f1 100%)', borderRight: '1px solid rgba(255,255,255,0.3)' }} />
            <div style={{ flex: 1, background: '#e5e7eb' }} />
          </div>
        </div>

        {/* Barra 2/4 */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4b5563', marginBottom: '5px' }}>
            Barra B (Dividida en 4, tomamos 2) → <strong>2/4</strong>
          </div>
          <div style={{
            width: '100%',
            height: '35px',
            display: 'flex',
            borderRadius: '8px',
            border: '2px solid #7b61ff',
            overflow: 'hidden'
          }}>
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #7b61ff 0%, #6366f1 100%)', borderRight: '1px solid rgba(255,255,255,0.3)' }} />
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #7b61ff 0%, #6366f1 100%)', borderRight: '1px solid rgba(255,255,255,0.3)' }} />
            <div style={{ flex: 1, background: '#e5e7eb', borderRight: '1px solid rgba(0,0,0,0.1)' }} />
            <div style={{ flex: 1, background: '#e5e7eb' }} />
          </div>
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '10px', textAlign: 'center', fontStyle: 'italic' }}>
          ¡Observá cómo la zona pintada ocupa exactamente el mismo espacio físico en ambas barras!
        </p>
      </div>
    );
  }

  if (theoryId === 'cocina-suma') {
    return (
      <div style={{
        margin: '20px auto',
        padding: '15px',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '1.5px solid #e5e7eb',
        maxWidth: '400px'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#163b74', marginBottom: '15px', textAlign: 'center' }}>
          Ejemplo en la cocina: 1/4 taza + 2/4 taza = 3/4 taza
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', margin: '10px 0' }}>
          {/* Taza 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '45px',
              height: '60px',
              border: '3px solid #163b74',
              borderTop: 'none',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              background: '#fff'
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '25%', background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', marginTop: '5px' }}>1/4 taza</span>
          </div>

          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#163b74' }}>+</span>

          {/* Taza 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '45px',
              height: '60px',
              border: '3px solid #163b74',
              borderTop: 'none',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              background: '#fff'
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', marginTop: '5px' }}>2/4 taza</span>
          </div>

          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#163b74' }}>=</span>

          {/* Taza 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '45px',
              height: '60px',
              border: '3px solid #163b74',
              borderTop: 'none',
              borderBottomLeftRadius: '10px',
              borderBottomRightRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              background: '#fff',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '75%', background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', marginTop: '5px', color: '#3b82f6' }}>3/4 taza</span>
          </div>
        </div>
      </div>
    );
  }

  if (theoryId === 'decimales-dinero') {
    return (
      <div style={{
        margin: '20px auto',
        padding: '15px',
        background: '#f9fafb',
        borderRadius: '12px',
        border: '1.5px solid #e5e7eb',
        maxWidth: '400px'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#163b74', marginBottom: '15px', textAlign: 'center' }}>
          La Fracción en el Dinero: 25 centavos = 1/4 de Peso
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          {/* Moneda 1 Peso */}
          <div style={{
            width: '65px',
            height: '65px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #b45309',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>$1.00</span>
          </div>

          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#163b74' }}>➔</span>

          {/* Cuatro monedas de 25 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: i === 1 ? 'linear-gradient(135deg, #a1a1aa 0%, #71717a 100%)' : '#e4e4e7',
                color: i === 1 ? '#fff' : '#71717a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: '700',
                border: i === 1 ? '1.5px solid #52525b' : '1.5px dashed #a1a1aa',
                boxShadow: i === 1 ? '0 0 8px rgba(161, 161, 170, 0.6)' : 'none'
              }}>
                {i === 1 ? '1/4' : '$0.25'}
              </div>
            ))}
          </div>
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '12px', textAlign: 'center', fontStyle: 'italic' }}>
          Se necesitan exactamente 4 monedas de $0.25 para formar $1.00. Por eso, cada una representa 1 de 4 partes (1/4).
        </p>
      </div>
    );
  }

  return null;
}

export function TutorMateicoChat({ moduleId, lessonId, theoryId, apiCall, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([
    {
      sender: 'tutor',
      text: '¡Hola! Soy Mateico, tu tutor. ¿Tenés alguna duda sobre este tema? Hacé clic en alguna de las preguntas de abajo o escribime lo que no entiendas y te ayudo a resolverlo paso a paso.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const getSuggestions = () => {
    if (theoryId === 'fracciones-equivalentes') {
      return [
        '¿Por qué 2/4 es lo mismo que 1/2?',
        '¿Cómo sé si dos fracciones son equivalentes?',
        '¿Me das un ejemplo en la cocina?'
      ];
    }
    if (theoryId === 'cocina-suma') {
      return [
        '¿Cómo sumo fracciones con distinto denominador?',
        '¿Me das otro ejemplo de cocina?',
        'Explicámelo más simple'
      ];
    }
    if (theoryId === 'decimales-dinero') {
      return [
        '¿Cómo se relaciona 0.50 con las fracciones?',
        '¿Por qué sirve usar decimales?',
        'Explicámelo para un nene de 5 años'
      ];
    }
    if (moduleId === 'porcentajes') {
      return [
        '¿Cómo calculo el 15% de descuento paso a paso?',
        '¿Me das otro ejemplo cotidiano?',
        'Explicámelo más simple'
      ];
    }
    if (moduleId === 'economia') {
      return [
        '¿Cómo funciona el recargo de IVA?',
        '¿Qué es el interés compuesto?',
        '¿Me das un ejemplo práctico?'
      ];
    }
    return [
      '¿Me das otro ejemplo cotidiano de esto?',
      '¿Cómo lo resuelvo paso a paso?',
      'Explicámelo más simple'
    ];
  };

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await apiCall('/ai/explain', {
        method: 'POST',
        body: JSON.stringify({
          moduleId,
          lessonId,
          theoryId,
          question: textToSend,
          history: chatHistory
        })
      });

      const tutorResponse = res.explanation || 'Disculpame, se me complicó la yerba. ¿Me repetís la pregunta?';
      setMessages((prev) => [...prev, { sender: 'tutor', text: tutorResponse }]);
    } catch (err) {
      console.error('Error al consultar al tutor:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'tutor', text: 'Che, ando sin señal en el tutor virtual. ¡Intentemos de nuevo en un ratito!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tutor-ia-section">
      <div className="tutor-ia-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>🧉 Preguntale a Mateico (Tutor IA)</h3>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="tutor-ia-chat-box">
          <div className="tutor-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`tutor-message ${m.sender}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="tutor-loading">
                🧉 Mateico está pensando...
              </div>
            )}
          </div>

          <div className="tutor-suggestions">
            {getSuggestions().map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="tutor-suggestion-btn"
                onClick={() => handleSendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="tutor-input-row"
          >
            <input
              type="text"
              className="tutor-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribí tu pregunta sobre el tema..."
              disabled={loading}
            />
            <button type="submit" className="tutor-send-btn" disabled={loading}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function DynamicTheoryCard({ theory, moduleId, lessonId, apiCall, onContinuar }) {
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
          {theory.titulo}
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
            {theory.explicacionTitle || "Explicación"}
          </h2>

          <p className="microleccion1-card__description">
            {theory.explicacion}
          </p>
        </div>

        {/* Ayudas visuales dinámicas */}
        {renderVisualAid(theory.id)}

        {theory.ejemplo && (
          <div className="microleccion1-card__section microleccion1-card__section--ejemplo">
            <div className="microleccion1-card__image-box">
              <img
                src={changuitoIcon}
                alt="Icono de carrito"
                className="microleccion1-card__img"
              />
            </div>

            <h2 className="microleccion1-card__title">
              {theory.ejemploTitle || "Situación cotidiana"}
            </h2>

            <p className="microleccion1-card__description">
              {theory.ejemplo}
            </p>
          </div>
        )}

        {/* Tutor Virtual Mateico Chat Box */}
        {apiCall && (
          <TutorMateicoChat 
            moduleId={moduleId} 
            lessonId={lessonId} 
            theoryId={theory.id} 
            apiCall={apiCall} 
          />
        )}

        <div
          className="microleccion1-card__actions"
          onClick={handleIntercept}
        >
          <BotonAncla destino="ejercicios">
            Continuar
          </BotonAncla>
        </div>
      </div>
    </div>
  );
}

export default DynamicTheoryCard;

import React from 'react';
import descanso2 from '../assets/descanso2.png';
import './RachaRotaModal.css';

const MENSAJES = [
  '¡No pasa nada! Lo importante es que volviste. Un ejercicio hoy y tu racha arranca de nuevo. 💪',
  'Todos necesitamos un descanso. Lo genial es que estás acá de nuevo. ¡Dale, un ejercicio y listo!',
  'El mate se lavó, pero la garra no. ¡Volvé a practicar y recuperá tu racha hoy mismo! 🔥',
  'Cada día es una nueva oportunidad. Arrancá con un ejercicio y demostrá que podés. ¡Vamos!',
];

// Mensaje aleatorio para que no sea siempre el mismo
const mensajeAleatorio = MENSAJES[Math.floor(Math.random() * MENSAJES.length)];

export default function RachaRotaModal({ onClose, onPracticar }) {
  return (
    <div className="racha-rota-overlay" onClick={onClose}>
      <div
        className="racha-rota-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Se lavó el mate"
      >
        {/* Botón cerrar */}
        <button
          className="racha-rota-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Imagen mascota */}
        <img
          src={descanso2}
          alt="Mate descansando"
          className="racha-rota-img"
        />

        {/* Título */}
        <h2 className="racha-rota-title">¡Se lavó el mate! 🧉</h2>

        {/* Subtítulo */}
        <div className="racha-rota-streak-badge">
          🔥 Tu racha se reinició
        </div>

        {/* Mensaje empático */}
        <p className="racha-rota-message">{mensajeAleatorio}</p>

        {/* Botón CTA */}
        <button
          type="button"
          className="racha-rota-btn"
          onClick={() => {
            onPracticar();
            onClose();
          }}
        >
          ¡Volver a practicar!
        </button>

        {/* Link secundario */}
        <button
          type="button"
          className="racha-rota-skip"
          onClick={onClose}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}

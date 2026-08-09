import React from 'react';
import mateicoLeft from '../../assets/Mateico.png';   // Apunta a la derecha (cuando se ubica a la izquierda)
import mateicoRight from '../../assets/Mateico2.png'; // Apunta a la izquierda (cuando se ubica a la derecha)
import './PensamientoMatematico.css';

/**
 * Componente de Bocadillo de Diálogo Inteligente con Mateico.
 * Si align="left", se ubica a la izquierda y usa Mateico.png (apunta a la derecha).
 * Si align="right", se ubica a la derecha y usa Mateico2.png (apunta a la izquierda).
 */
export default function TutorBubble({ text, align = 'left', title = 'Mateico te orienta' }) {
  const isLeft = align === 'left';
  const mascotImg = isLeft ? mateicoLeft : mateicoRight;

  return (
    <div className={`tutor-bubble-container ${isLeft ? 'align-left' : 'align-right'}`}>
      {isLeft && (
        <div className="tutor-avatar-wrapper">
          <img src={mascotImg} alt="Mateico IA" className="tutor-avatar-img" />
        </div>
      )}

      <div className="tutor-speech-bubble">
        <div className="tutor-bubble-header">
          <span className="tutor-badge-tag">🤖 {title}</span>
        </div>
        <p className="tutor-bubble-text">{text}</p>
      </div>

      {!isLeft && (
        <div className="tutor-avatar-wrapper">
          <img src={mascotImg} alt="Mateico IA" className="tutor-avatar-img" />
        </div>
      )}
    </div>
  );
}

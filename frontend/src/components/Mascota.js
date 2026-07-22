import React from 'react';
import mateEscolar from '../assets/mate_escolar.webp';
import mateProfesor from '../assets/mate_profesor.webp';
import mateAcademico from '../assets/mate_academico.webp';

/*
  MATE-MÁTICO — COMPONENTE MASCOTA (REACT CLÁSICO)
  Este componente representa la mascota visual del usuario
  según el nivel académico alcanzado, usando las ilustraciones
  del personaje oficial de Mate-Mático.
*/

export default function Mascota({ rol }) {
  const getMascotaVisual = () => {
    const r = (rol || '').toLowerCase();
    switch (r) {
      case 'avanzado':
      case 'experto':
        return {
          imgSrc: mateAcademico,
          levelName: 'Nivel Experto',
          description: '¡Felicitaciones! Has alcanzado el nivel máximo.',
          accentColor: '#7b61ff'
        };

      case 'intermedio':
      case 'secundario':
      case 'medio':
        return {
          imgSrc: mateProfesor,
          levelName: 'Nivel Intermedio',
          description: '¡Excelente progreso! Seguí practicando.',
          accentColor: '#163b74'
        };

      case 'principiante':
      case 'inicial':
      case 'basico':
      default:
        return {
          imgSrc: mateEscolar,
          levelName: 'Nivel Inicial',
          description: '¡Comenzá a aprender y sumá puntos!',
          accentColor: '#383d41'
        };
    }
  };

  const visual = getMascotaVisual();

  return (
    <div
      className="mascota-box"
      style={{ 
        borderColor: visual.accentColor, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px',
        padding: '15px',
        borderRadius: '16px',
        border: `2px solid ${visual.accentColor}`
      }}
    >
      <img
        src={visual.imgSrc}
        alt={visual.levelName}
        style={{ 
          width: '70px', 
          height: '70px', 
          objectFit: 'contain',
          flexShrink: 0
        }}
      />

      <div>
        <strong style={{ color: '#163b74', fontSize: '1.15rem', fontWeight: '800', fontFamily: 'Poppins, sans-serif' }}>
          {visual.levelName}
        </strong>

        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>
          {visual.description}
        </p>
      </div>
    </div>
  );
}
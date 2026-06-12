import React from 'react';

/*
  MATE-MÁTICO — COMPONENTE MASCOTA (REACT CLÁSICO)
  Este componente representa la mascota visual del usuario
  según el nivel académico alcanzado.
*/

export default function Mascota({ rol }) {
  const getMascotaVisual = () => {
    switch (rol) {
      case 'avanzado':
        return {
          emoji: '🎓🧉📜',
          outfit: 'Mate Académico (toga azul y birrete)',
          accentColor: '#856404'
        };

      case 'intermedio':
        return {
          emoji: '👓🧉👔',
          outfit: 'Mate Profesor (saco gris y camisa)',
          accentColor: '#0c5460'
        };

      case 'principiante':
      default:
        return {
          emoji: '👦🧉🎒',
          outfit: 'Mate Escolar (guardapolvo blanco)',
          accentColor: '#383d41'
        };
    }
  };

  const visual = getMascotaVisual();

  return (
    <div
      className="mascota-box"
      style={{ borderColor: visual.accentColor }}
    >
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>
        {visual.emoji}
      </div>

      <div>
        <strong>Visual de Mascota Activo:</strong>

        <p style={{ fontSize: '13px', color: '#555' }}>
          {visual.outfit}
        </p>
      </div>
    </div>
  );
}
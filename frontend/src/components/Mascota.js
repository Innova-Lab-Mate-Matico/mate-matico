import React from 'react';

/*
  MATE-MÁTICO — COMPONENTE MASCOTA (REACT CLÁSICO)

  Este componente representa la mascota visual del usuario
  según el nivel académico alcanzado.

  Actualmente funciona como placeholder visual desacoplado.

  El equipo frontend puede reemplazar:
  - emojis,
  - divs,
  - estilos,
  - assets,
  - SVGs,
  - animaciones,
  - modelos 3D,
  - Lottie,
  por la implementación visual final.

  Compatible con:
  - Create React App
  - React clásico
*/

export default function Mascota({ rol }) {
  const getMascotaVisual = () => {
    switch (rol) {
      case 'avanzado':
        return {
          emoji: '🎓🧉📜',
          outfit:
            'Mate Académico (viste toga azul oscuro y birrete universitario con diploma)',
          accentColor: '#856404'
        };

      case 'intermedio':
        return {
          emoji: '👓🧉👔',
          outfit:
            'Mate Profesor (viste saco gris, camisa blanca y moño rojo con anteojos)',
          accentColor: '#0c5460'
        };

      case 'principiante':
      default:
        return {
          emoji: '👦🧉🎒',
          outfit:
            'Mate Escolar (viste guardapolvo blanco tradicional con escarapela)',
          accentColor: '#383d41'
        };
    }
  };

  const visual = getMascotaVisual();

  return (
    <div
      className="mascota-box"
      style={{
        borderColor: visual.accentColor
      }}
    >
      <div
        style={{
          fontSize: '48px',
          marginBottom: '8px'
        }}
      >
        {visual.emoji}
      </div>

      <div>
        <strong>
          Visual de Mascota Activo:
        </strong>

        <p
          style={{
            fontSize: '13px',
            color: '#555',
            marginTop: '4px'
          }}
        >
          {visual.outfit}
        </p>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '10px',
          fontStyle: 'italic'
        }}
      >
        [Frontend: reemplazar este
        placeholder por la mascota final]
      </div>
    </div>
  );
}
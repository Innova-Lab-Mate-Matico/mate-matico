import React from 'react';

/* 
  MATE-MÁTICO — COMPONENTE MASCOTA (BOCETO DESACOPLADO)
  Este componente es un marcador de posición (placeholder) limpio que 
  cambia su descripción y emoji según el nivel de rol del usuario.
  
  Tu equipo de frontend puede reemplazar el HTML interno por su propio
  componente SVG, imágenes animadas (como Lottie, GIFs o PNGs), o lo que deseen.
*/
export default function Mascota({ rol }) {
  const getMascotaVisual = () => {
    switch (rol) {
      case 'avanzado':
        return {
          emoji: '🎓🧉📜',
          outfit: 'Mate Académico (viste Toga azul oscuro y Birrete universitario con borla dorada y diploma)',
          accentColor: '#856404'
        };
      case 'intermedio':
        return {
          emoji: '👓🧉👔',
          outfit: 'Mate Profesor (viste Saco gris, Camisa blanca y Moño rojo elegante con anteojos de marco grueso)',
          accentColor: '#0c5460'
        };
      case 'principiante':
      default:
        return {
          emoji: '👦🧉🎒',
          outfit: 'Mate Escolar (viste Guardapolvo blanco tradicional de escuela primaria con bolsillo y escarapela en el pecho)',
          accentColor: '#383d41'
        };
    }
  };

  const visual = getMascotaVisual();

  return (
    <div className="mascota-box" style={{ borderColor: visual.accentColor }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>
        {visual.emoji}
      </div>
      <div>
        <strong>Visual de Mascota Activo:</strong>
        <p style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
          {visual.outfit}
        </p>
      </div>
      <div style={{ fontSize: '11px', color: '#999', marginTop: '10px', fontStyle: 'italic' }}>
        [Desarrolladores: Reemplazar este div por el asset final de la mascota]
      </div>
    </div>
  );
}

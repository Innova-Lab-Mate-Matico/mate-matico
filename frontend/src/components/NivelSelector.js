import React from 'react';

const NivelSelector = ({ selectedNivel, onSelectNivel, onNext, onBack }) => {
  const opciones = [
    { value: 2, label: 'Necesito ayuda', pct: '33%' },
    { value: 3, label: 'Me defiendo', pct: '66%' },
    { value: 5, label: 'Me siento seguro', pct: '100%' },
  ];

  const activeOpt = opciones.find((o) => o.value === selectedNivel);
  const progressPct = activeOpt ? activeOpt.pct : '0%';

  return (
    <div className="nivel-container">
      <h2>Nivel de conocimientos en matemática</h2>

      <p>
        No hace falta ser experto. Elegí el nivel que mejor represente cómo te
        sentís hoy con las matemáticas.
      </p>

      <div className="barra">
        <div
          className="progreso"
          style={{ width: progressPct, transition: 'width 0.3s ease' }}
        ></div>
      </div>

      <div
        className="niveles"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '25px',
        }}
      >
        {opciones.map((opt) => {
          const isSelected = selectedNivel === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelectNivel(opt.value)}
              style={{
                flex: 1,
                padding: '12px 6px',
                border: isSelected ? '2px solid #9747FF' : '1px solid #D1D5DB',
                borderRadius: '8px',
                backgroundColor: isSelected ? '#F3E8FF' : '#FFFFFF',
                color: '#333333',
                cursor: 'pointer',
                fontWeight: isSelected ? 'bold' : 'normal',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          type="button"
          className="onboarding-back-btn"
          onClick={onBack}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: '1px solid #D1D5DB',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Atrás
        </button>
        <button
          className="continuar"
          onClick={onNext}
          disabled={!selectedNivel}
          style={{
            flex: 1,
            maxWidth: '240px',
            opacity: selectedNivel ? 1 : 0.5,
            cursor: selectedNivel ? 'pointer' : 'not-allowed',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default NivelSelector;
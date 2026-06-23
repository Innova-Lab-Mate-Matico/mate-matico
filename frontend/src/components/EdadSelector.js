import React from 'react';

const EdadSelector = ({ selectedRango, onSelectRango, onNext }) => {
  const rangos = ['18 - 24', '25 - 34', '35 - 44', 'Más de 45'];

  return (
    <div className="edad-container">
      <h2>Seleccioná tu edad</h2>

      <p>
        Cada persona aprende a su ritmo. Contanos tu rango de edad para
        personalizar tu experiencia.
      </p>

      <div className="edad-opciones">
        {rangos.map((rango) => {
          const isSelected = selectedRango === rango;
          return (
            <button
              key={rango}
              type="button"
              onClick={() => onSelectRango(rango)}
              style={{
                backgroundColor: isSelected ? '#1E3A5F' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#333333',
                borderColor: isSelected ? '#1E3A5F' : '#D1D5DB',
                fontWeight: isSelected ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
              }}
            >
              {rango}
            </button>
          );
        })}
      </div>

      <button
        className="continuar"
        onClick={onNext}
        disabled={!selectedRango}
        style={{
          marginTop: '20px',
          opacity: selectedRango ? 1 : 0.5,
          cursor: selectedRango ? 'pointer' : 'not-allowed',
        }}
      >
        Continuar
      </button>
    </div>
  );
};

export default EdadSelector;
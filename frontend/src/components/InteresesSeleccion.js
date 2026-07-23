import React from 'react';

const INTERESES_MOCK = [
  { id: 'cuotas', label: 'Cuotas y préstamos' },
  { id: 'promos', label: 'Promociones y descuentos' },
  { id: 'sueldos', label: 'Sueldos e ingresos' },
  { id: 'economia', label: 'Economía de hogar 🏠' },
  { id: 'finanzas', label: 'Finanzas personales 💰' },
  { id: 'basicas', label: 'Cálculos y operaciones básicas 🧮' },
  { id: 'repartos', label: 'Repartos y divisiones 🍕' },
  { id: 'recetas', label: 'Recetas, partes y medidas ⚖️' }
];

function InteresesSeleccion({ selectedIntereses = [], onToggleInteres, onNext, onBack }) {
  return (
    <div className="auth-container intereses-page" style={{ minHeight: 'auto', padding: '20px 0' }}>
      <div className="intereses-card">
        {/* Encabezado */}
        <h1 className="auth-title">¿Qué te gustaría aprender?</h1>
        <p className="auth-subtitle">
          Vamos a mostrarte situaciones que realmente podés encontrarte en tu día a día.
        </p>

        {/* Listado de Intereses */}
        <div className="intereses-section">
          <h2 className="intereses-heading">Intereses (Seleccioná al menos uno)</h2>
          <div className="tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flexDirection: 'row' }}>
            {INTERESES_MOCK.map((interes) => {
              const isSelected = selectedIntereses.includes(interes.id);
              return (
                <button
                  key={interes.id}
                  type="button"
                  className={`tag-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => onToggleInteres && onToggleInteres(interes.id)}
                  style={{
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                  }}
                >
                  {interes.label} {isSelected ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="action-container" style={{ display: 'flex', gap: '10px', marginTop: '25px', maxWidth: '360px', width: '100%' }}>
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
            flex: 1,
          }}
        >
          Atrás
        </button>
        <button
          type="button"
          className="continuar"
          onClick={onNext}
          disabled={selectedIntereses.length === 0}
          style={{
            flex: 2,
            opacity: selectedIntereses.length > 0 ? 1 : 0.5,
            cursor: selectedIntereses.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

export default InteresesSeleccion;
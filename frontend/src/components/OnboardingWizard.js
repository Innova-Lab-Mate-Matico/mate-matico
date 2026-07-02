import React, { useState } from 'react';
import EdadSelector from './EdadSelector';
import NivelSelector from './NivelSelector';
import InteresesSeleccion from './InteresesSeleccion';
import RecomendacionModulo from './RecomendacionModulo';
import './OnboardingWizard.css';

export default function OnboardingWizard({ apiCall, onComplete }) {
  const [step, setStep] = useState(1);
  const [edadRango, setEdadRango] = useState('');
  const [edad, setEdad] = useState(null);
  const [nivelEducativo, setNivelEducativo] = useState('secundaria');
  const [confianzaMath, setConfianzaMath] = useState(null);
  const [interesesSeleccionados, setInteresesSeleccionados] = useState([]);
  const [objetivo, setObjetivo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [moduloRecomendado, setModuloRecomendado] = useState('porcentajes');
  const [savedUsuario, setSavedUsuario] = useState(null);

  const handleSelectEdadRango = (rango) => {
    setEdadRango(rango);
    let numericAge = 20;
    if (rango === '18 - 24') numericAge = 20;
    else if (rango === '25 - 34') numericAge = 30;
    else if (rango === '35 - 44') numericAge = 40;
    else if (rango === 'Más de 45') numericAge = 50;
    setEdad(numericAge);
  };

  const toggleInteres = (id) => {
    if (interesesSeleccionados.includes(id)) {
      setInteresesSeleccionados(interesesSeleccionados.filter(i => i !== id));
    } else {
      setInteresesSeleccionados([...interesesSeleccionados, id]);
    }
  };

  const handleSubmit = async () => {
    if (interesesSeleccionados.length === 0) {
      setErrorMsg('Por favor selecciona al menos un interés.');
      return;
    }
    if (!confianzaMath) {
      setErrorMsg('Por favor selecciona tu nivel de confianza con las matemáticas.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        confianzaMath: Number(confianzaMath),
        intereses: interesesSeleccionados,
        edad: edad ? Number(edad) : null,
        nivelEducativo: nivelEducativo || null,
        objetivo: objetivo || null,
      };

      const res = await apiCall('/onboarding', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.usuario) {
        setSavedUsuario(res.usuario);
        const rec = res.usuario.onboarding?.moduloRecomendado || 'porcentajes';
        setModuloRecomendado(rec);
        setStep(6); // Ir al paso de recomendación estilizada
      } else {
        setErrorMsg('Error al guardar el onboarding. Intente de nuevo.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al comunicarse con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-wizard-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {errorMsg && (
        <div style={{
          color: '#721c24',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* PASO 1: EDAD */}
      {step === 1 && (
        <EdadSelector
          selectedRango={edadRango}
          onSelectRango={handleSelectEdadRango}
          onNext={() => setStep(2)}
        />
      )}

      {/* PASO 2: CONFIANZA MATEMÁTICA */}
      {step === 2 && (
        <NivelSelector
          selectedNivel={confianzaMath}
          onSelectNivel={(val) => setConfianzaMath(val)}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {/* PASO 3: NIVEL EDUCATIVO */}
      {step === 3 && (
        <div className="edad-container">
          <h2>Nivel educativo</h2>
          <p>Seleccioná tu máximo nivel educativo alcanzado o en curso.</p>
          <div className="edad-opciones">
            {[
              { id: 'primaria', label: 'Primaria' },
              { id: 'secundaria', label: 'Secundaria' },
              { id: 'terciaria', label: 'Terciaria' },
              { id: 'universitaria', label: 'Universitaria' }
            ].map((opt) => {
              const isSelected = nivelEducativo === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNivelEducativo(opt.id)}
                  style={{
                    backgroundColor: isSelected ? '#1E3A5F' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#333333',
                    borderColor: isSelected ? '#1E3A5F' : '#D1D5DB',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button
              type="button"
              className="onboarding-back-btn"
              onClick={() => setStep(2)}
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
              onClick={() => setStep(4)}
              style={{ flex: 1, maxWidth: '240px' }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: INTERESES */}
      {step === 4 && (
        <InteresesSeleccion
          selectedIntereses={interesesSeleccionados}
          onToggleInteres={toggleInteres}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}

      {/* PASO 5: OBJETIVO */}
      {step === 5 && (
        <div className="edad-container" style={{ textAlign: 'left' }}>
          <h2 style={{ textAlign: 'center' }}>¿Cuál es tu objetivo?</h2>
          <p style={{ textAlign: 'center', color: '#666' }}>Contanos brevemente qué te gustaría lograr en Mate-Mático.</p>
          
          <div style={{ marginTop: '20px' }}>
            <textarea
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ej: Quiero aprender a calcular presupuestos y administrar mejor mis finanzas diarias..."
              rows="5"
              maxLength="500"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '1px solid #D1D5DB',
                fontFamily: "'Poppins', sans-serif",
                boxSizing: 'border-box',
                resize: 'none',
                outline: 'none',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.8em', color: '#888', marginTop: '6px' }}>
              {objetivo.length} / 500 caracteres
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px' }}>
            <button
              type="button"
              className="onboarding-back-btn"
              onClick={() => setStep(4)}
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Atrás
            </button>
            <button
              className="continuar"
              onClick={handleSubmit}
              disabled={loading || !objetivo.trim()}
              style={{
                flex: 1,
                maxWidth: '240px',
                opacity: (loading || !objetivo.trim()) ? 0.5 : 1,
                cursor: (loading || !objetivo.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Guardando...' : 'Finalizar'}
            </button>
          </div>
        </div>
      )}

      {/* PASO 6: RECOMENDACIÓN FINAL */}
      {step === 6 && (
        <RecomendacionModulo
          moduloRecomendado={moduloRecomendado}
          onStart={() => onComplete(savedUsuario)}
        />
      )}
    </div>
  );
}

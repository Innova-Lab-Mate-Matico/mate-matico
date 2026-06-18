import React, { useState } from 'react';

export default function OnboardingWizard({ apiCall, onComplete }) {
  const [step, setStep] = useState(1);
  const [edad, setEdad] = useState('');
  const [nivelEducativo, setNivelEducativo] = useState('secundaria');
  const [confianzaMath, setConfianzaMath] = useState(3);
  const [interesesSeleccionados, setInteresesSeleccionados] = useState([]);
  const [nuevoInteres, setNuevoInteres] = useState('');
  const [objetivo, setObjetivo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const predefIntereses = ['ahorro', 'finanzas', 'compras', 'negocios', 'videojuegos', 'descuentos', 'porcentajes'];

  const toggleInteres = (interes) => {
    const cleanInteres = interes.toLowerCase().trim();
    if (interesesSeleccionados.includes(cleanInteres)) {
      setInteresesSeleccionados(interesesSeleccionados.filter(i => i !== cleanInteres));
    } else {
      setInteresesSeleccionados([...interesesSeleccionados, cleanInteres]);
    }
  };

  const agregarInteresManual = (e) => {
    e.preventDefault();
    const cleanVal = nuevoInteres.trim().toLowerCase();
    if (cleanVal && !interesesSeleccionados.includes(cleanVal)) {
      setInteresesSeleccionados([...interesesSeleccionados, cleanVal]);
      setNuevoInteres('');
    }
  };

  const handleSubmit = async () => {
    if (interesesSeleccionados.length === 0) {
      setErrorMsg('Por favor selecciona al menos un interés (ej: ahorro, finanzas).');
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
        onComplete(res.usuario);
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
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '24px',
      margin: '20px auto',
      maxWidth: '550px',
      backgroundColor: '#f9f9f9',
      color: '#333',
      textAlign: 'left'
    }}>
      <h2 style={{ marginTop: 0 }}>Encuesta de Inicio (Onboarding)</h2>
      <p style={{ color: '#666', fontSize: '0.9em' }}>Paso {step} de 5</p>

      {errorMsg && (
        <div style={{ color: 'red', marginBottom: '16px', fontWeight: 'bold' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* PASO 1: EDAD */}
      {step === 1 && (
        <div>
          <h3>¿Cuál es tu edad?</h3>
          <input
            type="number"
            min="5"
            max="120"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            placeholder="Ej: 20"
            style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box' }}
          />
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setStep(2)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: NIVEL EDUCATIVO */}
      {step === 2 && (
        <div>
          <h3>¿Cuál es tu nivel educativo actual o máximo alcanzado?</h3>
          <select
            value={nivelEducativo}
            onChange={(e) => setNivelEducativo(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '16px' }}
          >
            <option value="ninguno">Ninguno / Otro</option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
            <option value="terciaria">Terciaria</option>
            <option value="universitaria">Universitaria</option>
          </select>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(1)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: CONFIANZA MATEMÁTICA */}
      {step === 3 && (
        <div>
          <h3>¿Qué tanta confianza tienes en tus habilidades matemáticas?</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0' }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setConfianzaMath(num)}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: confianzaMath === num ? '3px solid #0056b3' : '1px solid #ccc',
                  backgroundColor: confianzaMath === num ? '#cce5ff' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {num}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.85em' }}>
            <span>1 = Muy Baja</span>
            <span>5 = Muy Alta</span>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(2)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(4)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: INTERESES */}
      {step === 4 && (
        <div>
          <h3>¿Qué temas te interesan más? (Selecciona al menos uno)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {predefIntereses.map((interes) => {
              const selected = interesesSeleccionados.includes(interes);
              return (
                <button
                  key={interes}
                  onClick={() => toggleInteres(interes)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #ccc',
                    backgroundColor: selected ? '#28a745' : '#fff',
                    color: selected ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {interes} {selected ? '✓' : '+'}
                </button>
              );
            })}
          </div>

          <form onSubmit={agregarInteresManual} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Otro interés..."
              value={nuevoInteres}
              onChange={(e) => setNuevoInteres(e.target.value)}
              style={{ flex: 1, padding: '8px', fontSize: '14px' }}
            />
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Agregar</button>
          </form>

          {interesesSeleccionados.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <strong>Seleccionados: </strong>
              {interesesSeleccionados.join(', ')}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(3)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
            >
              Atrás
            </button>
            <button
              onClick={() => setStep(5)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* PASO 5: OBJETIVO */}
      {step === 5 && (
        <div>
          <h3>¿Cuál es tu principal objetivo en Mate-Mático?</h3>
          <textarea
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Ej: Quiero aprender a administrar mejor mi dinero y hacer cálculos matemáticos rápidos."
            rows="4"
            maxLength="500"
            style={{ width: '100%', padding: '10px', fontSize: '15px', boxSizing: 'border-box' }}
          />
          <div style={{ textAlign: 'right', fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
            {objetivo.length} / 500 caracteres
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setStep(4)}
              style={{ padding: '10px 20px', cursor: 'pointer', fontSize: '15px' }}
              disabled={loading}
            >
              Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '15px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Procesando...' : 'Finalizar y Ver Módulo Recomendado'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

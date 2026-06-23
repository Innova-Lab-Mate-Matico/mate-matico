import React, { useState } from 'react';
import BotonAncla from './BotonAncla'; 

const INTERESES_MOCK = [
    { id: 'cuotas', label: 'Cuotas y préstamos' },
    { id: 'promos', label: 'Promociones y descuentos' },
    { id: 'sueldos', label: 'Sueldos e ingresos' },
    { id: 'economia', label: 'Economía de hogar' },
    { id: 'finanzas', label: 'Finanzas personales' }
];

function InteresesSeleccion() {
    const [interesesSeleccionados, setInteresesSeleccionados] = useState([]);

    const toggleInteres = (id) => {
        if (interesesSeleccionados.includes(id)) {
            setInteresesSeleccionados(interesesSeleccionados.filter(item => item !== id));
        } else {
            setInteresesSeleccionados([...interesesSeleccionados, id]);
        }
    };

    return (
        <div className="auth-container intereses-page">
            <div className="intereses-card">
                {/* Encabezado */}
                <h1 className="auth-title">Qué te gustaría aprender</h1>
                <p className="auth-subtitle">
                    Vamos a mostrarte situaciones que realmente podés encontrarte en tu día a día.
                </p>

                {/* Listado de Intereses */}
                <div className="intereses-section">
                    <h2 className="intereses-heading">Intereses</h2>
                    <div className="tags-container">
                        {INTERESES_MOCK.map((interes) => {
                            const isSelected = interesesSeleccionados.includes(interes.id);
                            return (
                                <button
                                    key={interes.id}
                                    type="button"
                                    className={`tag-button ${isSelected ? 'selected' : ''}`}
                                    onClick={() => toggleInteres(interes.id)}
                                >
                                    {interes.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Botón de acción apuntando al id de la Recomendación */}
            <div className="action-container">
                <BotonAncla destino="recomendacion">
                    <span className="btn-primary-text">Continuar</span>
                </BotonAncla>
            </div>
        </div>
    );
}

export default InteresesSeleccion;
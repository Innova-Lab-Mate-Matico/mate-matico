import React from 'react';

// Importación de assets corregida a .png
import olaSuperior from '../assets/ola1.png';
import olaInferior from '../assets/ola2.png';
import mateIcon from '../assets/mate.png';

function RecomendacionModulo({ moduloRecomendado = 'porcentajes', onStart }) {
  const esPorcentajes = moduloRecomendado === 'porcentajes';

  return (
    <div className="auth-container recomendacion-page" style={{ minHeight: 'auto', padding: '20px 0' }}>
      {/* Olas decorativas de fondo */}
      <img src={olaSuperior} alt="" className="ola-superior" />
      <img src={olaInferior} alt="" className="ola-inferior" />

      <div className="recomendacion-card">
        {/* Encabezado */}
        <h1 className="auth-title">Nuestra recomendación para vos...</h1>
        <p className="auth-subtitle">
          Según tus respuestas, te recomendamos comenzar por este módulo.
        </p>

        {/* Sección de la Mascota */}
        <div className="mate-mascot-container">
          <img src={mateIcon} alt="Matecito" className="mate-avatar" />
          <div className="speech-bubble">
            <p>
              {esPorcentajes
                ? 'Empecemos por algo que seguramente ves todos los días cuando hacés compras.'
                : 'Consolidemos las bases del cálculo para resolver cualquier situación con seguridad.'}
            </p>
          </div>
        </div>

        {/* Detalles del módulo */}
        <div className="modulo-detalle-box">
          <div className="modulo-header-destacado">
            <h3>{esPorcentajes ? 'Promociones y descuentos' : 'Aritmética Básica'}</h3>
            <p>
              {esPorcentajes
                ? 'Aprendé a calcular descuentos en supermercados, tiendas y cuotas.'
                : 'Reforzá sumas, restas y multiplicaciones aplicadas a cuentas cotidianas.'}
            </p>
          </div>

          <div className="modulo-cuerpo-aprendizajes">
            <h4>¿Qué vas a aprender?</h4>
            {esPorcentajes ? (
              <ul>
                <li><span className="check-icon">✓</span> Calcular porcentajes simples</li>
                <li><span className="check-icon">✓</span> Comparar promociones</li>
                <li><span className="check-icon">✓</span> Identificar ofertas convenientes</li>
                <li><span className="check-icon">✓</span> Ahorrar en compras cotidianas</li>
              </ul>
            ) : (
              <ul>
                <li><span className="check-icon">✓</span> Sumar y restar rápidamente</li>
                <li><span className="check-icon">✓</span> Operar con decimales y vueltos</li>
                <li><span className="check-icon">✓</span> Resolver problemas del día a día</li>
                <li><span className="check-icon">✓</span> Desarrollar agilidad de cálculo</li>
              </ul>
            )}
          </div>

          {/* Bloque de tiempo */}
          <div className="tiempo-estimado-box">
            <div className="clock-icon-placeholder">⏰</div>
            <div className="tiempo-texto">
              <span className="tiempo-titulo">Tiempo estimado</span>
              <span className="tiempo-duracion">10 minutos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acción */}
      <div className="action-container" style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          className="continuar"
          onClick={onStart}
          style={{ width: '100%' }}
        >
          Comenzar Módulo
        </button>
      </div>
    </div>
  );
}

export default RecomendacionModulo;
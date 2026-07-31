import React from 'react';

// Importación de assets decorativos
import olaSuperior from '../assets/ola1.png';
import olaInferior from '../assets/ola2.png';
import mateIcon from '../assets/mate.png';

const MODULOS_INFO = {
  porcentajes: {
    titulo: 'Promociones y Descuentos',
    subtitulo: 'Aprendé a calcular descuentos en supermercados, tiendas y cuotas.',
    speech: 'Empecemos por algo que seguramente ves todos los días cuando hacés compras.',
    aprendizajes: [
      'Calcular porcentajes simples',
      'Comparar promociones',
      'Identificar ofertas convenientes',
      'Ahorrar en compras cotidianas',
    ],
    tiempo: '10 minutos',
  },
  aritmetica: {
    titulo: 'Aritmética Básica',
    subtitulo: 'Reforzá sumas, restas y multiplicaciones aplicadas a cuentas cotidianas.',
    speech: 'Consolidemos las bases del cálculo para resolver cualquier situación con seguridad.',
    aprendizajes: [
      'Sumar y restar rápidamente',
      'Operar con decimales y vueltos',
      'Resolver problemas del día a día',
      'Desarrollar agilidad de cálculo',
    ],
    tiempo: '10 minutos',
  },
  fracciones: {
    titulo: 'Fracciones y Decimales',
    subtitulo: 'Dominá la división de cantidades, recetas, partes y proporciones.',
    speech: 'Las fracciones nos ayudan a dividir y repartir todo de forma exacta en la vida diaria.',
    aprendizajes: [
      'Entender partes de un todo',
      'Calcular proporciones en recetas',
      'Repartir de forma justa',
      'Convertir fracciones a decimales',
    ],
    tiempo: '12 minutos',
  },
  economia: {
    titulo: 'Economía Doméstica',
    subtitulo: 'Gestioná tu presupuesto personal, cuotas, ahorros y gastos del hogar.',
    speech: 'Tomá el control de tus finanzas y organizá los gastos de tu casa con tranquilidad.',
    aprendizajes: [
      'Administrar presupuestos del hogar',
      'Calcular cuotas e intereses',
      'Planificar ahorros mensuales',
      'Evitar deudas innecesarias',
    ],
    tiempo: '15 minutos',
  },
};

function RecomendacionModulo({ moduloRecomendado = 'porcentajes', onStart }) {
  // Normalizar la clave del módulo recomendado
  const key = (moduloRecomendado || 'porcentajes').toLowerCase();
  const info = MODULOS_INFO[key] || MODULOS_INFO.aritmetica;

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
            <p>{info.speech}</p>
          </div>
        </div>

        {/* Detalles del módulo */}
        <div className="modulo-detalle-box">
          <div className="modulo-header-destacado">
            <h3>{info.titulo}</h3>
            <p>{info.subtitulo}</p>
          </div>

          <div className="modulo-cuerpo-aprendizajes">
            <h4>¿Qué vas a aprender?</h4>
            <ul>
              {info.aprendizajes.map((item, index) => (
                <li key={index}>
                  <span className="check-icon">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Bloque de tiempo */}
          <div className="tiempo-estimado-box">
            <div className="clock-icon-placeholder">⏰</div>
            <div className="tiempo-texto">
              <span className="tiempo-titulo">Tiempo estimado: </span>
              <span className="tiempo-duracion">{info.tiempo}</span>
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
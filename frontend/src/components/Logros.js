import React, { useState, useEffect } from 'react';
import './Logros.css';
import { EfectosService } from '../services/EfectosService';

/*
  MATE-MÁTICO — COMPONENTE LOGROS
  Muestra la pantalla de medallas/badges del usuario.
  Agrupa logros por categoría:
    - inicio, racha, leccion, modulo, puntaje
*/

const NOMBRE_CATEGORIA = {
  inicio:  '🌟 Cómo empezaste',
  racha:   '🔥 Hábito diario',
  leccion: '📚 Lecciones superadas',
  modulo:  '🏆 Módulos completos',
  puntaje: '⭐ Puntaje alcanzado',
};

const ORDEN_CATEGORIA = ['inicio', 'racha', 'leccion', 'modulo', 'puntaje'];

export default function Logros({ apiCall }) {
  const [logros, setLogros]     = useState([]);
  const [resumen, setResumen]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const cargarLogros = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/logros');
      
      // Celebrar si se desbloqueó algún logro nuevo
      if (resumen && data.resumen && data.resumen.desbloqueados > resumen.desbloqueados) {
        EfectosService.celebrarLogro();
      }

      setLogros(data.logros || []);
      setResumen(data.resumen || null);
    } catch (err) {
      console.error('Error al cargar logros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLogros();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Agrupar por categoría
  const grouped = ORDEN_CATEGORIA.reduce((acc, cat) => {
    acc[cat] = logros.filter(l => l.categoria === cat);
    return acc;
  }, {});

  const porcentaje = resumen
    ? Math.round((resumen.desbloqueados / resumen.total) * 100)
    : 0;

  return (
    <div className="card logros-card">
      {/* Cabecera */}
      <div className="logros-header">
        <h2>🏆 Mis Logros</h2>
        <button
          type="button"
          className="btn-primary"
          onClick={cargarLogros}
          disabled={loading}
          style={{ height: '38px', padding: '0 16px', border: 'none' }}
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Barra de progreso global */}
      {resumen && (
        <div className="logros-progress-bar-wrapper">
          <div className="logros-progress-bar-label">
            <span>Colección de medallas</span>
            <strong>{resumen.desbloqueados} / {resumen.total}</strong>
          </div>
          <div className="logros-progress-track">
            <div
              className="logros-progress-fill"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading inicial */}
      {loading && logros.length === 0 && (
        <div className="logros-loading">Cargando tus logros...</div>
      )}

      {/* Grupos de categorías */}
      {!loading && logros.length === 0 && (
        <div className="logros-empty">
          Completá tu primera lección para empezar a coleccionar logros 🌱
        </div>
      )}

      {logros.length > 0 && ORDEN_CATEGORIA.map(cat => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;

        return (
          <div key={cat} className="logros-section">
            <p className="logros-section-title">{NOMBRE_CATEGORIA[cat]}</p>
            <div className="logros-grid">
              {items.map(logro => (
                <div
                  key={logro.id}
                  className={`logro-card ${logro.desbloqueado ? 'desbloqueado' : 'bloqueado'}`}
                  title={logro.descripcion}
                >
                  {/* Check en corner si está desbloqueado */}
                  {logro.desbloqueado && (
                    <span className="logro-check-icon" aria-label="Logro obtenido">✓</span>
                  )}

                  <span className="logro-emoji" role="img" aria-label={logro.nombre}>
                    {logro.emoji}
                  </span>

                  <span className="logro-nombre">{logro.nombre}</span>

                  <span className="logro-descripcion">{logro.descripcion}</span>

                  {!logro.desbloqueado && (
                    <span className="logro-lock-icon" aria-label="Bloqueado">🔒</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

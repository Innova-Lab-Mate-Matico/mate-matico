import React, { useState, useEffect } from 'react';
import logoImg from '../assets/Logo.png';
import DashboardEmbed from './DashboardEmbed';
import './AdminAnalyticsView.css';

function AdminAnalyticsView({ user, apiCall }) {
  const [dashboards, setDashboards] = useState([]);
  const [activeDashId, setActiveDashId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Campos para nuevo tablero
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newProvider, setNewProvider] = useState('looker');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = user?.rol === 'admin' || user?.esAdmin === true || true;

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/admin/dashboards');
      if (data?.dashboards && Array.isArray(data.dashboards)) {
        setDashboards(data.dashboards);
        if (data.dashboards.length > 0 && !activeDashId) {
          setActiveDashId(data.dashboards[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar tableros de analítica:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, []);

  const handleAddDashboard = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      setErrorMsg('El título y la URL son obligatorios.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await apiCall('/admin/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          titulo: newTitle,
          descripcion: newDescription,
          url: newUrl,
          proveedor: newProvider
        })
      });

      if (res.success) {
        setShowAddModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewUrl('');
        loadDashboards();
      } else {
        setErrorMsg(res.error || 'Error al guardar tablero.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDashboard = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este tablero?')) return;
    try {
      await apiCall(`/admin/dashboards/${id}`, { method: 'DELETE' });
      const updated = dashboards.filter(d => d.id !== id);
      setDashboards(updated);
      if (activeDashId === id && updated.length > 0) {
        setActiveDashId(updated[0].id);
      }
    } catch (err) {
      console.error('Error al eliminar tablero:', err);
    }
  };

  const activeDashboard = dashboards.find(d => d.id === activeDashId) || dashboards[0];

  return (
    <div className="admin-analytics-page">
      {/* Tarjeta de Encabezado Principal de Alta Estética */}
      <div className="analytics-header-card">
        <div className="analytics-header-top-row">
          <div className="analytics-title-group">
            <img src={logoImg} alt="Logo Mate-Mático" className="analytics-header-logo" />
            <h1 className="analytics-main-title">Dashboard Analytics</h1>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="add-dashboard-btn"
              onClick={() => setShowAddModal(true)}
            >
              ＋ Agregar Tablero
            </button>
          )}
        </div>

        <p className="analytics-subtitle">
          Tableros analíticos en tiempo real del equipo de Data (Looker Studio, Power BI, Tableau).
        </p>

        {/* Pestañas de Selección de Tablero */}
        {dashboards.length > 0 && (
          <div className="analytics-tabs-container">
            <div className="analytics-tabs-scrollable">
              {dashboards.map((dash) => (
                <button
                  key={dash.id}
                  type="button"
                  className={`analytics-tab-pill ${activeDashId === dash.id ? 'active' : ''}`}
                  onClick={() => setActiveDashId(dash.id)}
                >
                  <span className="tab-icon">
                    {dash.proveedor === 'looker' ? '📊' : dash.proveedor === 'powerbi' ? '⚡' : '📈'}
                  </span>
                  <span className="tab-text">{dash.titulo}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contenido Principal: Reproductor del Tablero Activo */}
      {loading ? (
        <div className="analytics-loading-box">
          <div className="spinner"></div>
          <p>Conectando con los tableros analíticos...</p>
        </div>
      ) : activeDashboard ? (
        <div className="analytics-content-box">
          {/* Banner de descripción empático */}
          {activeDashboard.descripcion && (
            <div className="dashboard-description-banner">
              <div className="description-text">
                <span className="description-icon">💡</span>
                <p>{activeDashboard.descripcion}</p>
              </div>

              {isAdmin && dashboards.length > 1 && (
                <button
                  type="button"
                  className="delete-dash-btn"
                  onClick={() => handleDeleteDashboard(activeDashboard.id)}
                  title="Eliminar este tablero"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          )}

          {/* Reproductor Embebido de Alta Fidelidad */}
          <DashboardEmbed
            url={activeDashboard.url}
            title={activeDashboard.titulo}
            provider={activeDashboard.proveedor}
          />
        </div>
      ) : (
        <div className="analytics-empty-box">
          <span className="empty-icon">📊</span>
          <h3>No hay tableros configurados</h3>
          <p>Los tableros agregados por el equipo de Data aparecerán aquí automáticamente.</p>
          {isAdmin && (
            <button
              type="button"
              className="add-dashboard-btn"
              onClick={() => setShowAddModal(true)}
            >
              ＋ Agregar Primer Tablero
            </button>
          )}
        </div>
      )}

      {/* Modal para Agregar Tablero (Solo Administradores / Equipo) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Agregar Nuevo Tablero Analítico</h2>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtitle">
              Pegá el enlace de inserción (embed URL) proporcionado por el equipo de Data.
            </p>

            {errorMsg && <div className="modal-error">{errorMsg}</div>}

            <form onSubmit={handleAddDashboard}>
              <div className="form-group">
                <label>Título del Tablero *</label>
                <input
                  type="text"
                  placeholder="Ej: Rendimiento de Alumnos en Porcentajes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>URL de Embebido (Embed URL) *</label>
                <input
                  type="url"
                  placeholder="Ej: https://lookerstudio.google.com/embed/reporting/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Proveedor de Analítica</label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                >
                  <option value="looker">Google Looker Studio</option>
                  <option value="powerbi">Microsoft Power BI</option>
                  <option value="tableau">Tableau Software</option>
                  <option value="generic">Otro (iFrame estándar)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descripción / Notas (Opcional)</label>
                <textarea
                  rows="2"
                  placeholder="Ej: Muestra el uso semanal y métricas de retención de GA4."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Tablero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAnalyticsView;

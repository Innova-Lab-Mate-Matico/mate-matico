import React, { useState } from 'react';
import './DashboardEmbed.css';

function DashboardEmbed({ url, title, provider = 'looker' }) {
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const reloadIframe = () => {
    setLoading(true);
    const iframe = document.getElementById('analytics-iframe-element');
    if (iframe) {
      iframe.src = url;
    }
  };

  const getProviderName = (p) => {
    switch (p) {
      case 'looker': return '📊 Looker Studio';
      case 'powerbi': return '⚡ Power BI';
      case 'tableau': return '📈 Tableau';
      default: return '📌 Dashboard';
    }
  };

  return (
    <div className={`dashboard-embed-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Barra de herramientas del Embed */}
      <div className="dashboard-embed-toolbar">
        <div className="toolbar-header-left">
          <span className={`provider-badge ${provider}`}>
            {getProviderName(provider)}
          </span>
          <h2 className="toolbar-title">{title}</h2>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-btn secondary"
            onClick={reloadIframe}
            title="Recargar datos del tablero"
          >
            <span className="btn-icon">🔄</span> Actualizar
          </button>
          <button
            type="button"
            className="toolbar-btn primary"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            <span className="btn-icon">{isFullscreen ? '↙' : '⤢'}</span> {isFullscreen ? 'Salir' : 'Pantalla Completa'}
          </button>
        </div>
      </div>

      {/* Contenedor del Iframe con Loader */}
      <div className="iframe-wrapper">
        {loading && (
          <div className="iframe-loader">
            <div className="spinner"></div>
            <p>Conectando con {title}...</p>
          </div>
        )}
        <iframe
          id="analytics-iframe-element"
          src={url}
          title={title || "Analytics Dashboard"}
          onLoad={handleIframeLoad}
          className={`analytics-iframe ${loading ? 'hidden' : ''}`}
          frameBorder="0"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-forms"
        ></iframe>
      </div>
    </div>
  );
}

export default DashboardEmbed;

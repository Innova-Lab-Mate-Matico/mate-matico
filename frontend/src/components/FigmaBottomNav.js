import React from 'react';

export default function FigmaBottomNav({
  activeTab,
  setActiveTab,
  user,
  icons: {
    lecciones,
    practicar,
    inicio,
    progreso,
    analitica,
    perfil
  }
}) {
  const isUserAdmin = user?.rol === 'admin' || user?.rol === 'viewer' || user?.esAdmin === true;

  return (
    <nav className="figma-bottom-nav">
      <button
        type="button"
        className={`figma-nav-item ${activeTab === 'lecciones' ? 'active' : ''}`}
        onClick={() => setActiveTab('lecciones')}
      >
        <img src={lecciones} alt="Lecciones" />
        <span>Lecciones</span>
      </button>

      <button
        type="button"
        className={`figma-nav-item ${activeTab === 'practicar' ? 'active' : ''}`}
        onClick={() => setActiveTab('practicar')}
      >
        <img src={practicar} alt="Practicar" />
        <span>Practicar</span>
      </button>

      <button
        type="button"
        className={`figma-nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
        onClick={() => setActiveTab('inicio')}
      >
        <img src={inicio} alt="Inicio" />
        <span>Inicio</span>
      </button>

      <button
        type="button"
        className={`figma-nav-item ${activeTab === 'progreso' ? 'active' : ''}`}
        onClick={() => setActiveTab('progreso')}
      >
        <img src={progreso} alt="Progreso" />
        <span>Progreso</span>
      </button>

      {isUserAdmin && (
        <button
          type="button"
          className={`figma-nav-item ${activeTab === 'analitica' ? 'active' : ''}`}
          onClick={() => setActiveTab('analitica')}
        >
          <img src={analitica} alt="Analítica" />
          <span>Analítica</span>
        </button>
      )}

      <button
        type="button"
        className={`figma-nav-item ${activeTab === 'perfil' ? 'active' : ''}`}
        onClick={() => setActiveTab('perfil')}
      >
        <img src={perfil} alt="Perfil" />
        <span>Perfil</span>
      </button>
    </nav>
  );
}

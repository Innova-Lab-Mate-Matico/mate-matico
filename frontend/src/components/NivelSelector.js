const NivelSelector = () => {
  return (
    <div className="nivel-container">
      <h2>Nivel de conocimientos en matemática</h2>

      <p>
        No hace falta ser experto. Elegí el nivel que mejor represente cómo te
        sentís hoy con las matemáticas.
      </p>

      <div className="barra">
        <div className="progreso"></div>
      </div>

      <div className="niveles">
        <span>Necesito ayuda</span>
        <span>Me defiendo</span>
        <span>Me siento seguro</span>
      </div>

      <button className="continuar">
        Continuar
      </button>
    </div>
  );
};

export default NivelSelector;
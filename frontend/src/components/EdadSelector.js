const EdadSelector = ({ onNext }) => {
  return (
    <div className="edad-container">
      <h2>Seleccioná tu edad</h2>

      <p>
        Cada persona aprende a su ritmo. Contanos tu rango de edad para
        personalizar tu experiencia.
      </p>

      <div className="edad-opciones">
        <button>18 - 24</button>
        <button>25 - 34</button>
        <button>35 - 44</button>
        <button>Más de 45</button>
      </div>

      <button className="continuar" onClick={onNext}>
        Continuar
      </button>
    </div>
  );
};

export default EdadSelector;
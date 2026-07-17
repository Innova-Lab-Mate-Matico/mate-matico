import React from 'react';

function BotonAncla({ destino, children, onContinuar }) {

  const handleClick = (e) => {
    if (onContinuar) {
      e.preventDefault();
      onContinuar();
    }
  };

  return (
    <a 
      href={`#${destino}`}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

export default BotonAncla;
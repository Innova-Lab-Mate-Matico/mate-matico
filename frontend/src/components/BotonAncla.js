import React from 'react';

function BotonAncla({ destino, children }) {
    return (
    <a href={`#${destino}`}>
        {children}
    </a>
    );
}

export default BotonAncla;
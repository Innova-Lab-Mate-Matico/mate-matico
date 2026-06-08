import React from 'react';
import BotonAncla from './BotonAncla';

export default function Navbar() {
    return (
        <nav>
        <ul>
            <li><BotonAncla destino="faqs">FAQ´s</BotonAncla></li>
            <li><BotonAncla destino="opiniones">Opiniones</BotonAncla></li>
            
        </ul>
        </nav>
    );
}
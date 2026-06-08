import React from 'react';
import BotonAncla from './BotonAncla';

export default function Faqs() {
    return (
    <section id="faqs">
        <h2>Preguntas Frecuentes</h2>
        
        <p><strong>1. ¿Necesito tener una base previa o acordarme de lo que vi en la escuela?</strong></p>
        <p>No, no es necesario. El curso está diseñado para que puedas aprender desde cero, sin importar tu nivel de conocimientos previos.</p>
        <br />
        
        <p><strong>2. ¿Cuánto tiempo necesito dedicarle al curso?</strong></p>
        <p>El curso está estructurado en módulos que puedes completar a tu propio ritmo. Recomendamos dedicar al menos 3-4 horas por semana para obtener los mejores resultados.</p>
        <br />
        
        <p><strong>3. ¿Qué tipo de contenido incluye el curso?</strong></p>
        <p>El curso incluye videos explicativos, ejercicios prácticos, y evaluaciones para ayudarte a consolidar tus conocimientos.</p>

        <div className="contenedor-volver">
            <BotonAncla destino="arriba">▲ Arriba</BotonAncla>
        </div>
    </section>
    );
}
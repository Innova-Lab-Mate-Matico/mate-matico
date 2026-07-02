import React from 'react';

export default function Opiniones({ onBack }) {
    return (
        <section id="opiniones">
        <h2>Opiniones de Nuestros Estudiantes</h2>
        <p>"El curso de El Matemático me ha ayudado a entender conceptos que antes me parecían imposibles. ¡Recomiendo este curso a todos!" - Ana G.</p>
        <p>"Gracias a este curso, he mejorado mis habilidades matemáticas y ahora me siento más seguro en mis estudios." - Carlos M.</p>
        <p>"El contenido es claro y fácil de seguir. Me encanta la forma en que se explican los temas." - Laura S.</p>

        {onBack && (
            <div className="contenedor-volver">
                <button type="button" className="btn-secondary" onClick={onBack}>
                    Volver al inicio
                </button>
            </div>
        )}
        </section>
    );
}
import React, { useEffect } from 'react';// Tu componente compartido sin cambios
import '../styles/completo.css'; // Tu hoja de estilos independiente
import { EfectosService } from '../services/EfectosService';

// Importaciones de los elementos gráficos que corresponden a este diseño
import iconoCheck from '../assets/check_circle.png';
import iconoStar from '../assets/image16.png';
import avatarAprendamos from '../assets/aprendamosJuntos.png'; // El mate feliz/animado

  function ExitosCard({ onComplete }) {
  useEffect(() => {
    // Al completar la lección / tarea, celebrar con confeti y sonido triunfal
    EfectosService.celebrarLogro();
  }, []);

  const continuar = () => {
  if (onComplete) {
    onComplete();
  }
 }; 
  return (
    <div className="exitos-card-wrapper">
      <div className="exitos-card">
       
        {/* Cuerpo interno estructurado */}
        <div className="exitos-card__body">
         
          {/* Bloque Superior: Check Grande, Título y Mensaje */}
          <div className="exitos-card__top-hero">
            <div className="exitos-card__large-check-container">
              <img src={iconoCheck} alt="Éxito" className="exitos-card__large-check-img" />
            </div>
            <h1 className="exitos-card__main-title">¡Excelente!</h1>
            <p className="exitos-card__main-description">
              Resolviste correctamente este desafío.
            </p>
          </div>

          {/* Bloque Central: Recuadro Blanco con Estrella única y Textos apilados */}
          <div className="exitos-card__features-box">
            <div className="exitos-card__metric-row-combined">
             
              {/* Estrella única a la izquierda */}
              <div className="exitos-card__star-container-large">
                <img src={iconoStar} alt="Estrella de Logro" className="exitos-card__large-star-img" />
              </div>
             
              {/* Bloque de texto de métricas */}
              <div className="exitos-card__text-stack">
                <span className="exitos-card__metric-points-large">+25 puntos</span>
                <span className="exitos-card__metric-exercises-sub">2 ejercicios completados</span>
              </div>

            </div>
          </div>

          {/* Bloque Inferior: Mensaje con Avatar a Gran Escala y Texto Centrado al Borde Derecho */}
          <div className="exitos-card__motivation-box">
           
            {/* Ícono masivo ampliado que ocupa el espacio izquierdo libre */}
            <div className="exitos-card__motivation-avatar-container">
              <img
                src={avatarAprendamos}
                alt="Aprendamos juntos"
                className="exitos-card__motivation-avatar-massive"
              />
            </div>
           
            {/* Frase apilada en dos líneas, centradas entre sí y alineadas a la derecha */}
            <div className="exitos-card__motivation-text-stack">
              <span className="exitos-card__motivation-line-top">Mate a Mate</span>
              <span className="exitos-card__motivation-line-bottom">Vas ganando confianza</span>
            </div>

          </div>

        </div>

        {/* Sección de Cierre: Botón Continuar Grupal */}
       <div className="exitos-card__actions">
  <div className="exitos-card__btn-wrapper">
    <button 
      className="primary-button"
      onClick={continuar}
    >
      Continuar
    </button>
    </div>
     </div>

      </div>

    </div>
  );
}

export default ExitosCard;

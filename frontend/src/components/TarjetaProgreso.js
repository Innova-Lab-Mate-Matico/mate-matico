import React from 'react';
import BotonAncla from './BotonAncla';
import imgLeccion from '../assets/lección ok.png';
import imgMedalla from '../assets/image 19.png';
import imgContento from '../assets/contento.png';

function TarjetaProgreso({ destinoAncla = "continuar" }) {
  return (
    <div className="progreso-card-wrapper">
      <div className="progreso-card">
       
        <div className="progreso-card__body">
         
          {/* --- 3. SECCIÓN SUPERIOR: HERO / ENCABEZADOS --- */}
          <header className="progreso-card__top-hero">
            <h2 className="progreso-card__main-title">¡Muy buen progreso!</h2>
            <p className="progreso-card__main-description">
              Cada lección completada te acerca un poco más a dominar las matemáticas del día a día.
            </p>
          </header>

          {/* --- 4. SECCIÓN CENTRAL: RECUADRO DE LECCIONES Y NIVEL.PNG --- */}
          <section className="progreso-card__features-box">
            <div className="progreso-card__text-stack-vertical">
             
              <div className="progreso-card__meta-header">
                <span className="progreso-card__icon-bullet-check"></span>
                <span className="progreso-card__metric-label-small">Lecciones completadas</span>
              </div>
             
              <div className="progreso-card__counter-row">
                <div className="progreso-card__number-group">
                  <p className="progreso-card__metric-points-highlight">
                    <span className="progreso-card__number-massive">2</span> de 6
                  </p>
                  <p className="progreso-card__metric-label-progress">Tu avance</p>
                  <p className="progreso-card__metric-sublabel-progress">Progreso del módulo</p>
                </div>
               
                <div className="progreso-card__asset-container">
                  <img src={imgLeccion} alt="Lección" className="progreso-card__asset-inline" />
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="progreso-card__progress-bar-track">
                <div className="progreso-card__progress-bar-fill" style={{ width: '33.33%' }}></div>
              </div>

              </div>
          </section>

          {/* --- 5. SECCIÓN CENTRAL: RECUADRO DE NIVEL ACTUAL --- */}
          <section className="progreso-card__features-box">
            <div className="progreso-card__level-row">
              <div className="progreso-card__text-stack-vertical">
                <div className="progreso-card__meta-header">
                  <span className="progreso-card__icon-bullet-signal"></span>
                  <span className="progreso-card__metric-label-small">Nivel actual</span>
                </div>
                <h3 className="progreso-card__level-title">Primeros Mates</h3>
                <p className="progreso-card__level-description">
                  Estás construyendo una base sólida para tomar decisiones con más confianza.
                </p>
              </div>
             
              <div className="progreso-card__medalla-container">
                <img src={imgMedalla} alt="Medalla Nivel" className="progreso-card__medalla-img" />
              </div>
            </div>
          </section>

          {/* --- 6. BLOQUES MOTIVACIONALES INFERIORES --- */}
          <section className="progreso-card__motivation-box">
            <div className="progreso-card__motivation-avatar-container">
              <img src={imgContento} alt="Mate Contento" className="progreso-card__motivation-avatar-massive" />
            </div>
            <div className="progreso-card__motivation-text-stack">
              <p className="progreso-card__motivation-line-bottom">Un mate más y seguimos aprendiendo</p>
             
            </div>
          </section>

        </div>

        {/* --- 7. COMPONENTE COMPARTIDO: BOTÓN ANCLA GRUPAL --- */}
        <footer className="progreso-card__actions">
          <div className="progreso-card__btn-wrapper">
            <BotonAncla destino={destinoAncla}>Continuar</BotonAncla>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default TarjetaProgreso;

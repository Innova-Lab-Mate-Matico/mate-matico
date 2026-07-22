import React from 'react';
import BotonAncla from './BotonAncla';
import imgLeccion from '../assets/lección ok.png';
import imgMedalla from '../assets/image 19.png';
import mateEscolar from '../assets/mate_escolar.png';
import mateProfesor from '../assets/mate_profesor.png';
import mateAcademico from '../assets/mate_academico.png';

function TarjetaProgreso({
  destinoAncla = "continuar",
  onContinuar,
  completedCount = 2,
  totalLessons = 6,
  userRole = "principiante"
}) {
  const getDisplayProgress = () => {
    const pct = Math.round((completedCount / totalLessons) * 100);
    return `${Math.min(100, Math.max(0, pct))}%`;
  };

  const getMascotaData = () => {
    const r = (userRole || '').toLowerCase();
    switch (r) {
      case 'avanzado':
      case 'experto':
        return {
          imgSrc: mateAcademico,
          levelTitle: 'Nivel Experto',
          levelDesc: '¡Felicitaciones! Has alcanzado el nivel máximo y dominás los desafíos.'
        };
      case 'intermedio':
      case 'secundario':
      case 'medio':
        return {
          imgSrc: mateEscolar,
          levelTitle: 'Nivel Intermedio',
          levelDesc: '¡Excelente progreso! Seguí practicando para perfeccionar tus habilidades.'
        };
      case 'principiante':
      case 'inicial':
      case 'basico':
      default:
        return {
          imgSrc: mateProfesor,
          levelTitle: 'Primeros Mates',
          levelDesc: 'Estás construyendo una base sólida para tomar decisiones con más confianza.'
        };
    }
  };

  const mascota = getMascotaData();

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
                    <span className="progreso-card__number-massive">{completedCount}</span> de {totalLessons}
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
                <div className="progreso-card__progress-bar-fill" style={{ width: getDisplayProgress() }}></div>
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
                <h3 className="progreso-card__level-title">{mascota.levelTitle}</h3>
                <p className="progreso-card__level-description">
                  {mascota.levelDesc}
                </p>
              </div>
             
              <div className="progreso-card__medalla-container">
                <img src={mascota.imgSrc} alt={mascota.levelTitle} className="progreso-card__medalla-img" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
              </div>
            </div>
          </section>

          {/* --- 6. BLOQUES MOTIVACIONALES INFERIORES --- */}
          <section className="progreso-card__motivation-box">
            <div className="progreso-card__motivation-avatar-container">
              <img src={mascota.imgSrc} alt="Mate" className="progreso-card__motivation-avatar-massive" />
            </div>
            <div className="progreso-card__motivation-text-stack">
              <p className="progreso-card__motivation-line-bottom">Un mate más y seguimos aprendiendo</p>
            </div>
          </section>

        </div>

        {/* --- 7. COMPONENTE COMPARTIDO: BOTÓN ANCLA GRUPAL --- */}
        <footer className="progreso-card__actions">
          <div className="progreso-card__btn-wrapper">
            <BotonAncla destino={destinoAncla} onContinuar={onContinuar}>Continuar</BotonAncla>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default TarjetaProgreso;

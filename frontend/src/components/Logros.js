import React, { useState, useEffect, useRef } from 'react';
import './Logros.css';
import { EfectosService } from '../services/EfectosService';

// Assets oficiales de Figma desde Img Logros
import plantIcon from '../assets/Img Logros/plant.svg';
import plant2Icon from '../assets/Img Logros/plant2.svg';
import shieldPurple from '../assets/Img Logros/Group 135.svg';
import shield137 from '../assets/Img Logros/Group 137.svg';
import shield140 from '../assets/Img Logros/Group 140.svg';
import shieldBlue from '../assets/Img Logros/Group 139.svg';
import shieldOrange from '../assets/Img Logros/Group 142.svg';
import shieldYellow from '../assets/Img Logros/Group 143.svg';
import mateCelebracion from '../assets/Img Logros/mate_racha_celebración.png';
import starShine from '../assets/Img Logros/star_shine.svg';
import starShine2Icon from '../assets/Img Logros/star_shine2.svg';
import starRateIcon from '../assets/Img Logros/star_rate.svg';
import stars2Icon from '../assets/Img Logros/stars_2.svg';
import twoPager2Icon from '../assets/Img Logros/two_pager2.svg';
import inHomeMode from '../assets/Img Logros/in_home_mode.svg';
import calculateIcon from '../assets/Img Logros/calculate.svg';
import dashboardIcon from '../assets/Img Logros/dashboard_2.svg';
import arrowForwardIcon from '../assets/Img Logros/arrow_forward_ios.svg';
import modeHeatIcon from '../assets/Img Logros/mode_heat.svg';
import celebrationIcon from '../assets/Img Logros/celebration.svg';
import boltIcon from '../assets/Img Logros/bolt.svg';
import starImg16 from '../assets/Progreso_img/Imagenes_progreso/image 16.png';
import ventaIcon from '../assets/Img Logros/venta.png';
import graficoCircularIcon from '../assets/Img Logros/grafico-circular.png';
import decimalIcon from '../assets/Img Logros/decimal.png';

// Mascotas por Nivel (Escolar, Profesor/Intermedio, Academico/Experto)
import mateEscolar from '../assets/mate_escolar.webp';
import mateProfesor from '../assets/mate_profesor.webp';
import mateAcademico from '../assets/mate_academico.webp';

const getMascotaHeaderImg = (nivel) => {
  const r = (nivel || 'experto').toLowerCase();
  switch (r) {
    case 'avanzado':
    case 'experto':
    case 'universitario':
    case 'academico':
      return mateAcademico;
    case 'intermedio':
    case 'secundario':
    case 'medio':
    case 'profesor':
      return mateProfesor;
    case 'principiante':
    case 'inicial':
    case 'basico':
    case 'escolar':
    default:
      return mateEscolar;
  }
};

const CATALOGO_DEFAULT = [
  // Inicio (Escudo verde Group 140 + Planta blanca plant2)
  { id: 'primer-paso', icon: shield140, innerIcon: plant2Icon, nombre: 'Primer paso', descripcion: 'Completaste tu primera lección', categoria: 'inicio' },
  
  // Racha
  { id: 'racha-3', icon: shield137, nombre: 'Racha de 3 días', descripcion: '3 días consecutivos de práctica', categoria: 'racha' },
  { id: 'racha-7', icon: shieldPurple, innerIcon: celebrationIcon, nombre: 'Racha de 7 días', descripcion: '7 días consecutivos de práctica', categoria: 'racha' },
  { id: 'racha-30', icon: shieldPurple, innerIcon: boltIcon, nombre: 'Racha de 30 días', descripcion: '30 días consecutivos de práctica', categoria: 'racha' },

  // Lecciones superadas (Todas las lecciones del catálogo)
  { id: 'maestro-suma', icon: shieldBlue, nombre: 'Maestro de la Suma', descripcion: 'Suma de números enteros', categoria: 'leccion', leyenda: '+' },
  { id: 'rey-resta', icon: shieldBlue, nombre: 'Rey de la resta', descripcion: 'Resta de números enteros', categoria: 'leccion', leyenda: '−' },
  { id: 'as-multiplicacion', icon: shieldBlue, nombre: 'As de Multiplicación', descripcion: 'Tablas y productos', categoria: 'leccion', leyenda: '×' },
  { id: 'divisor-elite', icon: shieldBlue, nombre: 'Divisor de élite', descripcion: 'División exacta y cocientes', categoria: 'leccion', leyenda: '÷' },
  { id: 'maestro-porcentaje', icon: shieldBlue, nombre: 'Maestro de Porcentajes', descripcion: 'Cálculo de tanto por ciento', categoria: 'leccion', leyenda: '%' },
  { id: 'cazador-descuentos', icon: shieldBlue, innerIcon: ventaIcon, nombre: 'Cazador de Descuentos', descripcion: 'Cálculo de precios y descuentos', categoria: 'leccion' },
  { id: 'dominador-fracciones', icon: shieldBlue, innerIcon: graficoCircularIcon, nombre: 'Dominador de Fracciones', descripcion: 'Numeradores y denominadores', categoria: 'leccion' },
  { id: 'as-decimales', icon: shieldBlue, innerIcon: decimalIcon, nombre: 'As de los Decimales', descripcion: 'Operaciones con comas', categoria: 'leccion' },

  // Módulos completos
  { id: 'economista-hogar', icon: shieldOrange, innerIcon: inHomeMode, nombre: 'Economista del hogar', descripcion: 'Módulo de Finanzas completado', categoria: 'modulo' },
  { id: 'base-aritmetica', icon: shieldOrange, innerIcon: calculateIcon, nombre: 'Base aritmética', descripcion: 'Módulo de Aritmética completado', categoria: 'modulo' },
  { id: 'modulo-porcentajes', icon: shieldOrange, nombre: 'Experto en Porcentajes', descripcion: 'Módulo de Porcentajes completado', categoria: 'modulo', leyenda: '%' },
  { id: 'modulo-fracciones', icon: shieldOrange, nombre: 'Especialista en Fracciones', descripcion: 'Módulo de Fracciones completado', categoria: 'modulo', leyenda: '½' },

  // Puntaje alcanzado (star_rate, stars_2, star_shine)
  { id: 'pts-100', icon: shieldYellow, innerIcon: starRateIcon, nombre: '100 puntos', descripcion: 'Acumulación inicial de puntos', categoria: 'puntaje' },
  { id: 'pts-500', icon: shieldYellow, innerIcon: stars2Icon, nombre: 'Nivel intermedio', descripcion: 'Alcanzaste el rango con 500 pts', categoria: 'puntaje' },
  { id: 'pts-1500', icon: shieldYellow, innerIcon: starShine, nombre: 'Nivel experto', descripcion: 'Alcanzaste el rango máximo con 1.500 pts', categoria: 'puntaje' },
];

const CATEGORIAS = [
  { key: 'inicio', title: 'Cómo empezaste', boxBg: '#e8f7ee', boxBorder: '#bbf7d0', icon: plantIcon },
  { key: 'racha', title: 'Hábito diario', boxBg: '#f3e8ff', boxBorder: '#e9d5ff', icon: modeHeatIcon },
  { key: 'leccion', title: 'Lecciones superadas', boxBg: '#e0f2fe', boxBorder: '#bae6fd', icon: twoPager2Icon },
  { key: 'modulo', title: 'Módulos completos', boxBg: '#ffedd5', boxBorder: '#fed7aa', icon: dashboardIcon },
  { key: 'puntaje', title: 'Puntaje alcanzado', boxBg: '#fef9c3', boxBorder: '#fef08a', icon: starShine2Icon },
];

export default function Logros({ embedded = false, userNivel = 'experto', apiCall }) {
  const [logrosState, setLogrosState] = useState([]);
  const carouselRefs = useRef({});

  // Cargar nivel dinamico del usuario
  const localUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('mate_matico_user') || '{}');
    } catch {
      return {};
    }
  })();
  
  const nivelActual = userNivel || localUser.nivel || localUser.rolActual || 'experto';
  const mascotHeaderImg = getMascotaHeaderImg(nivelActual);

  const evaluarLogros = (progresoData, usuarioData) => {
    try {
      const localUnlocked = JSON.parse(localStorage.getItem('mate_matico_unlocked_logros') || '[]');
      const modulos = progresoData?.progreso?.modulos || progresoData?.modulos || {};
      const puntos = usuarioData?.puntosTotales ?? usuarioData?.puntos ?? progresoData?.gamificacion?.puntosTotales ?? localUser.puntosTotales ?? 100;
      const racha = usuarioData?.rachaDias ?? progresoData?.gamificacion?.rachaDias ?? localUser.rachaDias ?? 3;

      const leccionCompletada = (modKey, lesKey) => {
        const mod = modulos[modKey];
        if (!mod) return false;
        const lecciones = mod.lecciones || mod.lessons || {};
        return !!(lecciones[lesKey]?.completada || lecciones[lesKey]?.completed);
      };

      let totalLecciones = 0;
      Object.values(modulos).forEach(m => {
        const lecciones = m.lecciones || m.lessons || {};
        totalLecciones += Object.values(lecciones).filter(l => l.completada || l.completed).length;
      });

      const aritmeticaCompletas = ['suma-basica', 'resta-basica', 'multiplicacion', 'division']
        .filter(id => leccionCompletada('aritmetica', id)).length;

      const economiaCompletas = ['iva-basico', 'regla-de-tres', 'interes-simple', 'interes-compuesto', 'presupuesto']
        .filter(id => leccionCompletada('economia', id)).length;

      const porcentajesCompletas = ['concepto-porcentaje', 'descuentos']
        .filter(id => leccionCompletada('porcentajes', id)).length;

      const fraccionesCompletas = ['concepto-fraccion', 'decimales']
        .filter(id => leccionCompletada('fracciones', id)).length;

      const condiciones = {
        'primer-paso': totalLecciones >= 1 || localUnlocked.includes('primer-paso') || true,
        'racha-3': racha >= 3 || localUnlocked.includes('racha-3'),
        'racha-7': racha >= 7 || localUnlocked.includes('racha-7'),
        'racha-30': racha >= 30 || localUnlocked.includes('racha-30'),
        'maestro-suma': leccionCompletada('aritmetica', 'suma-basica') || localUnlocked.includes('maestro-suma'),
        'rey-resta': leccionCompletada('aritmetica', 'resta-basica') || localUnlocked.includes('rey-resta'),
        'as-multiplicacion': leccionCompletada('aritmetica', 'multiplicacion') || localUnlocked.includes('as-multiplicacion'),
        'divisor-elite': leccionCompletada('aritmetica', 'division') || localUnlocked.includes('divisor-elite'),
        'maestro-porcentaje': leccionCompletada('porcentajes', 'concepto-porcentaje') || localUnlocked.includes('maestro-porcentaje'),
        'cazador-descuentos': leccionCompletada('porcentajes', 'descuentos') || localUnlocked.includes('cazador-descuentos') || true,
        'dominador-fracciones': leccionCompletada('fracciones', 'concepto-fraccion') || localUnlocked.includes('dominador-fracciones') || true,
        'as-decimales': leccionCompletada('fracciones', 'decimales') || localUnlocked.includes('as-decimales'),
        'economista-hogar': economiaCompletas >= 4 || localUnlocked.includes('economista-hogar'),
        'base-aritmetica': aritmeticaCompletas >= 4 || localUnlocked.includes('base-aritmetica'),
        'modulo-porcentajes': porcentajesCompletas >= 2 || localUnlocked.includes('modulo-porcentajes'),
        'modulo-fracciones': fraccionesCompletas >= 2 || localUnlocked.includes('modulo-fracciones'),
        'pts-100': puntos >= 100 || localUnlocked.includes('pts-100'),
        'pts-500': puntos >= 500 || localUnlocked.includes('pts-500'),
        'pts-1500': puntos >= 1500 || localUnlocked.includes('pts-1500'),
      };

      const listaEvaluada = CATALOGO_DEFAULT.map(item => ({
        ...item,
        desbloqueado: condiciones[item.id] ?? localUnlocked.includes(item.id) ?? false
      }));

      setLogrosState(listaEvaluada);
    } catch (e) {
      setLogrosState(CATALOGO_DEFAULT.map(item => ({ ...item, desbloqueado: true })));
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      if (apiCall) {
        try {
          const res = await apiCall('/progress');
          if (isMounted) evaluarLogros(res, localUser);
          return;
        } catch (err) {
          console.error('Error fetching progress for Logros:', err);
        }
      }
      evaluarLogros(null, localUser);
    };

    fetchProgress();
    return () => { isMounted = false; };
  }, [apiCall]);

  const scrollCarousel = (catKey, direction) => {
    const el = carouselRefs.current[catKey];
    if (el) {
      el.scrollBy({ left: direction, behavior: 'smooth' });
    }
  };

  const totalDesbloqueados = logrosState.filter(l => l.desbloqueado).length;

  return (
    <div className="figma-logros-container">
      {/* Encabezado principal con Mascota Mate segun el Nivel del Usuario (mateAcademico para nivel experto) */}
      <div className="figma-logros-header">
        <div>
          <h1 className="figma-logros-title">Logros e insignias</h1>
          <p className="figma-logros-subtitle">Cada logro es un paso más hacia tu mejor versión</p>
        </div>
        <div className="figma-logros-header-mascot-wrapper">
          <img src={mascotHeaderImg} alt="Mate Universitario" className="figma-logros-header-mascot" />
          <img src={starShine} alt="Estrella" className="figma-logros-header-star" />
        </div>
      </div>

      {/* Tarjeta de Colección */}
      <div className="figma-logros-summary-card">
        <span>Colección de insignias</span>
        <strong>{totalDesbloqueados}/{logrosState.length || 20}</strong>
      </div>

      {/* Filas de Categorías con Carrusel Dinámico Bidireccional */}
      <div className="figma-logros-groups">
        {CATEGORIAS.map(cat => {
          const items = logrosState.filter(l => l.categoria === cat.key);
          if (items.length === 0) return null;

          return (
            <div key={cat.key} className="figma-logros-group-row">
              {/* Etiqueta / Caja de la categoría */}
              <div 
                className="figma-logros-category-pill"
                style={{ backgroundColor: cat.boxBg, borderColor: cat.boxBorder }}
              >
                <img src={cat.icon} alt={cat.title} className="figma-logros-pill-icon" />
                <span>{cat.title}</span>
              </div>

              {/* Botón Flecha Izquierda */}
              {items.length > 1 && (
                <button 
                  type="button"
                  className="figma-logros-carousel-arrow left"
                  onClick={() => scrollCarousel(cat.key, -180)}
                  aria-label="Deslizar carrusel hacia la izquierda"
                  title="Deslizar atrás"
                >
                  <img src={arrowForwardIcon} alt="Atrás" style={{ transform: 'rotate(180deg)' }} />
                </button>
              )}

              {/* Carrusel Dinámico Horizontal */}
              <div 
                className="figma-logros-carousel"
                ref={el => carouselRefs.current[cat.key] = el}
              >
                {items.map(logro => (
                  <div
                    key={logro.id}
                    className={`figma-logro-card ${logro.desbloqueado ? 'unlocked' : 'locked'}`}
                    title={logro.desbloqueado ? '¡Insignia ganada!' : 'Completa el objetivo para desbloquear'}
                  >
                    {logro.desbloqueado && (
                      <span className="figma-logro-check-badge">✓</span>
                    )}

                    <div className="figma-shield-wrapper">
                      <img src={logro.icon} alt={logro.nombre} className="figma-shield-bg" />
                      {logro.innerIcon ? (
                        <img src={logro.innerIcon} alt="" className="figma-shield-inner-icon" />
                      ) : logro.leyenda ? (
                        <span className="figma-shield-legend">{logro.leyenda}</span>
                      ) : null}
                    </div>
                    <span className="figma-logro-title">{logro.nombre}</span>
                    <span className="figma-logro-desc">{logro.descripcion}</span>
                  </div>
                ))}
              </div>

              {/* Botón Flecha Derecha */}
              {items.length > 1 && (
                <button 
                  type="button"
                  className="figma-logros-carousel-arrow right"
                  onClick={() => scrollCarousel(cat.key, 180)}
                  aria-label="Deslizar carrusel hacia la derecha"
                  title="Deslizar adelante"
                >
                  <img src={arrowForwardIcon} alt="Adelante" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Banner de Racha Bottom - Con Mate en Espejo y Estrellita de image 16.png */}
      <div className="figma-logros-bottom-banner">
        <div className="figma-logros-banner-mascot-box">
          <img src={mateCelebracion} alt="Mate Celebrando" className="figma-logros-banner-img" />
          <img src={starImg16} alt="Estrella" className="figma-logros-banner-star" />
        </div>
        <span className="figma-logros-banner-text">
          Cada insignia cuenta<br />tu progreso
        </span>
      </div>
    </div>
  );
}

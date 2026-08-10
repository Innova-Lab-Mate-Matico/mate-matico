import React from 'react';
import './Equipo.css';

import rubenFoto from '../assets/Equipo/ruben_barrios.png';
import matiasFoto from '../assets/Equipo/matias_gonzales.jpg';
import jonatanFoto from '../assets/Equipo/jonatan_churruarin.jpg';
import aliFoto from '../assets/Equipo/ali_tovar.png';
import gissellaFoto from '../assets/Equipo/gi_saldana.png';
import jesusFoto from '../assets/Equipo/jesus_capdevielle.jpg';
import tamaraFoto from '../assets/Equipo/tamara_chaizas.jpeg';
import elianaFoto from '../assets/Equipo/eliana_kaye.jpeg';

import olaCard1 from '../assets/ola1.png';
import olaCard2 from '../assets/ola2.png';

// SVG Inline para GitHub (basado en frontend/src/assets/github.svg)
const GithubIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
    strokeWidth="0" 
    height="22" 
    width="22" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 2C6.475 2 2 6.475 2 12C2 16.425 4.8625 20.1625 8.8375 21.4875C9.3375 21.575 9.525 21.275 9.525 21.0125C9.525 20.775 9.5125 19.9875 9.5125 19.15C7 19.6125 6.35 18.5375 6.15 17.975C6.0375 17.6875 5.55 16.8 5.125 16.5625C4.775 16.375 4.275 15.9125 5.1125 15.9C5.9 15.8875 6.4625 16.625 6.65 16.925C7.55 18.4375 8.9875 18.0125 9.5625 17.75C9.65 17.1 9.9125 16.6625 10.2 16.4125C7.975 16.1625 5.65 15.3 5.65 11.475C5.65 10.3875 6.0375 9.4875 6.675 8.7875C6.575 8.5375 6.225 7.5125 6.775 6.1375C6.775 6.1375 7.6125 5.875 9.525 7.1625C10.325 6.9375 11.175 6.825 12.025 6.825C12.875 6.825 13.725 6.9375 14.525 7.1625C16.4375 5.8625 17.275 6.1375 17.275 6.1375C17.825 7.5125 17.475 8.5375 17.375 8.7875C18.0125 9.4875 18.4 10.375 18.4 11.475C18.4 15.3125 16.0625 16.1625 13.8375 16.4125C14.2 16.725 14.5125 17.325 14.5125 18.2625C14.5125 19.6 14.5 20.675 14.5 21.0125C14.5 21.275 14.6875 21.5875 15.1875 21.4875C17.1727 20.8173 18.8977 19.5415 20.1198 17.8395C21.3419 16.1376 21.9995 14.0953 22 12C22 6.475 17.525 2 12 2Z" 
      fill="currentColor"
    />
  </svg>
);

// SVG Inline para LinkedIn (basado en frontend/src/assets/linkedin.svg)
const LinkedinIcon = () => (
  <svg 
    fill="currentColor" 
    viewBox="-2 -2 24 24" 
    height="22" 
    width="22" 
    xmlns="http://www.w3.org/2000/svg" 
    preserveAspectRatio="xMinYMin"
  >
    <path d="M15 11.13v3.697h-2.143v-3.45c0-.866-.31-1.457-1.086-1.457-.592 0-.945.398-1.1.784-.056.138-.071.33-.071.522v3.601H8.456s.029-5.842 0-6.447H10.6v.913l-.014.021h.014v-.02c.285-.44.793-1.066 1.932-1.066 1.41 0 2.468.922 2.468 2.902zM6.213 5.271C5.48 5.271 5 5.753 5 6.385c0 .62.466 1.115 1.185 1.115h.014c.748 0 1.213-.496 1.213-1.115-.014-.632-.465-1.114-1.199-1.114zm-1.086 9.556h2.144V8.38H5.127v6.447z" />
    <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0 2C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z" />
  </svg>
);

const INTEGRANTES = [
  {
    area: "Developers",
    miembros: [
      { 
        nombre: "Matías Gonzales", 
        rol: "Backend Developer", 
        avatarColor: "#9747FF",
        githubUrl: "https://www.github.com/matygonza",
        linkedinUrl: "https://www.linkedin.com/in/matygonza",
        fotoUrl: matiasFoto
      },
      { 
        nombre: "Jonatan Churruarin", 
        rol: "Backend Developer", 
        avatarColor: "#C80ED9",
        githubUrl: "https://github.com/jochurru",
        linkedinUrl: "https://www.linkedin.com/in/jonatan-churruarin/",
        fotoUrl: jonatanFoto
      },
      { nombre: "Gabriel Rzecznik", rol: "Backend Developer", avatarColor: "#3b82f6" },
      { 
        nombre: "Eliana Kaye", 
        rol: "Frontend Developer", 
        avatarColor: "#10b981",
        githubUrl: "https://github.com/elikaye",
        linkedinUrl: "https://www.linkedin.com/in/eliana-kaye-70b5a524a/",
        fotoUrl: elianaFoto
      },
      { nombre: "Alessandra Sartori", rol: "Frontend Developer", avatarColor: "#f59e0b" }
    ]
  },
  {
    area: "Diseño UX/UI",
    miembros: [
      { 
        nombre: "Gissella Saldaña Brachowicz", 
        rol: "Diseño UX/UI", 
        avatarColor: "#ec4899",
        linkedinUrl: "https://www.linkedin.com/in/gisaldana/",
        fotoUrl: gissellaFoto
      }
    ]
  },
  {
    area: "Testing QA",
    miembros: [
      { 
        nombre: "Ali Valentin Tovar Morales", 
        rol: "Testing QA", 
        avatarColor: "#06b6d4",
        githubUrl: "https://github.com/avtovar",
        linkedinUrl: "https://www.linkedin.com/in/ali-v-tovar/",
        fotoUrl: aliFoto
      },
      { nombre: "Sebastian Estraviz", rol: "Testing QA", avatarColor: "#8b5cf6" },
      { 
        nombre: "Jesus Augusto Parra Capdevielle", 
        rol: "Testing QA", 
        avatarColor: "#14b8a6",
        linkedinUrl: "https://www.linkedin.com/in/jesus-capdevielle/",
        fotoUrl: jesusFoto
      }
    ]
  },
  {
    area: "Data Analytics",
    miembros: [
      { 
        nombre: "Tamara Chaizaz Valenzuela", 
        rol: "Data Analytics", 
        avatarColor: "#f43f5e",
        githubUrl: "https://github.com/TamaraChaizaz",
        linkedinUrl: "https://www.linkedin.com/in/silvia-tamara-chaizaz-valenzuela-1a9ab1290/",
        fotoUrl: tamaraFoto,
        fotoStyle: {
          objectPosition: 'center 12%',
          transform: 'scale(0.92)'
        }
      },
      { 
        nombre: "Ruben Barrios", 
        rol: "Data Analytics", 
        avatarColor: "#06af46",
        githubUrl: "https://github.com/rubenbarrios-bigdata",
        linkedinUrl: "https://www.linkedin.com/in/ruben-barrios-1430712ab",
        fotoUrl: rubenFoto
      }
    ]
  },
  {
    area: "Mentor del Equipo",
    miembros: [
      { nombre: "Matias Campos", rol: "Mentor", avatarColor: "#7b61ff" }
    ]
  }
];

export default function Equipo({ onClose, emailContacto = "talentotech17@gmail.com" }) {
  const [invalidImages, setInvalidImages] = React.useState({});

  const handleImageLoad = (e, name) => {
    if (e.target.naturalWidth <= 1 && e.target.naturalHeight <= 1) {
      setInvalidImages(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleImageError = (name) => {
    setInvalidImages(prev => ({ ...prev, [name]: true }));
  };

  // Obtener iniciales de un nombre
  const getIniciales = (nombre) => {
    const partes = nombre.split(" ");
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  return (
    <div className="equipo-view-container">
      {/* Botón superior de volver */}
      <div className="equipo-header-nav">
        <button type="button" className="equipo-back-btn" onClick={onClose}>
          🡠 Volver
        </button>
      </div>

      <div className="equipo-content-wrapper">
        <div className="equipo-heading-section">
          <h1 className="equipo-main-title">El Equipo Detrás</h1>
          <h2 className="equipo-brand-subtitle">Mate Mático — Innova Lab</h2>
          <p className="equipo-description">
            Conocé a las mentes creativas y desarrolladores que hicieron posible esta plataforma educativa inteligente y gamificada.
          </p>
        </div>

        {INTEGRANTES.map((grupo) => (
          <div key={grupo.area} className="equipo-group-section">
            <h3 className="equipo-group-title">{grupo.area}</h3>
            <div className="equipo-cards-grid">
              {grupo.miembros.map((miembro, index) => (
                <div key={index} className="equipo-member-card">
                  {/* Olas decorativas del marco */}
                  <img src={olaCard1} alt="" className="card-wave card-wave-top" />
                  <img src={olaCard2} alt="" className="card-wave card-wave-bottom" />
                  
                  {/* Contenedor del Avatar en Óvalo como pidió el usuario */}
                  <div className="equipo-avatar-oval-wrapper">
                    <div 
                      className="equipo-avatar-oval"
                      style={{ 
                        backgroundColor: miembro.avatarColor,
                        overflow: 'hidden'
                      }}
                    >
                      {miembro.fotoUrl && !invalidImages[miembro.nombre] ? (
                        <img 
                          src={miembro.fotoUrl} 
                          alt={miembro.nombre} 
                          onLoad={(e) => handleImageLoad(e, miembro.nombre)}
                          onError={() => handleImageError(miembro.nombre)}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            ...miembro.fotoStyle
                          }}
                        />
                      ) : (
                        <span className="equipo-avatar-initials">
                          {getIniciales(miembro.nombre)}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="equipo-member-name">{miembro.nombre}</h4>
                  <p className="equipo-member-role">{miembro.rol}</p>

                  {/* Redes Sociales */}
                  <div className="equipo-social-links">
                    <a 
                      href={miembro.githubUrl || "#github"} 
                      className="equipo-social-icon github" 
                      onClick={miembro.githubUrl ? undefined : (e) => e.preventDefault()}
                      target={miembro.githubUrl ? "_blank" : undefined}
                      rel={miembro.githubUrl ? "noopener noreferrer" : undefined}
                      title={miembro.githubUrl ? `Visitar GitHub de ${miembro.nombre}` : "GitHub (Próximamente)"}
                    >
                      <GithubIcon />
                    </a>
                    <a 
                      href={miembro.linkedinUrl || "#linkedin"} 
                      className="equipo-social-icon linkedin" 
                      onClick={miembro.linkedinUrl ? undefined : (e) => e.preventDefault()}
                      target={miembro.linkedinUrl ? "_blank" : undefined}
                      rel={miembro.linkedinUrl ? "noopener noreferrer" : undefined}
                      title={miembro.linkedinUrl ? `Visitar LinkedIn de ${miembro.nombre}` : "LinkedIn (Próximamente)"}
                    >
                      <LinkedinIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sección de Contacto al Pie */}
        <div className="equipo-contact-box">
          <span className="equipo-contact-icon">✉️</span>
          <h3 className="equipo-contact-title">¿Tenés alguna consulta o propuesta?</h3>
          <p className="equipo-contact-text">
            Escribinos directamente al correo oficial de contacto del proyecto:
          </p>
          <a href={`mailto:${emailContacto}`} className="equipo-contact-email">
            {emailContacto}
          </a>
        </div>
      </div>
    </div>
  );
}

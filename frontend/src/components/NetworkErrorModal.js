import React from 'react';

export default function NetworkErrorModal({ onRetry, logoMascota }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div 
        className="app-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '30px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        <img 
          src={logoMascota} 
          alt="Mascota descansando" 
          style={{ width: '120px', marginBottom: '20px' }}
        />
        <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#163b74', fontWeight: 800, fontSize: '1.4rem', margin: '0 0 10px 0' }}>
          ¡Ups! No pudimos conectar con Mate Mático
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
          Parece que hay un problema temporal con tu conexión a internet o la pizarra de la aplicación está en mantenimiento.
        </p>
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 600, border: 'none', borderRadius: '12px', cursor: 'pointer' }}
          onClick={onRetry}
        >
          Reintentar conexión ↻
        </button>
      </div>
    </div>
  );
}

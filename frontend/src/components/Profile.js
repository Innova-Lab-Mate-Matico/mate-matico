import React from 'react';
import Mascota from './Mascota';
import './Profile.css';

/*
  MATE-MÁTICO — COMPONENTE PERFIL
  (REACT CLÁSICO)
*/

export default function Profile({
  user,
  onLogout,
  onRefresh
}) {
  const rol = user.rolActual || 'principiante';

  return (
    <div className="card profile-card">
      <h2 style={{ marginBottom: '10px' }}>
        Perfil de Usuario
      </h2>

      <Mascota rol={rol} />

      <div style={{ marginTop: '15px' }}>
        <h3>
          Apodo: {user.displayName || 'Sin Nombre'}
        </h3>

        <p>Email: {user.email}</p>

        <p>
          Método de registro:{' '}
          <code>{user.provider}</code>
        </p>
      </div>

      <div
        style={{
          marginTop: '15px',
          borderTop: '1px solid #ccc',
          paddingTop: '10px'
        }}
      >
        <h4>Estadísticas de Gamificación</h4>

        <div
          style={{
            margin: '10px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
        >
          <div>
            <span className="badge badge-gold">
              Puntos acumulados: {user.puntosTotales ?? 0} pts
            </span>
          </div>

          <div>
            <span className="badge badge-success">
              Racha actual: {user.rachaDias ?? 0} días
            </span>
          </div>

          <div>
            <span className="badge">
              Récord histórico: {user.recordRacha ?? 0} días
            </span>
          </div>

          <div>
            <span
              className="badge"
              style={{
                background: '#007bff',
                color: '#fff'
              }}
            >
              Rol Actual: {rol}
            </span>
          </div>
        </div>
      </div>

      <div
        className="profile-actions"
        style={{
          marginTop: '25px',
          display: 'flex',
          gap: '12px'
        }}
      >
        <button
          type="button"
          onClick={onRefresh}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          Sincronizar
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="btn-danger"
          style={{ flex: 1 }}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
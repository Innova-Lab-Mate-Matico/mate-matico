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
  onRefresh,
  apiCall
}) {
  const rol = user.rolActual || 'principiante';
  const [activeDates, setActiveDates] = React.useState([]);

  React.useEffect(() => {
    if (!apiCall) return;
    apiCall('/progress/weekly')
      .then(res => {
        if (res && res.activeDates) {
          setActiveDates(res.activeDates);
        }
      })
      .catch(err => console.error('Error fetching weekly progress:', err));
  }, [apiCall, user.puntosTotales]);

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const week = [];
    const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + distanceToMonday + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;
      week.push({ label: labels[i], dateStr });
    }
    return week;
  };

  const weekDates = getWeekDates();

  return (
    <div className="card profile-card">
      <div className="profile-header-section" style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#163b74', margin: '0 0 5px 0' }}>
          ¡Hola, {user.displayName || 'Estudiante'}! 👋
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
          {user.email}
        </p>
      </div>

      <Mascota rol={rol} />

      <div
        className="profile-stats-section"
        style={{
          marginTop: '25px',
          borderTop: '1.5px dashed rgba(123, 97, 255, 0.15)',
          paddingTop: '20px'
        }}
      >
        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#163b74', marginBottom: '12px', textAlign: 'center' }}>
          Mi Actividad y Racha
        </h4>

        <div
          style={{
            margin: '15px 0',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}
        >
          <div className="badge badge-gold" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', margin: 0 }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700', marginBottom: '2px' }}>Puntos acumulados</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{user.puntosTotales ?? 0} pts</span>
          </div>

          <div className="badge badge-success" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', margin: 0 }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700', marginBottom: '2px' }}>Racha actual</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{user.rachaDias ?? 0} {user.rachaDias === 1 ? 'día' : 'días'}</span>
          </div>

          <div className="badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', margin: 0 }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: '700', marginBottom: '2px' }}>Récord histórico</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{user.recordRacha ?? 0} {user.recordRacha === 1 ? 'día' : 'días'}</span>
          </div>

          <div className="badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', margin: 0, background: '#7b61ff', color: '#fff', borderColor: 'transparent' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.9, fontWeight: '700', marginBottom: '2px' }}>Nivel actual</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '800', textTransform: 'capitalize' }}>{rol}</span>
          </div>
        </div>

        {/* Tracker Semanal de Hábito */}
        <div style={{ marginTop: '20px', borderTop: '1.5px dashed rgba(123, 97, 255, 0.15)', paddingTop: '15px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#163b74', marginBottom: '12px', textAlign: 'center' }}>
            Tu Constancia esta Semana
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '5px 0' }}>
            {weekDates.map((day, idx) => {
              const active = activeDates.includes(day.dateStr);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '6px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: active ? 'linear-gradient(135deg, #7b61ff 0%, #6366f1 100%)' : '#f3f4f6',
                      color: active ? '#fff' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: active ? '1.2rem' : '0.85rem',
                      fontWeight: '700',
                      border: active ? 'none' : '1.5px solid #e5e7eb',
                      boxShadow: active ? '0 4px 10px rgba(99, 102, 241, 0.25)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                    title={day.dateStr}
                  >
                    {active ? '🧉' : day.label}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: '600', color: active ? '#7b61ff' : '#9ca3af' }}>
                    {active ? '¡Listo!' : '—'}
                  </span>
                </div>
              );
            })}
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
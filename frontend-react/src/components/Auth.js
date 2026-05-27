import React, { useState } from 'react';

/*
  MATE-MÁTICO — COMPONENTE AUTENTICACIÓN (REACT CLÁSICO)

  Este componente administra:
  - Registro de usuarios
  - Inicio de sesión tradicional
  - Login con Google Popup

  Toda la lógica de autenticación y manejo de tokens
  es recibida mediante props desde App.js.

  Compatible con:
  - Create React App
  - React clásico
*/

export default function Auth({
  onLogin,
  onGoogleLogin,
  onRegister,
  statusMsg,
  isStatusOk
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e, type) => {
    e.preventDefault();

    if (!email || !password) return;

    setIsLoading(true);

    try {
      if (type === 'register') {
        await onRegister(email, password, displayName);
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      // El manejo de errores ocurre en App.js
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setIsLoading(true);

    try {
      await onGoogleLogin();
    } catch (err) {
      // Manejado en App.js
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '15px' }}>
        {isRegisterMode
          ? 'Registro (Crear Cuenta)'
          : 'Inicio de Sesión'}
      </h2>

      {/* Login Google */}
      <div style={{ marginBottom: '15px' }}>
        <button
          type="button"
          onClick={handleGoogleClick}
          className="btn-google"
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          {isLoading
            ? 'Cargando Google...'
            : 'Continuar con Google'}
        </button>
      </div>

      <div className="divider">
        o usar credenciales directas
      </div>

      {/* Formulario tradicional */}
      <form
        onSubmit={(e) =>
          handleSubmit(
            e,
            isRegisterMode
              ? 'register'
              : 'login'
          )
        }
      >
        <div className="form-group">
          <label htmlFor="email">
            Correo Electrónico
          </label>

          <input
            type="email"
            id="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Contraseña
          </label>

          <input
            type="password"
            id="password"
            minLength="6"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            disabled={isLoading}
          />
        </div>

        {isRegisterMode && (
          <div className="form-group">
            <label htmlFor="displayName">
              Nombre Completo / Apodo
            </label>

            <input
              type="text"
              id="displayName"
              placeholder="Opcional"
              value={displayName}
              onChange={(e) =>
                setDisplayName(
                  e.target.value
                )
              }
              disabled={isLoading}
            />
          </div>
        )}

        <div
          style={{
            marginTop: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading
              ? 'Enviando...'
              : isRegisterMode
              ? 'Crear Cuenta'
              : 'Ingresar'}
          </button>

          <button
            type="button"
            onClick={() =>
              setIsRegisterMode(
                !isRegisterMode
              )
            }
            disabled={isLoading}
            style={{
              width: '100%',
              background: '#fff'
            }}
          >
            {isRegisterMode
              ? '¿Ya tenés cuenta? Iniciar Sesión'
              : '¿No tenés cuenta? Registrarse'}
          </button>
        </div>
      </form>

      {/* Mensajes */}
      {statusMsg && (
        <div
          className={`feedback-box ${
            isStatusOk
              ? 'correct'
              : 'incorrect'
          }`}
          style={{ marginTop: '15px' }}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
}
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

  const validateEmail = (val) => {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(val)) return false;
    const domainParts = val.toLowerCase().split('@')[1]?.split('.') ?? [];
    const baseDomain = domainParts[0];
    const allowedDomains = ['gmail', 'outlook', 'yahoo', 'hotmail'];
    return allowedDomains.includes(baseDomain);
  };

  const validatePassword = (val) => {
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasDigit = /\d/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    const isCorrectLength = val.length >= 8 && val.length <= 12;
    return hasUpper && hasLower && hasDigit && hasSpecial && isCorrectLength;
  };

  const validateName = (val) => {
    if (!val || !val.trim()) return false;
    const nameRe = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    return nameRe.test(val.trim());
  };

  const isFormValid = isRegisterMode
    ? validateName(displayName) && validateEmail(email) && validatePassword(password)
    : email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e, type) => {
    e.preventDefault();

    if (!isFormValid) return;

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
          {isRegisterMode && email.trim().length > 0 && !validateEmail(email) && (
            <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
              Dominio no permitido (solo gmail, outlook, yahoo, hotmail).
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Contraseña
          </label>

          <input
            type="password"
            id="password"
            placeholder={isRegisterMode ? "Mín. 8-12 chars, mayús, minús, num, especial" : "Contraseña"}
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            disabled={isLoading}
          />
          {isRegisterMode && password.length > 0 && !validatePassword(password) && (
            <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
              La contraseña debe tener de 8 a 12 caracteres e incluir mayúscula, minúscula, número y carácter especial.
            </small>
          )}
        </div>

        {isRegisterMode && (
          <div className="form-group">
            <label htmlFor="displayName">
              Nombre Completo (solo letras)
            </label>

            <input
              type="text"
              id="displayName"
              placeholder="Juan Perez"
              value={displayName}
              onChange={(e) =>
                setDisplayName(
                  e.target.value
                )
              }
              onBlur={() => {
                if (displayName) {
                  const capitalized = displayName
                    .trim()
                    .split(/\s+/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                  setDisplayName(capitalized);
                }
              }}
              required
              disabled={isLoading}
            />
            {displayName.trim().length > 0 && !validateName(displayName) && (
              <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
                El nombre solo debe contener letras.
              </small>
            )}
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
            disabled={isLoading || !isFormValid}
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
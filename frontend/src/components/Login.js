import React from "react";
import logoPrincipal from "../assets/Logo.png";
import googleIcon from "../assets/google.png";
import { FaMicrosoft } from "react-icons/fa";

export default function Login({
  onGoogleLogin,
  onMicrosoftLogin,
  statusMsg,
  isStatusOk
}) {
  return (
    <div className="auth-form-wrapper" style={{ padding: '0', background: 'transparent', borderRadius: '0', boxShadow: 'none' }}>
      <div className="auth-header" style={{ marginBottom: '20px' }}>
        <img
          src={logoPrincipal}
          className="auth-logo"
          alt="Mate-Mático"
        />
        <p className="auth-subtitle">
          Aprendé matemáticas mate a mate
        </p>
      </div>

      <div className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
        <p style={{ fontSize: '0.88rem', color: '#64748b', textAlign: 'center', margin: '0 0 8px 0', fontWeight: '500', lineHeight: 1.4 }}>
          Seleccioná tu cuenta para ingresar de forma rápida y segura sin necesidad de contraseña:
        </p>

        {/* Botón Google */}
        <button
          type="button"
          className="btn-google"
          onClick={onGoogleLogin}
          style={{
            width: '100%',
            height: '52px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '0 16px',
            borderRadius: '14px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            background: '#ffffff',
            color: '#1e293b',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            margin: 0
          }}
        >
          <img
            src={googleIcon}
            className="google-icon"
            alt="Google"
            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
          />
          Continuar con Google
        </button>

        {/* Botón Outlook / Microsoft */}
        <button
          type="button"
          className="btn-microsoft"
          onClick={onMicrosoftLogin}
          style={{
            width: '100%',
            height: '52px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '0 16px',
            borderRadius: '14px',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            background: '#ffffff',
            color: '#0078D4',
            border: '1.5px solid #0078D4',
            boxShadow: '0 2px 6px rgba(0, 120, 212, 0.08)',
            transition: 'all 0.2s ease',
            margin: 0
          }}
        >
          <FaMicrosoft style={{ fontSize: '1.2rem', color: '#0078D4', flexShrink: 0 }} />
          Continuar con Outlook / Microsoft
        </button>

        <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
          🔒 Autenticación institucional / personal segura en 1 clic
        </div>
      </div>

      {statusMsg && (
        <div
          className={`feedback-box ${
            isStatusOk ? "correct" : "incorrect"
          }`}
          style={{ marginTop: '16px' }}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
}
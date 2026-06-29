import React, { useState } from "react";
import logoPrincipal from "../assets/Logo.png";
import googleIcon from "../assets/google.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
export default function Login({
 onLogin,
 onGoogleLogin,
 onSwitchMode,
 onSwitchRecover,
 statusMsg,
 isStatusOk
}) {
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const isFormValid =
 email.trim().length > 0 && password.length > 0;
 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!isFormValid) return;
 setIsLoading(true);
 try {
 await onLogin(email, password);
 } finally {
 setIsLoading(false);
 }
 };
 return (
 <div className="auth-form-wrapper">
 <div className="auth-header">
 <img
 src={logoPrincipal}
 className="auth-logo"
 alt="Mate-Mático"
 />
 <p className="auth-subtitle">
 Aprendé matemáticas mate a mate
 </p>
 </div>
 <form onSubmit={handleSubmit} className="auth-form">
 <div className="form-group">
 <label>Nombre de usuario</label>
 <input
 type="text"
 placeholder="Ingresá tu usuario o email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 </div>
 <div className="form-group">
 <label>Contraseña</label>
 <div className="password-input">
 <input
 type={showPassword ? "text" : "password"}
 placeholder="Ingresá tu contraseña"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 />
 <button
 type="button"
 className="eye-button"
 onClick={() => setShowPassword(!showPassword)}
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </div>
 <button
 type="submit"
 className="btn-primary"
 disabled={!isFormValid || isLoading}
 >
 {isLoading ? "Procesando..." : "Iniciar sesión"}
 </button>
 <button
 type="button"
 className="btn-google"
 onClick={onGoogleLogin}
 >
 <img
 src={googleIcon}
 className="google-icon"
 alt="Google"
 />
 Continuar con Google
 </button>
 <span
 className="forgot-password-link"
 onClick={onSwitchRecover}
 >
 ¿Olvidaste tu contraseña?
 </span>
 <button
 type="button"
 className="btn-secondary"
 onClick={onSwitchMode}
 >
 Nuevo usuario
 </button>
 </form>
 {statusMsg && (
 <div
 className={`feedback-box ${
 isStatusOk ? "correct" : "incorrect"
 }`}
 >
 {statusMsg}
 </div>
 )}
 </div>
 );
}
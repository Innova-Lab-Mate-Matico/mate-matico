import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logoPrincipal from "../assets/Logo.png";
export default function Register({
 onRegister,
 statusMsg,
 isStatusOk,
 onSwitchMode
}) {
 const [displayName, setDisplayName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] =
useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const isFormValid =
 displayName.trim() !== "" &&
 email.trim() !== "" &&
 password.trim() !== "" &&
 confirmPassword.trim() !== "" &&
 password === confirmPassword;
 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!isFormValid) return;
 setIsLoading(true);
 try {
  await onRegister(
    email.trim(),
    password,
    displayName.trim()
  );
 } catch (err) {
 console.error(err);
 } finally {
 setIsLoading(false);
 }
 };
 return (
 <div className="auth-form-wrapper">
 <img
 src={logoPrincipal}
 alt="Mate-Mático"
 className="auth-logo"
 />
 <h2 className="auth-title">
 Ingresá tus datos
 </h2>
 <form onSubmit={handleSubmit} className="auth-form">
 {/* USERNAME */}
 <div className="form-group">
 <label>Nombre de usuario</label>
 <input
 type="text"
 value={displayName}
 onChange={(e) => setDisplayName(e.target.value)}
 disabled={isLoading}
 />
 </div>
 {/* EMAIL */}
 <div className="form-group">
 <label>E-mail</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 disabled={isLoading}
 />
 </div>
 {/* PASSWORD */}
 <div className="form-group">
 <label>Contraseña</label>
 <div className="password-input">
 <input
 type={showPassword ? "text" : "password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 disabled={isLoading}
 />
 <button
 type="button"
 className="eye-button"
 onClick={() => setShowPassword(!showPassword)}
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 <small style={{ display: "block", color: "#6b7280", marginTop: "4px", fontSize: "0.78rem" }}>
    La contraseña debe tener al menos 6 caracteres.
  </small>
 </div>
 {/* CONFIRM PASSWORD */}
 <div className="form-group">
 <label>Confirmación de contraseña</label>
 <div className="password-input">
 <input
 type={showConfirmPassword ? "text" : "password"}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 disabled={isLoading}
 />
 <button
 type="button"
 className="eye-button"
 onClick={() =>
 setShowConfirmPassword(!showConfirmPassword)
 }
 >
 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </div>
 {/* ERROR PASSWORD */}
 {confirmPassword && password !== confirmPassword && (
 <small className="error-text">
 Las contraseñas no coinciden
 </small>
 )}
 {/* SUBMIT */}
 <button
 type="submit"
 className="btn-primary"
 disabled={!isFormValid || isLoading}
 >
 {isLoading ? "Procesando..." : "Continuar"}
 </button>
 {/* BACK LOGIN */}
 <button
 type="button"
 className="btn-secondary"
 onClick={onSwitchMode}
 >
 Volver al inicio de sesión
 </button>
 </form>
 {/* STATUS */}
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
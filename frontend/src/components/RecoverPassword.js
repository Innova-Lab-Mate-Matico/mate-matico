import React, { useState } from "react";
import logoPrincipal from "../assets/Logo.png";
export default function RecoverPassword({
 onRecoverPassword,
 statusMsg,
 isStatusOk,
 onSwitchMode
}) {
 const [email, setEmail] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const isFormValid = email.trim().length > 0;
 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!isFormValid) return;
 setIsLoading(true);
 try {
 await onRecoverPassword(email);
 } catch (err) {
 console.error(err);
 } finally {
 setIsLoading(false);
 }
 };
 return (
 <>
 <img src={logoPrincipal} className="auth-logo" alt="Mate-Mático" />
 <h2 className="auth-title">Recuperar Contraseña</h2>
 <p className="auth-subtitle">
 Te enviaremos un link a tu correo
 </p>
 <form onSubmit={handleSubmit}>
 <div className="form-group">
 <label>Correo Electrónico</label>
 <input
 type="email"
 placeholder="correo@ejemplo.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 disabled={isLoading}
 />
 </div>
 <button
 type="submit"
 className="btn-primary"
 disabled={!isFormValid || isLoading}
 >
 {isLoading ? "Enviando..." : "Enviar link"}
 </button>
 <button
 type="button"
 className="btn-secondary"
 onClick={onSwitchMode}
 disabled={isLoading}
 >
 Volver al login
 </button>
 </form>
 {statusMsg && (
 <div className={`feedback-box ${isStatusOk ? "correct" :
"incorrect"}`}>
 {statusMsg}
 </div>
 )}
 </>
 );
}
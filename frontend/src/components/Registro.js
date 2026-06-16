import React, { useState } from "react";
import "../styles/Registro.css";
import mate from "../assets/matematico.jpeg";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "https://mate-matico-backend.onrender.com/api";

function Registro() {
  const [registrado, setRegistrado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmarPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password !== formData.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            displayName:
              `${formData.nombre} ${formData.apellido}`.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Error al registrar usuario."
        );
      }

      if (data.idToken) {
        localStorage.setItem("token", data.idToken);
      }

      setRegistrado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setError("");

      // Pendiente integración Firebase Auth
      // Luego se obtiene idToken y se envía a:
      // POST /auth/google

      alert(
        "Integración con Google pendiente de conectar con Firebase Auth."
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (registrado) {
    return (
      <div className="registro-container">
        <div className="registro-card">
          <img
            src={mate}
            alt="Mate-Mático"
            className="registro-mascota"
          />

          <h1>¡Cuenta creada!</h1>

          <p>
            Tu cuenta fue creada correctamente.
          </p>

          <p>
            Ya podés comenzar tu recorrido de
            aprendizaje en Mate-Mático.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="registro-container">
      <div className="registro-card">

        <img
          src={mate}
          alt="Mate-Mático"
          className="registro-mascota"
        />

        <h1>Crear Cuenta</h1>

        <p>
          Completá tus datos para comenzar
          tu recorrido de aprendizaje.
        </p>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleRegister}
        >
          Continuar con Google
        </button>

        <div className="separator">
          <span>o registrarse con email</span>
        </div>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="apellido"
            placeholder="Apellido"
            value={formData.apellido}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="password-container">
            <input
              type={
                mostrarPassword
                  ? "text"
                  : "password"
              }
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setMostrarPassword(
                  !mostrarPassword
                )
              }
            >
              {mostrarPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="password-container">
            <input
              type={
                mostrarConfirmacion
                  ? "text"
                  : "password"
              }
              name="confirmarPassword"
              placeholder="Confirmar contraseña"
              value={formData.confirmarPassword}
              onChange={handleChange}
              required
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setMostrarConfirmacion(
                  !mostrarConfirmacion
                )
              }
            >
              {mostrarConfirmacion
                ? "🙈"
                : "👁️"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Registrando..."
              : "Crear Cuenta"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Registro;
import React from "react";
import "./PracticarCard.css";

// ============================
// IMÁGENES
// ============================
import image2 from "../assets/image 2.png";
import matecitoTech1 from "../assets/matecitoTech1.png";
import matecitoTech2 from "../assets/matecitoTech2.png";

import androidCell4Bar from "../assets/android_cell_4_bar.svg";
import bookRibbon from "../assets/book_ribbon.svg";
import formatListBulleted from "../assets/format_list_bulleted.svg";

import frame11 from "../assets/Frame 11.svg";
import group52 from "../assets/Group 52.svg";

function PracticarCard({ onBack, onComplete, onNavigate }) {
  return (
    <div className="app-card practicar-card">

      {/* HEADER */}

      <div className="card-header">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← volver
        </button>
      </div>

      {/* CONTENIDO */}

      <div className="card-content">

        <h1 className="practicar-title">
          Practicar
        </h1>
        {/* HERO */}

<section className="hero-section">

  <div className="hero-text">

    <h2>
      Practicá a tu manera
    </h2>

    <p>
      Elegí cómo querés practicar
      <br />
      y la IA generará ejercicios
      <br />
      para vos.
    </p>

  </div>

  <div className="hero-decoration">

    <img
      src={image2}
      alt=""
      className="wave-image"
    />

    <img
      src={matecitoTech1}
      alt="Matecito IA"
      className="hero-image"
    />

  </div>

 </section>

        {/* =========================
            FILTRO 1
        ========================= */}

        <div className="filter-group">

          <label>
            Nivel de dificultad
          </label>

          <div className="filter-row">

            <div className="circle-icon">
              <img
                src={androidCell4Bar}
                alt=""
              />
            </div>

            <select className="filter-select">
              <option>
                Nivel 1 (Intermedio)
              </option>
            </select>

          </div>

        </div>

        {/* =========================
            FILTRO 2
        ========================= */}

        <div className="filter-group">

          <label>
            Apartado temático
          </label>

          <div className="filter-row">

            <div className="circle-icon">
              <img
                src={bookRibbon}
                alt=""
              />
            </div>

            <select className="filter-select">
              <option>
                Suma y resta
              </option>
            </select>

          </div>

        </div>
                {/* =========================
            FILTRO 3
        ========================= */}

        <div className="filter-group">

          <label>
            Estructura de la respuesta
          </label>

          <div className="filter-row">

            <div className="circle-icon">
              <img
                src={formatListBulleted}
                alt=""
              />
            </div>

            <select className="filter-select">
              <option>
                Opción múltiple
              </option>
            </select>

          </div>

        </div>

        {/* =========================
            TARJETA IA
        ========================= */}

        <div className="info-card ia-card">

          <img
            src={frame11}
            alt="IA"
            className="ia-icon"
          />

          <p>
            La IA creará ejercicios a tu medida,
            <br />
            para que aprendas y sigas
            <br />
            mejorando.
          </p>

        </div>

        {/* =========================
            TARJETA MATE
        ========================= */}

        <div className="info-card mate-card">

          <img
            src={matecitoTech2}
            alt="Matecito"
            className="mate-info"
          />

          <p>
            Podés cambiar los filtros
            <br />
            cuando quieras para
            <br />
            practicar temas o niveles.
          </p>

        </div>

      </div>

         {/* =========================
          BOTÓN
      ========================= */}

      <div className="card-footer">

        <button
          className="primary-button generar-button"
          onClick={onComplete}
        >

          <span>
            Generar ejercicio
          </span>

          <img
            src={group52}
            alt=""
            className="button-icon"
          />

        </button>

      </div>

    </div>
  );
}

export default PracticarCard;

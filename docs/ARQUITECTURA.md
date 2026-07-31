# 🏛️ Arquitectura del Sistema — Mate Mático mate-a-mate 🧉

Documento de diseño arquitectónico y flujo de datos del proyecto Mate Mático.

---

## 1. 📐 Visión General del Sistema

Mate Mático es una plataforma educativa de matemáticas gamificada con soporte para IA pedagógica, telemetría por lotes y analítica avanzada. Su arquitectura desacoplada opera bajo el siguiente esquema de componentes:

```
                               ┌─────────────────────────────────────────┐
                               │       Google Tag Manager / GA4          │
                               │             (GTM-5RDTRVPK)              │
                               └─────────────────────────────────────────┘
                                                    ▲
                                                    │ dataLayer.push()
                                                    │
┌──────────────────────────┐   REST API + Bearer   ┌──────────────────────────┐   Admin SDK   ┌──────────────────────────┐
│     Frontend (React)     │ ────────────────────► │     Backend (Express)    │ ────────────► │  Firebase Auth & Cloud   │
│   Puerto 3001 / Vercel   │                       │   Puerto 3000 / Render   │               │        Firestore         │
└──────────────────────────┘                       └──────────────────────────┘               └──────────────────────────┘
             │                                                  │
             └─────── Telemetría por Lotes (Batching) ──────────┴───────────────────────────► ┌──────────────────────────┐
                       POST /api/tracking/batch (32KB Max)                                    │   Supabase PostgreSQL    │
                                                                                              │    (Tabla JSONB: eventos) │
                                                                                              └──────────────────────────┘
                                                                                                           ▲
                                                                                                           │ SQL
                                                                                              ┌──────────────────────────┐
                                                                                              │ Looker Studio / Power BI │
                                                                                              └──────────────────────────┘
```

---

## 2. 📁 Estructura del Monorepo

```text
Mate-Matico/
├── backend/                       # Servidor Express, API REST, Zod, Logger y Servicios
│   ├── src/
│   │   ├── config/                # env.js, firebase.js, logger.js, supabase.js
│   │   ├── middleware/            # auth.middleware.js, validate.js, security.js, errorHandler.js
│   │   ├── routes/                # auth, modules, progress, exercises, tracking, onboarding, analytics, explain
│   │   ├── services/              # usuario, exercise, racha, rol, tracking, gemini/explain
│   │   ├── exercises/             # Generadores adaptativos por módulo
│   │   ├── server.js              # HTTP Entrypoint & Graceful Shutdown (SIGTERM/SIGINT)
│   │   └── app.js                 # Middleware Express, Cors, Helmet, Routing
│   ├── firestore.rules            # Reglas de seguridad Zero Trust para Firestore
│   └── package.json
├── frontend/                      # Cliente SPA en React
│   ├── public/
│   │   └── index.html             # Snippet oficial GTM-5RDTRVPK
│   ├── src/
│   │   ├── components/            # Auth, OnboardingWizard, LessonFlow, NumericExercise, MultipleChoice, Calculadora, AdminAnalyticsView...
│   │   ├── services/              # TelemetryService.js (Buffer + Batching)
│   │   ├── styles/                # Dashboard.css y CSS Vanilla responsivos
│   │   ├── App.js                 # Manejo de sesión, pestañas (activeTab) y API Router
│   │   └── index.js
│   └── package.json
├── docs/                          # Documentación del sistema
│   ├── ARQUITECTURA.md            # (Este documento)
│   ├── RUNBOOK.md                 # Guía de instalación y operación
│   └── TROUBLESHOOTING.md         # Resolución de incidencias
├── firestore.rules                # Reglas raíz de Firestore Database
├── detener-todo.bat               # Script Windows para detener procesos en :3000
├── iniciar-todo.bat               # Script Windows para levantar backend + frontend
└── verificar-entorno.bat          # Diagnóstico de puertos y dependencias
```

---

## 3. ⚙️ Capa de Backend (`backend/src/`)

### 3.1 Módulos y Responsabilidades

| Componente | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| **Entrada HTTP** | `server.js` | Inicializa el puerto HTTP y gestiona **Graceful Shutdown** (`SIGTERM`/`SIGINT`) con timeout de 10s. |
| **Configuración** | `config/env.js` | Lectura estricta y sanitizada de variables de entorno (`dotenv`). |
| **Logger JSON** | `config/logger.js` | Logging estructurado JSON en producción con enmascaramiento automático de credenciales. |
| **Seguridad** | `middleware/security.js` | Configuración de **Helmet**, **CORS** con orígenes dinámicos y **express-rate-limit**. |
| **Autenticación** | `middleware/auth.middleware.js` | `requireAuth`: Validación de JWT Bearer tokens mediante Firebase Admin SDK. |
| **Validaciones** | `middleware/validate.js` | Validación declarativa de esquemas con **Zod** (`register`, `login`, `onboarding`, `exercise`, `explain`). |
| **Manejo de Errores** | `middleware/errorHandler.js` | Captura centralizada de excepciones HTTP y logging de errores. |

---

### 3.2 Endpoints RESTful de la API (`/api/*`)

- `POST /api/auth/register` & `POST /api/auth/login`: Registro y autenticación con email/password.
- `POST /api/auth/google`: Autenticación federada mediante Firebase ID Token.
- `GET /api/modules`: Catálogo de módulos pedagógicos (Aritmética, Porcentajes, Fracciones, Economía Doméstica).
- `POST /api/exercises/validate`: Evaluación del lado del servidor de respuestas matemáticas con cálculo de racha y puntos.
- `POST /api/tracking/batch`: Ingesta masiva por lotes (Payload máx. 32KB) hacia Supabase PostgreSQL.
- `POST /api/onboarding`: Registro del perfil inicial del alumno (edad, nivel educativo, objetivos).
- `POST /api/explain`: Tutor pedagógico de IA impulsado por la API de Gemini.
- `GET /api/analytics/dashboards`: Panel de analítica avanzada para administradores.

---

## 4. 📊 Pipeline de Telemetría por Lotes ($0 Costo en Firestore)

Para preservar la cuota gratuita de Firestore y garantizar alta velocidad en el cliente, la telemetría se procesa de forma híbrida:

```
[ Acciones del Alumno ]
          │
          ├──► 1. Dispatch sincrónico a window.dataLayer.push() ──► GTM / GA4 (GTM-5RDTRVPK)
          │
          └──► 2. Buffer en memoria en TelemetryService.js
                       │
                       ├── (Condición: 10 eventos O 30 segundos de inactividad)
                       │
                       └──► POST /api/tracking/batch (JSON Payload <= 32KB)
                                       │
                                       └──► Inserción asíncrona en Supabase PostgreSQL
                                            Tabla: eventos (id, usuario_id, tipo_evento, metadata: jsonb)
```

### 📋 Taxonomía de los 17 Eventos Registrados
1. **Autenticación (2)**: `usuario_registrado`, `usuario_inicio_sesion`
2. **Onboarding (3)**: `onboarding_iniciado`, `onboarding_abandonado`, `onboarding_finalizado`
3. **Lecciones (3)**: `leccion_iniciada`, `leccion_abandonada`, `leccion_completada`
4. **Ejercicios (3)**: `ejercicio_iniciado`, `ejercicio_abandonado`, `ejercicio_completado`
5. **Navegación & Errores (3)**: `pantalla_visitada`, `progreso_actualizado`, `error_aplicacion`
6. **Engagement & Racha (3)**: `racha_perdida`, `racha_actualizada`, `sesion_finalizada`

---

## 5. 🗄️ Modelo de Datos (Bases de Datos Híbridas)

### A. Firebase Cloud Firestore (Datos de Usuario & Gamificación)
- **`usuarios/{uid}`**: Perfil del alumno (`puntosTotales`, `rachaDias`, `recordRacha`, `rolActual`, `onboarding`).
- **`progreso/{uid}`**: Avance por módulo (`porcentajes`, `fracciones`, `lecciones` completadas).
- **`registroIntentos/{id}`**: Historial de intentos en ejercicios.

### B. Supabase PostgreSQL (Telemetría & BI)
- **Tabla `eventos`**:
  - `id` (`uuid`, PK)
  - `usuario_id` (`text`)
  - `tipo_evento` (`text`)
  - `metadata` (`jsonb`)
  - `creado_en` (`timestamptz`)

---

## 💻 6. Capa de Frontend (`frontend/src/`)

- **React SPA**: Arquitectura basada en componentes funcionales con React Hooks (`useState`, `useEffect`, `useRef`).
- **Diseño Responsivo (Vanilla CSS)**: Reglas en `App.css` y `Dashboard.css` adaptando automáticamente tarjetas, navbar y modals (`Calculadora`) de 320px a 1920px+.
- **Resiliencia en Red**: Uso de `fetch` con `keepalive: true` para garantizar que la descarga de métricas al cerrar la ventana incluya cabeceras de autenticación sin ser cancelada por el navegador.

---

## 🛡️ 7. Medidas de Seguridad Implementadas

1. **Cero Secretos Hardcodeados**: Todas las claves privadas de Firebase Admin y Supabase se cargan desde `.env`.
2. **Firestore Zero Trust**: Reglas estrictas en `firestore.rules` cerrando accesos globales y permitiendo solo operaciones sobre el UID propio.
3. **Validación Zod & Sanitización**: Limpieza de cadenas en inputs de usuarios para prevenir XSS e inyecciones.
4. **CORS Restringido**: Orígenes permitidos especificados dinámicamente mediante lista blanca.

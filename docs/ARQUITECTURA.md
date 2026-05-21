# Arquitectura — Mate-Mático

Qué hace cada parte del monorepo y cómo fluyen los datos.

---

## Visión general

```
┌──────────────┐   /api + Bearer    ┌─────────────┐   Admin SDK   ┌──────────────┐
│  frontend/   │ ─────────────────► │  backend/   │ ────────────► │   Firebase   │
│  Vite :5173  │                    │  Express    │               │ Auth+Firestore│
└──────────────┘                    └─────────────┘               └──────────────┘
       │                                    │
       └── Firebase Auth (popup Google) ──┘ verifyIdToken / REST login
```

- **backend/** — API REST, validación de ejercicios, gamificación, Firestore.
- **frontend/** — Panel de prueba manual (no es la app final de producción).

---

## Estructura del repositorio

```
Mate-Matico backend/
├── docs/                    # Documentación
│   ├── ARQUITECTURA.md
│   ├── RUNBOOK.md
│   └── TROUBLESHOOTING.md
├── backend/                 # API Node + Express
├── frontend/                # Panel Vite
├── iniciar-todo.bat
├── detener-todo.bat
├── iniciar-backend.bat
├── iniciar-frontend.bat
└── verificar-entorno.bat
```

---

## Backend (`backend/src/`)

| Ruta / archivo | Rol |
|----------------|-----|
| `server.js` | Arranca HTTP en `PORT` (3000) |
| `app.js` | Rutas `/api/*`, middleware, health |
| `config/env.js` | Variables `.env` y cuenta de servicio |
| `config/firebase.js` | Inicializa Firebase Admin (`auth`, `db`) |
| `middleware/security.js` | Helmet, CORS, rate limit en `/api/auth` |
| `middleware/auth.middleware.js` | `requireAuth` — verifica Bearer JWT |
| `middleware/validate.js` | Validación de bodies |
| `middleware/errorHandler.js` | Respuestas de error JSON |
| `routes/auth.routes.js` | register, login, google, me |
| `routes/modules.routes.js` | Catálogo y lecciones |
| `routes/progress.routes.js` | Progreso del usuario |
| `routes/exercise.routes.js` | `POST /validate` |
| `services/auth.service.js` | Auth Admin + Identity Toolkit REST |
| `services/usuario.service.js` | Colección `usuarios`, puntos, racha, rol |
| `services/exercise.service.js` | Validar respuestas, comodín, recompensas |
| `services/modules.service.js` | Generación dinámica de ejercicios |
| `services/rol.service.js` | principiante / intermedio / avanzado |
| `services/racha.service.js` | Racha diaria (ventana 48 h) |
| `exercises/registry.js` | Registro de generadores por módulo |
| `exercises/modules/*.js` | Aritmética, porcentajes, fracciones |
| `data/moduleCatalog.js` | Metadatos de módulos |
| `scripts/seed.js` | Plantillas en Firestore |

### Flujo auth (email)

1. `POST /api/auth/login` → Identity Toolkit con `FIREBASE_WEB_API_KEY`
2. Crea/lee documento en `usuarios`
3. Devuelve `idToken` al cliente

### Flujo auth (Google)

1. Cliente: popup Firebase → `idToken`
2. `POST /api/auth/google` → `verifyIdToken` + perfil en `usuarios`

### Flujo ejercicio

1. `GET /modules/...` → ejercicios con `semilla`, `operandos` (sin respuesta)
2. `POST /exercises/validate` → reconstruye ejercicio, compara, suma puntos

---

## Firestore

| Colección / ruta | Contenido |
|------------------|-----------|
| `usuarios/{uid}` | Perfil gamificado |
| `usuarios/{uid}/progreso` | Avance por módulo |
| `usuarios/{uid}/intentos` | Errores consecutivos (comodín) |
| `plantillasEjercicio` | Textos opcionales (seed) |

Campos clave del usuario: `puntosTotales`, `rachaDias`, `recordRacha`, `rolActual`, `ultimaLeccionCompletada`.

---

## Frontend (`frontend/`)

| Archivo | Rol |
|---------|-----|
| `index.html` | UI del panel |
| `src/app.js` | Lógica: API, token, Google popup, módulos |
| `vite.config.js` | Puerto 5173, proxy `/api` → `:3000` |
| `.env` | `VITE_*` públicas de Firebase |

Token en `localStorage` (`idToken`). Las llamadas usan `Authorization: Bearer ...`.

---

## Variables de entorno

| Variable | Dónde | Uso |
|----------|-------|-----|
| `FIREBASE_PRIVATE_KEY`, `CLIENT_EMAIL`, … | backend | Admin SDK |
| `FIREBASE_WEB_API_KEY` | backend | Login email REST |
| `CORS_ORIGINS` | backend | Orígenes permitidos |
| `VITE_FIREBASE_*` | frontend | SDK cliente (Google) |
| `VITE_API_BASE_URL` | frontend | `/api` recomendado |

---

## Seguridad

- Respuestas correctas solo en servidor.
- `semilla` + `operandos` obligatorios al validar.
- Sin endpoint que exponga secretos del servidor.
- Rate limit en rutas de auth.

---

## Más detalle

- Operación: [RUNBOOK.md](./RUNBOOK.md)
- Problemas: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- API JSON: [../backend/API.md](../backend/API.md)

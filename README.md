# Mate-Mático — Monorepo (MVP)

API de matemáticas gamificada + panel de prueba.

| Carpeta | Descripción |
|---------|-------------|
| `backend/` | Node.js + Express + Firebase Admin + Firestore |
| `frontend/` | Panel de prueba (Vite) |

## Documentación (`docs/`)

| Archivo | Contenido |
|---------|-----------|
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Instalación, arranque, scripts `.bat`, operación diaria |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Errores frecuentes y cómo resolverlos |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Qué hace cada módulo y flujos del sistema |
| [backend/API.md](backend/API.md) | Referencia de endpoints REST |

## Inicio rápido (Windows)

1. Node.js LTS instalado.
2. `backend/.env` y `frontend/.env` configurados (ver `.env.example`).
3. **`detener-todo.bat`** si los puertos estaban ocupados.
4. **`iniciar-todo.bat`**
5. Abrir **http://localhost:5173**

Verificación: **`verificar-entorno.bat`**

## URLs

| Servicio | URL |
|----------|-----|
| Panel | http://localhost:5173 |
| API | http://localhost:3000/api |
| Health | http://localhost:3000/api/health |

## Scripts npm (raíz)

```bash
npm run setup      # instala backend + frontend
npm run dev:api    # backend con watch
npm run dev:front  # frontend Vite
npm run seed       # plantillas Firestore
```

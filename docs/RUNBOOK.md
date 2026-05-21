# Runbook — Operación Mate-Mático

Guía para **instalar, arrancar, verificar y mantener** el entorno de desarrollo.

---

## 1. Requisitos previos

| Requisito | Nota |
|-----------|------|
| Node.js LTS | [nodejs.org](https://nodejs.org) — en Windows los `.bat` usan `C:\Program Files\nodejs` |
| Proyecto Firebase | Ej. `talento14bd` |
| Firestore | Base creada (modo Native) en Firebase Console |
| Firebase Authentication | Activado (Comenzar + Email y/o Google) |
| Cuenta de servicio | Variables en `backend/.env` |

---

## 2. Instalación inicial (una vez)

### 2.1 Dependencias

```bash
npm run setup
```

O dejar que `iniciar-backend.bat` / `iniciar-frontend.bat` ejecuten `npm install` la primera vez.

### 2.2 Variables de entorno

**Backend**

```text
copy backend\.env.example backend\.env
```

Completar: `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY`, claves de cuenta de servicio (`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, etc.), `CORS_ORIGINS`.

**Frontend**

```text
copy frontend\.env.example frontend\.env
```

Completar todas las `VITE_FIREBASE_*` y:

```env
VITE_API_BASE_URL=/api
```

### 2.3 Firebase Console (checklist)

- [ ] Authentication → **Comenzar**
- [ ] Sign-in method → **Email/Password** (y **Google** si se usa)
- [ ] Settings → Authorized domains → **`localhost`**
- [ ] Firestore → base de datos creada
- [ ] (Google) OAuth → origen `http://localhost:5173`

### 2.4 Seed opcional

```bash
cd backend
npm run seed
```

Carga colección `plantillasEjercicio` (explicaciones y comodines).

---

## 3. Arranque diario

| Paso | Acción |
|------|--------|
| 1 | Si hubo errores de puerto: **`detener-todo.bat`** |
| 2 | **`iniciar-todo.bat`** (backend + frontend en 2 ventanas) |
| 3 | Navegador: **http://localhost:5173** |
| 4 | Dudas: **`verificar-entorno.bat`** |

### Arranque manual

**Terminal 1 — API**

```bash
cd backend
npm run dev
```

→ `http://localhost:3000/api`

**Terminal 2 — Panel**

```bash
cd frontend
npm run dev
```

→ `http://localhost:5173`

---

## 4. Scripts `.bat` (raíz del proyecto)

| Script | Función |
|--------|---------|
| `iniciar-todo.bat` | Abre backend (:3000) y frontend (:5173) |
| `detener-todo.bat` | Libera puertos 3000, 5173 y 5174 |
| `iniciar-backend.bat` | Solo API |
| `iniciar-frontend.bat` | Solo panel Vite |
| `verificar-entorno.bat` | Node, `.env`, health de servicios |

---

## 5. Verificación rápida

| Check | URL / comando | Esperado |
|-------|---------------|----------|
| API | http://localhost:3000/api/health | `"status": "ok"` |
| Front | http://localhost:5173 | Panel Mate-Mático |
| Proxy | http://localhost:5173/api/health | Mismo JSON que API |
| Entorno | `verificar-entorno.bat` | [OK] en Node y servicios |

---

## 6. Operaciones frecuentes

### Registrar / login

- **Email:** Registrarse → Iniciar sesión (va al backend, no requiere popup).
- **Google:** Continuar con Google (popup Firebase + `POST /api/auth/google`).

### Reiniciar tras cambiar `.env`

1. `detener-todo.bat`
2. `iniciar-todo.bat`

Vite solo lee `frontend/.env` al arrancar.

### Probar API sin panel

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

---

## 7. URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Panel | http://localhost:5173 |
| API directa | http://localhost:3000/api |
| API vía proxy Vite | http://localhost:5173/api |

---

## 8. Producción (orientación)

- `NODE_ENV=production`, `npm run start` en backend detrás de HTTPS.
- Agregar dominio del front en `CORS_ORIGINS`.
- `npm run build` en frontend y servir `frontend/dist/`.
- `VITE_API_BASE_URL` apuntando a la API pública en el build.

---

## 9. Documentación relacionada

- [ARQUITECTURA.md](./ARQUITECTURA.md) — qué hace cada parte del código
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — errores y soluciones
- [../backend/API.md](../backend/API.md) — endpoints JSON

---

## 10. Checklist demo

- [ ] `/api/health` → 200
- [ ] Registro o login email
- [ ] Google (si está configurado)
- [ ] Cargar módulos y validar un ejercicio
- [ ] Perfil muestra puntos / racha tras acertar

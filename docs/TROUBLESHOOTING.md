# Troubleshooting — Mate-Mático

**Síntoma → causa → solución.** Complementa el [RUNBOOK.md](./RUNBOOK.md).

---

## Diagnóstico en 3 pasos

1. Ejecutar **`verificar-entorno.bat`**
2. Revisar la **consola del backend** al reproducir el error
3. Navegador **F12 → Network** → request fallido → `{ "error": "..." }`

---

## 1. Entorno y puertos

### Node / npm no encontrado

| | |
|-|-|
| **Síntoma** | `'node' no se reconoce...` |
| **Solución** | Instalar Node LTS; usar los `.bat` del proyecto o agregar Node al PATH |

### Puerto 3000 o 5173 en uso

| | |
|-|-|
| **Síntoma** | `EADDRINUSE`, API no arranca, Vite en otro puerto |
| **Solución** | **`detener-todo.bat`** → **`iniciar-todo.bat`** |

### Falta `backend/.env`

| | |
|-|-|
| **Síntoma** | `iniciar-backend.bat` se detiene con error |
| **Solución** | `copy backend\.env.example backend\.env` y completar credenciales |

### API no responde en `/api/health`

| | |
|-|-|
| **Causas** | Backend no corriendo; `.env` inválido (private key mal escapada); firewall |
| **Solución** | Ver log al iniciar `npm run dev` en `backend/` |

---

## 2. Firebase Authentication

### `auth/configuration-not-found`

| | |
|-|-|
| **Síntoma** | Error Firebase en el panel al usar Google o Auth |
| **Causa** | Authentication **no activado** en el proyecto |
| **Solución** | [Firebase Console](https://console.firebase.google.com/project/talento14bd/authentication) → **Comenzar** → habilitar Email y/o Google → reiniciar frontend |

**Prueba rápida (PowerShell):**

```powershell
$key = "TU_VITE_FIREBASE_API_KEY"
$body = '{"email":"test@test.com","password":"testpass123","returnSecureToken":true}'
(Invoke-WebRequest -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$key" -Method POST -ContentType "application/json" -Body $body).Content
```

- Si aparece `CONFIGURATION_NOT_FOUND` → Auth no activo.
- Si devuelve token o `EMAIL_EXISTS` → Auth OK.

### Google: "The requested action is invalid" / puerto 5174

| | |
|-|-|
| **Causa** | Front en puerto distinto al registrado en OAuth |
| **Solución** | Solo **http://localhost:5173**; `detener-todo.bat`; en Google Cloud OAuth agregar origen `http://localhost:5173` |

### `auth/unauthorized-domain`

| | |
|-|-|
| **Solución** | Authentication → Settings → Authorized domains → **`localhost`** |

### `auth/operation-not-allowed`

| | |
|-|-|
| **Solución** | Sign-in method → activar **Google** o **Email/Password** |

### Popup cerrado o bloqueado

| | |
|-|-|
| **Síntoma** | `auth/popup-closed-by-user`, `auth/popup-blocked` |
| **Solución** | Permitir popups; o usar **login por email** |

### "No se pudo completar Google"

| | |
|-|-|
| **Causas** | Google deshabilitado; dominio; `VITE_FIREBASE_*` vacías o incorrectas |
| **Solución** | Checklist Firebase arriba; probar email/contraseña para aislar el problema |

---

## 3. Backend API

### 503 — Login email no disponible

| | |
|-|-|
| **Causa** | Falta `FIREBASE_WEB_API_KEY` en `backend/.env` |
| **Solución** | Copiar la `apiKey` de Firebase Console → reiniciar backend |

### 401 — Email o contraseña incorrectos

| | |
|-|-|
| **Solución** | **Registrarse** primero; o resetear password en Console → Authentication → Users |

### 401 — Token inválido o expirado

| | |
|-|-|
| **Solución** | Volver a iniciar sesión; borrar `localStorage` → clave `idToken` |

### 500 — Error interno del servidor

| | |
|-|-|
| **Causas frecuentes** | Firestore no creado; cuenta de servicio inválida; error al escribir en Firestore |
| **Diagnóstico** | Log en ventana del backend; en desarrollo el JSON puede traer mensaje detallado |
| **Solución** | Crear base Firestore; revisar `FIREBASE_PRIVATE_KEY` con `\n` correctos |

### 404 — Usuario no encontrado (`/auth/me`)

| | |
|-|-|
| **Causa** | Token válido pero sin documento en colección `usuarios` |
| **Solución** | Registrarse de nuevo o `POST /api/auth/google` |

### 429 — Demasiados intentos

| | |
|-|-|
| **Causa** | Rate limit en `/api/auth` (100 req / 15 min en dev) |
| **Solución** | Esperar o reiniciar backend |

### CORS blocked

| | |
|-|-|
| **Causa** | Front llama a `:3000` sin estar en `CORS_ORIGINS` |
| **Solución** | `VITE_API_BASE_URL=/api` y proxy Vite; o agregar origen exacto en `CORS_ORIGINS` |

---

## 4. Frontend / panel

### `VITE_FIREBASE_API_KEY` vacía

| | |
|-|-|
| **Solución** | Completar `frontend/.env` → reiniciar `npm run dev` |

### Cambios en `.env` no aplican

| | |
|-|-|
| **Solución** | Detener y volver a iniciar Vite (`detener-todo.bat` + `iniciar-frontend.bat`) |

### API base incorrecta

| | |
|-|-|
| **Desarrollo** | `VITE_API_BASE_URL=/api` |
| **Sin Vite** | `http://localhost:3000/api` |

---

## 5. Ejercicios

### 400 — semilla y operandos obligatorios

| | |
|-|-|
| **Solución** | Enviar en validate los mismos `semilla` y `operandos` que devolvió la lección |

### Siempre incorrecto

| | |
|-|-|
| **Causas** | Tipo distinto (string vs número); semilla u operandos modificados |
| **Solución** | No cambiar datos entre cargar lección y enviar respuesta |

### No aparece comodín

| | |
|-|-|
| **Regla** | Tras **2 errores seguidos** en el mismo ejercicio |

### Puntos / racha no suben

| | |
|-|-|
| **Regla** | Solo al **acertar**; racha según ventana de 48 h |

---

## 6. Tabla HTTP rápida

| HTTP | Acción típica |
|------|----------------|
| 400 | Revisar body ([API.md](../backend/API.md)) |
| 401 | Re-login |
| 404 | Registrar usuario / ID incorrecto |
| 409 | Email ya existe → login |
| 429 | Esperar rate limit |
| 500 | Log backend + Firestore |
| 503 | `FIREBASE_WEB_API_KEY` en backend |

---

## 7. Comandos útiles

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:5173/api/health

Invoke-RestMethod http://localhost:3000/api/auth/login -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"tu@mail.com","password":"tu_pass"}'
```

```bash
cd backend && npm run seed
node -v && npm -v
```

---

## 8. Reportar un bug

Incluir:

1. Mensaje exacto (captura o texto)
2. ¿Email, Google o ambos?
3. Salida de `verificar-entorno.bat`
4. Log del backend (sin private keys)
5. Network: URL, status, body `error`

---

## 9. Incidentes conocidos (MVP)

| Incidente | Solución |
|-----------|----------|
| `CONFIGURATION_NOT_FOUND` | Activar Authentication en Console |
| Google en puerto 5174 | `detener-todo.bat` + solo :5173 |
| 500 tras login Google | Firestore activo; no escribir campos undefined |
| 503 login email | `FIREBASE_WEB_API_KEY` en backend |

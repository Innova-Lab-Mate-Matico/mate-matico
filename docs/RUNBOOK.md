# 🚀 Runbook de Operación — Mate-Mático 🧉

Guía exhaustiva para **instalar, configurar, arrancar, verificar, probar y mantener** el entorno de desarrollo y producción del proyecto Mate-Mático.

---

## 1. Requisitos Previos

| Requisito | Versión / Detalle | Nota de Configuración |
| :--- | :--- | :--- |
| **Node.js** | 18+ LTS | [nodejs.org](https://nodejs.org) (Windows usa ejecutable en `C:\Program Files\nodejs`) |
| **Firebase Project** | Firebase Console | Proyecto activo con Auth (Email/Password + Google) y Firestore Database. |
| **Supabase Project** | Supabase Cloud | Instancia PostgreSQL activa con la tabla `eventos` (JSONB) para telemetría. |
| **Google Tag Manager** | Contenedor `GTM-5RDTRVPK` | Snippet incluido en `frontend/public/index.html`. |

---

## 2. Instalación Inicial y Configuración

### 2.1 Instalación de Dependencias
Ejecutar desde la raíz del monorepo:
```bash
npm run setup
```
*(Instalará automáticamente los módulos de `backend` y `frontend`).*

---

### 2.2 Variables de Entorno (`.env`)

#### Backend (`backend/.env`)
Copia la plantilla y completa tus credenciales:
```cmd
copy backend\.env.example backend\.env
```
Campos requeridos:
```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY_ID=tu-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
CORS_ORIGINS=http://localhost:3000,https://mate-matico.vercel.app
```

#### Frontend (`frontend/.env`)
Copia la plantilla:
```cmd
copy frontend\.env.example frontend\.env
```
Campos requeridos:
```env
REACT_APP_FIREBASE_API_KEY=tu-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:...
REACT_APP_API_BASE_URL=/api
```

---

### 2.3 Reglas de Seguridad en Firestore (`firestore.rules`)
Asegúrate de publicar las reglas estrictas de seguridad (Zero Trust) guardadas en `firestore.rules` desde la consola de Firebase o desplegando con Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 3. Operación Diaria y Arranque

### Opción A: Scripts `.bat` (Recomendado en Windows)
```cmd
:: 1. Si los puertos quedaron colgados:
detener-todo.bat

:: 2. Iniciar API y Frontend juntos:
iniciar-todo.bat

:: 3. Verificar estado de dependencias:
verificar-entorno.bat
```

### Opción B: Arranque Manual por Terminales

**Terminal 1 (Backend Express)**:
```bash
cd backend
npm run dev
```
*Servidor iniciado en: `http://localhost:3000/api`*

**Terminal 2 (Frontend React)**:
```bash
cd frontend
npm start
```
*App iniciada en: `http://localhost:3000`*

---

## 4. Telemetría y Analítica por Lotes ($0 Costo en Firestore)

El sistema acumula automáticamente hasta **10 eventos pedagógicos o 30 segundos de inactividad** en el cliente `TelemetryService.js` y realiza un push a dos vías:
1. **Google Tag Manager (`GTM-5RDTRVPK`)**: Disparos sincrónicos en `window.dataLayer.push()`.
2. **Supabase PostgreSQL**: Petición asíncrona `POST /api/tracking/batch` insertando en la tabla `eventos`.

### Taxonomía de los 17 Eventos Soportados:
- `usuario_registrado`, `usuario_inicio_sesion`
- `onboarding_iniciado`, `onboarding_abandonado`, `onboarding_finalizado`
- `leccion_iniciada`, `leccion_abandonada`, `leccion_completada`
- `ejercicio_iniciado`, `ejercicio_abandonado`, `ejercicio_completado`
- `pantalla_visitada`, `progreso_actualizado`, `error_aplicacion`
- `racha_perdida`, `racha_actualizada`, `sesion_finalizada`

---

## 5. Pruebas Automatizadas (Testing Suite)

Para ejecutar las 11 pruebas unitarias del backend (Racha adaptativa, validaciones Zod y Telemetría por Lotes):
```bash
cd backend
npm test
```
*Esperado: `11/11 subtests PASSED (100% pass rate)`.*

---

## 6. Despliegue en Producción

### Frontend (Vercel)
1. Conectar repositorio de GitHub.
2. Build Command: `npm run build`
3. Output Directory: `build`
4. Configurar variables `REACT_APP_*`.

### Backend (Render / GCP)
1. Build Command: `npm install`
2. Start Command: `npm start`
3. Configurar variables `.env` (`NODE_ENV=production`, `CORS_ORIGINS`).
4. El servidor cuenta con **Graceful Shutdown** (`SIGTERM`/`SIGINT`) garantizando despliegues sin caída de peticiones en curso.

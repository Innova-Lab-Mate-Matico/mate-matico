# 🛠️ Guía de Troubleshooting & Resolución de Incidencias — Mate Mático 🧉

Guía rápida de diagnóstico ordenada por **Síntoma ➔ Causa Raíz ➔ Solución Práctica**.

---

## 🔍 Matriz de Diagnóstico en 3 Pasos

1. Ejecutar **`verificar-entorno.bat`** en la raíz del proyecto.
2. Inspeccionar la consola de la terminal del **Backend** para ver logs estructurados en JSON.
3. Abrir la consola del navegador (**F12 ➔ Network / Console**) para verificar respuestas HTTP y eventos en `window.dataLayer`.

---

## 1. Incidencias de Entorno, Red y Puertos

### 🔴 Error `EADDRINUSE: address already in use :::3000`
- **Síntoma:** El backend o el frontend no inician porque el puerto 3000 está ocupado por un proceso previo colgado.
- **Causa:** Quedó una instancia previa de Node.js en ejecución en segundo plano.
- **Solución:**
  Ejecutar el script de limpieza en Windows:
  ```cmd
  detener-todo.bat
  ```
  O liberar manualmente en PowerShell:
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  ```

---

### 🔴 Error de CORS: `Access to fetch at ... has been blocked by CORS policy`
- **Síntoma:** Las peticiones `POST` o `DELETE` desde React hacia la API fallan en el navegador.
- **Causa:** El origen del frontend (ej. `https://mate-matico.vercel.app`) no está incluido en la variable `CORS_ORIGINS` del backend.
- **Solución:**
  En `backend/.env`, agregar el dominio exacto separado por comas:
  ```env
  CORS_ORIGINS=http://localhost:3000,https://mate-matico.vercel.app
  ```
  *(El backend ya incluye soporte nativo para los métodos `GET, POST, PATCH, DELETE, OPTIONS`).*

---

## 2. Autenticación (Firebase Auth)

### 🔴 Error 401 `Unauthorized` al cerrar pestaña o navegar (`flushBeacon`)
- **Síntoma:** Al cerrar la pestaña del navegador, la consola registra un error 401 en la petición de telemetría.
- **Causa:** Uso de `navigator.sendBeacon`, el cual no permite incluir cabeceras HTTP personalizadas como `Authorization: Bearer <token>`.
- **Solución:** *(Ya corregido en `TelemetryService.js`)*. El cliente utiliza `fetch(url, { method: 'POST', keepalive: true, headers: { Authorization: ... } })` garantizando autenticación limpia durante el desmonte de pestaña.

---

### 🔴 Error `auth/configuration-not-found` o `auth/unauthorized-domain`
- **Síntoma:** El login con Google o Email arroja error de configuración en la consola.
- **Causa:** El servicio de Auth no está habilitado en Firebase Console o el dominio `localhost` / `vercel.app` no está autorizado.
- **Solución:**
  1. Ir a [Firebase Console](https://console.firebase.google.com/) ➔ **Authentication** ➔ **Sign-in method** ➔ Activar **Email/Password** y **Google**.
  2. Ir a **Settings** ➔ **Authorized domains** ➔ Agregar `localhost` y tu dominio de Vercel.

---

## 3. Telemetría y Supabase Batching

### 🟡 Advertencia: `[Supabase Warning] Node.js detected without native WebSocket support`
- **Síntoma:** Durante la ejecución de tests unitarios (`npm test`) aparece una advertencia de WebSocket de Supabase.
- **Causa:** Supabase Realtime advierte sobre la ausencia de WebSocket nativo en entornos de test puramente HTTP.
- **Impacto:** **Ninguno (Inofensivo)**. Las inserciones masivas de telemetría en la tabla `eventos` utilizan peticiones HTTP REST POST, por lo que la ingesta funciona al 100%.

---

### 🔴 Error 400 `tipo_evento inválido o no permitido en la whitelist`
- **Síntoma:** La API rechaza una petición de tracking con estado 400.
- **Causa:** El cliente intentó emitir un evento fuera de los 17 eventos permitidos en la lista blanca (`whitelist`) de `tracking.routes.js`.
- **Solución:** Asegurarse de utilizar únicamente los eventos oficiales definidos en la taxonomía (`onboarding_iniciado`, `leccion_abandonada`, `pantalla_visitada`, etc.).

---

## 4. Validaciones de Datos (Zod Schemas)

### 🔴 Error 400 en respuestas de Ejercicios u Onboarding
- **Síntoma:** La API devuelve `{ "success": false, "error": "..." }`.
- **Causa:** El payload enviado no cumple con la estructura Zod definida en `validate.js` (ej. enviar `confianzaMath` como string en lugar de número, o falta de campos obligatorios).
- **Solución:** El backend sanitiza e intenta coercionar tipos automáticamente. Revisa que el cliente envíe los tipos esperados (`number`, `string`, `array`).

---

## 5. Matriz de Códigos HTTP de Respuesta

| HTTP | Significado | Solución Recomendada |
| :--- | :--- | :--- |
| **400** | Petición Malformada (Zod Error) | Verificar campos enviados en el body JSON. |
| **401** | Sesión Expirada / Token Inválido | Renovar token de Firebase Auth o re-iniciar sesión. |
| **403** | Sin Permisos Suficientes | Requiere rol `admin` para acceder al recurso. |
| **404** | Recurso o Usuario No Encontrado | Verificar IDs o registrar el perfil previamente. |
| **413** | Payload Demasiado Grande | El lote de eventos supera los 32KB configurados en el middleware. |
| **429** | Límite de Peticiones Excedido | Esperar la ventana de rate limiting (15 minutos). |
| **500** | Error Interno de Servidor | Revisar logs estructurados en la consola del backend. |

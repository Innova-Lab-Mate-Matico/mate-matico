# 🛡️ Informe de Auditoría de Ciberseguridad (Security Audit) — Mate-Mático Backend
**Clasificación:** Confidencial / Uso Interno para Desarrolladores Backend  
**Autor:** Ingeniero de Ciberseguridad Senior (AppSec / DevSecOps)  
**Fecha:** 24 de Mayo de 2026  

---

## 📌 1. Resumen Ejecutivo
Se ha realizado una auditoría de seguridad exhaustiva del backend de **Mate-Mático** (desarrollado en Node.js, Express y Firebase). Tras analizar el flujo de datos, los controladores y los mecanismos de autenticación y validación de actividades, se han descubierto **vectores de ataque severos**.

El hallazgo más crítico es una **falla lógica grave en la validación de ejercicios** que permite a cualquier usuario malintencionado burlar por completo el motor matemático del juego. Esto posibilita la inyección de respuestas y operandos falsos para obtener **puntajes infinitos, rachas falsas y el estatus de rol avanzado de manera instantánea**, comprometiendo la integridad y competitividad de la plataforma.

A continuación se detallan los hallazgos identificados, clasificados por criticidad, junto con su respectivo plan de remediación y código sugerido para resolverlos.

---

## 🚨 2. Hallazgos Críticos (Vulnerabilidad Alta)

### 2.1. VULN-01: Evasión Completa de Validación de Ejercicios por Confianza en Datos del Cliente
* **Gravedad:** **CRÍTICA** (Impacto directo en la base de datos e integridad del negocio/gamificación).
* **Ubicación:** [backend/src/exercises/registry.js](file:///c:/Users/Jonatan%20Churruarin/Desktop/Mate-Matico/backend/src/exercises/registry.js) (Líneas 80-116) y [backend/src/services/exercise.service.js](file:///c:/Users/Jonatan%20Churruarin/Desktop/Mate-Matico/backend/src/services/exercise.service.js)
* **Descripción de la Falla:**
  En el endpoint `POST /api/exercises/validate`, el backend recibe del cliente un cuerpo (`req.body`) con la siguiente información:
  ```json
  {
    "moduleId": "aritmetica",
    "lessonId": "suma-basica",
    "exerciseId": "suma-num",
    "answer": 10,
    "semilla": 12345,
    "operandos": { "a": 5, "b": 5, "operacion": "suma" }
  }
  ```
  La función `reconstruirEjercicio` en `registry.js` hace lo siguiente:
  1. Si encuentra la plantilla correspondiente al `exerciseId` de esa lección mediante la semilla generada, ejecuta:
     ```javascript
     const respuesta = resolver(operandos ?? ejercicio.operandos);
     ```
     **Falla 1.1:** Utiliza directamente los `operandos` provistos por el cliente (`operandos ?? ejercicio.operandos`). Es decir, si el cliente manda `operandos` adulterados en la petición, el servidor calcula el resultado esperado basándose en la mentira del cliente y NO en lo que el generador determinista del servidor realmente produjo para esa semilla.
  2. Si no encuentra la plantilla (mecanismo de fallback), ejecuta:
     ```javascript
     if (operandos) {
       const respuesta = resolver(operandos);
       return { ... respuestaCorrecta: respuesta, operandos, puntos: 10 };
     }
     ```
     **Falla 1.2:** Se confía ciegamente en cualquier operando enviado por el cliente si no hay plantilla estricta en el catálogo interno, ignorando la verificación de la semilla y la coherencia del ejercicio.

* **Escenario de Explotación (Ataque):**
  Un atacante puede registrarse, obtener un token JWT de Firebase y enviar a `/api/exercises/validate` un JSON modificado:
  ```bash
  curl -X POST http://localhost:3000/api/exercises/validate \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "moduleId": "aritmetica",
      "lessonId": "suma-basica",
      "exerciseId": "suma-num",
      "answer": 0,
      "semilla": 99999,
      "operandos": { "a": 0, "b": 0, "operacion": "suma" }
    }'
  ```
  El servidor ejecutará `resolver({ a: 0, b: 0, operacion: "suma" })`, que resulta en `0`. Comparará con `answer: 0` enviada por el atacante, determinará que es correcta, y le otorgará puntos y rachas reales en Firestore. Automatizando esto en un bucle simple (por ejemplo, con un script de Python o JS de 5 líneas), un usuario puede alcanzar la cima de la tabla de posiciones en segundos.

* **Remediación:**
  1. **Eliminar por completo el bloque de fallback** que acepta `operandos` enviados por el cliente.
  2. En `reconstruirEjercicio`, **NUNCA** priorizar `operandos` del cliente. Los operandos deben ser regenerados estrictamente a partir de la `semilla` y el generador determinista del servidor en base a la configuración formal de la lección.
  3. Validar que la respuesta del cliente (`answer`) se compare **únicamente** contra el resultado computado a partir de los operandos oficiales generados por el servidor utilizando la semilla.
  4. (Opcional) Si por razones de diseño se permite que el cliente envíe los operandos, el servidor **debe generar el ejercicio de forma autónoma usando la semilla** y validar que los operandos del cliente coincidan exactamente campo por campo con los generados por el servidor antes de proceder a resolver.

---

## ⚠️ 3. Hallazgos Medios (Vulnerabilidad Media)

### 3.1. VULN-02: Limitación de Intentos (Rate Limiting) Ineficiente en Producción y Falta de Control en Endpoints Críticos
* **Gravedad:** **MEDIA** (Riesgo de denegación de servicio distribuido [DDoS], abuso de llamadas de API e incremento en costos de Firestore).
* **Ubicación:** [backend/src/middleware/security.js](file:///c:/Users/Jonatan%20Churruarin/Desktop/Mate-Matico/backend/src/middleware/security.js) (Líneas 6-12, 35)
* **Descripción de la Falla:**
  1. La aplicación utiliza `express-rate-limit` con su almacenamiento por defecto en memoria del proceso (`MemoryStore`):
     ```javascript
     const authLimiter = rateLimit({
       windowMs: 15 * 60 * 1000,
       max: env.isProduction ? 20 : 100,
       ...
     });
     ```
     En un entorno de producción moderno (despliegue horizontal en múltiples contenedores, clusters de Node, Kubernetes o plataformas Serverless), el estado en memoria no se comparte. Cada contenedor lleva su propia cuenta. Un atacante puede hacer un ataque distribuido o simplemente alternar solicitudes a través de diferentes instancias para evadir la restricción.
  2. El limitador **solo se aplica** a las rutas de `/api/auth`. El endpoint más crítico del juego (`POST /api/exercises/validate`), el cual realiza operaciones de lectura y escritura intensivas en Firestore (`db.collection('registroIntentos').add(...)`, `updateLessonProgress(...)`), **no tiene limitación de peticiones (rate limiting)**. Esto permite ataques de denegación de servicio financiero o farmear bases de datos masivamente.

* **Remediación:**
  1. Configurar un almacenamiento centralizado e independiente para el rate limiter utilizando **Redis** (`rate-limit-redis`) en entornos de producción.
  2. Implementar un rate limit específico y moderado para el endpoint de validación de ejercicios (por ejemplo, máximo 30 solicitudes de validación por minuto por IP/Usuario) para impedir el abuso automatizado de scripts.

---

## 🔒 4. Hallazgos Bajos y de Endurecimiento (Hardening)

### 4.1. VULN-03: Exposición de Secretos y Violación de Principio de Menor Privilegio en Firebase Admin SDK
* **Gravedad:** **BAJA / DE DISEÑO** (Riesgo de compromiso total de la infraestructura en la nube).
* **Ubicación:** [backend/src/config/firebase.js](file:///c:/Users/Jonatan%20Churruarin/Desktop/Mate-Matico/backend/src/config/firebase.js)
* **Descripción de la Falla:**
  El backend utiliza una Service Account completa inicializada mediante `admin.credential.cert(...)`. Las Service Accounts de Firebase Admin generadas por defecto en la consola tienen privilegios de **Administrador / Propietario de Proyecto** en Google Cloud y Firebase.
  Si el servidor del backend sufre un compromiso por ejecución remota de código (RCE) o fuga de variables de entorno, el atacante obtendrá acceso absoluto de borrado, lectura y escritura de toda la base de datos de producción (Auth, Firestore, Storage, etc.).

* **Remediación:**
  1. En producción, crear un **Rol de IAM personalizado** en Google Cloud para la Service Account utilizada por el backend.
  2. El rol debe estar estrictamente acotado y poseer solo los siguientes permisos necesarios:
     * `Firebase Authentication Admin` (para verificar y gestionar tokens).
     * `Cloud Datastore User` (para lectura/escritura en la base de datos de Firestore).
  3. Bloquear o eliminar permisos de propietario/editor del proyecto GCP en la Service Account.

### 4.2. VULN-04: Ausencia de Límites de Tamaño Máximo (Max Length) en Validaciones de Entrada
* **Gravedad:** **BAJA** (Riesgo de agotamiento de memoria del proceso / ReDoS / Consumo excesivo).
* **Ubicación:** [backend/src/middleware/validate.js](file:///c:/Users/Jonatan%20Churruarin/Desktop/Mate-Matico/backend/src/middleware/validate.js)
* **Descripción de la Falla:**
  La función `validateRegisterBody` y `validateLoginBody` comprueba la estructura del email usando un RegEx (`EMAIL_RE.test(email)`). Sin embargo, no hay límites de longitud máxima explícita para la cadena de texto de `email` ni de `password` (solo se comprueba el mínimo).
  Un atacante puede enviar un email o nombre de usuario de 10 megabytes de texto. Express intentará parsear este JSON en memoria, consumiendo recursos valiosos del procesador y memoria antes de llegar a la validación, pudiendo provocar una caída del servidor (DoS por consumo de memoria / RegEx Catastrófico).

* **Remediación:**
  1. Validar que la longitud máxima del email no supere los **254 caracteres** (conforme al estándar RFC 5321).
  2. Validar que la contraseña tenga un rango aceptable (ejemplo, entre 6 y 128 caracteres) para evitar hashes excesivamente costosos de procesar y prevenir ataques por consumo de CPU.

---

## 📝 5. Plan de Acción y Lista de Tareas (TODO Checklist para el Equipo Backend)

Para guiar a los desarrolladores backend en la implementación de las correcciones de seguridad, se ha definido la siguiente hoja de ruta crítica:

- [ ] **[CRÍTICO] Tarea 1: Refactorizar `reconstruirEjercicio` en `backend/src/exercises/registry.js`**
  * *Acción:* Eliminar el bloque de fallback que confía en `operandos` del cliente.
  * *Acción:* Reconstruir el ejercicio **exclusivamente** con la `semilla` y el generador determinista del servidor.
  * *Acción:* Verificar que si el cliente provee `operandos`, estos coincidan estrictamente con los generados de manera determinista por el servidor. Si no coinciden, rechazar inmediatamente el ejercicio.

- [ ] **[CRÍTICO] Tarea 2: Sanitizar `validarEjercicio` en `backend/src/services/exercise.service.js`**
  * *Acción:* Garantizar que no exista ninguna vía alternativa que permita evadir la regeneración determinista.

- [ ] **[MEDIO] Tarea 3: Migrar a Redis para Rate Limiting**
  * *Acción:* Instalar `rate-limit-redis` y configurar un servidor Redis para centralizar el conteo de peticiones.
  * *Acción:* Asegurar que la configuración funcione correctamente detrás de proxys inversos (e.g., Nginx, Heroku, Cloudflare) habilitando `app.set('trust proxy', 1)`.

- [ ] **[MEDIO] Tarea 4: Proteger endpoint `/api/exercises/validate`**
  * *Acción:* Implementar un rate limiter dedicado para este endpoint (máximo 30 peticiones/minuto por usuario autenticado).

- [ ] **[PREVENTIVO] Tarea 5: Hardening de Inputs de Entrada**
  * *Acción:* Actualizar `backend/src/middleware/validate.js` para añadir controles de tamaño máximo (`email <= 254`, `displayName <= 80`, `password <= 128`).

- [ ] **[PREVENTIVO] Tarea 6: Hardening de IAM Credentials**
  * *Acción:* Generar una Service Account dedicada en Google Cloud Console con el principio de menor privilegio (Least Privilege) para el ambiente de Staging y Producción.

---

## 💻 6. Código de Remediación Sugerido (Ejemplos Prácticos)

### 6.1. Solución Propuesta para `backend/src/exercises/registry.js`
Reemplazar la función `reconstruirEjercicio` para asegurar una validación 100% segura basada únicamente en el servidor y su semilla determinista:

```javascript
export function reconstruirEjercicio(moduleId, lessonId, exerciseId, semilla, operandos) {
  const tipos = LECCION_GENERADORES[moduleId]?.[lessonId] ?? [];
  const generar = GENERADORES_MODULO[moduleId];
  const resolver = RESOLVERS_MODULO[moduleId];

  if (!generar || !resolver) return null;

  // Buscar el tipo de ejercicio en la lección y regenerarlo de forma idéntica
  for (const tipo of tipos) {
    const ejercicio = generar(tipo, semilla);
    if (ejercicio?.id !== exerciseId) continue;

    // VALIDACIÓN ESTRICTA DE OPERANDOS (Si el cliente los envía, deben coincidir exactamente con los del servidor)
    if (operandos) {
      const matchA = Number(operandos.a) === Number(ejercicio.operandos.a);
      const matchB = Number(operandos.b) === Number(ejercicio.operandos.b);
      const matchOp = String(operandos.operacion).trim() === String(ejercicio.operandos.operacion).trim();

      if (!matchA || !matchB || !matchOp) {
        console.warn(`[SECURITY WARNING] Operandos adulterados detectados para usuario. Ejercicio esperado:`, ejercicio.operandos, `Recibido:`, operandos);
        return null; // Rechazar validación por discrepancia de datos
      }
    }

    // Calcular el resultado correcto de forma segura en memoria a partir de los operandos del servidor
    const respuesta = resolver(ejercicio.operandos);
    return {
      ...ejercicio,
      respuestaCorrecta: respuesta ?? ejercicio.respuestaCorrecta,
    };
  }

  // ELIMINADO EL FALLBACK QUE CONFÍA EN CLIENTE
  console.warn(`[SECURITY ALERT] Intento de validar ejercicio no registrado o sin plantilla válida. ID: ${exerciseId}, Semilla: ${semilla}`);
  return null;
}
```

### 6.2. Solución Propuesta para `backend/src/middleware/validate.js`
Añadir validación estricta de límites de tamaño a los inputs de registro para mitigar ataques por desbordamiento de memoria:

```javascript
export function validateRegisterBody(req, res, next) {
  const { email, password, displayName } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email y contraseña son obligatorios',
    });
  }

  const emailStr = String(email).trim();
  if (emailStr.length > 254) {
    return res.status(400).json({
      success: false,
      error: 'El email no puede superar los 254 caracteres',
    });
  }

  if (!EMAIL_RE.test(emailStr)) {
    return res.status(400).json({ success: false, error: 'Email inválido' });
  }

  const passStr = String(password);
  if (passStr.length < 6 || passStr.length > 128) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener entre 6 y 128 caracteres',
    });
  }

  if (displayName && String(displayName).length > 80) {
    return res.status(400).json({
      success: false,
      error: 'El nombre no puede superar 80 caracteres',
    });
  }

  next();
}
```

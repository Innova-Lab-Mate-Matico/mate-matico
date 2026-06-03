# Mate-Mático API

API REST desacoplada del frontend. Colección principal de usuarios: **`usuarios`**.

**Base URL (desarrollo):** `http://localhost:3000/api`  
**Base URL (producción):** `https://mate-matico-backend.onrender.com/api`


## Autenticación

```
Authorization: Bearer <idToken>
```

### Flujo recomendado

1. Firebase Auth en el cliente (email o Google).
2. `POST /api/auth/google` si usás Google (sincroniza perfil gamificado).
3. Todas las rutas protegidas con `Authorization: Bearer ${idToken}`.

---

## Endpoints

### Salud

| Método | Ruta | Auth |
|--------|------|------|
| `GET` | `/health` | No |

---

### Autenticación — `/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Registro email/password |
| `POST` | `/auth/login` | No | Login email/password |
| `POST` | `/auth/google` | No | Login Google + perfil en `usuarios` |
| `GET` | `/auth/me` | Sí | Perfil gamificado |

#### Perfil en `usuarios` (campos clave)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `puntosTotales` | number | Puntos acumulados |
| `rachaDias` | number | Racha actual en días |
| `recordRacha` | number | Mejor racha histórica |
| `rolActual` | string | `principiante` \| `intermedio` \| `avanzado` |
| `ultimaLeccionCompletada` | timestamp | Última actividad en lección |

**Roles (outfit de Mate-Matico):**

- `principiante` — guardapolvo blanco
- `intermedio` — profesor de secundaria
- `avanzado` — toga y birrete

#### `POST /auth/register` — respuesta 201

```json
{
  "success": true,
  "usuario": {
    "uid", "email", "displayName",
    "puntosTotales": 0,
    "rachaDias": 0,
    "recordRacha": 0,
    "rolActual": "principiante",
    "ultimaLeccionCompletada": null
  },
  "idToken": "...",
  "refreshToken": "...",
  "expiresIn": "3600"
}
```

#### `POST /auth/google`

```json
{ "idToken": "<Firebase ID token>" }
```

```json
{
  "success": true,
  "idToken": "...",
  "usuario": { ... },
  "esNuevo": true
}
```

#### `GET /auth/me`

```json
{
  "success": true,
  "usuario": {
    "uid", "email", "displayName", "photoURL", "provider",
    "puntosTotales", "rachaDias", "recordRacha", "rolActual",
    "ultimaLeccionCompletada", "createdAt"
  }
}
```

---

### Onboarding Adaptativo — `/onboarding` (protegido)

Endpoints para guardar las respuestas de la encuesta inicial y calcular la recomendación del primer módulo de aprendizaje (Hito 1).

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/onboarding` | Sí | Guarda respuestas en Firestore, calcula recomendación y finaliza onboarding |
| `POST` | `/onboarding/recomendar` | Sí | Simula/pre-visualiza la recomendación del motor sin guardar cambios en base de datos |

#### Payload de Entrada Obligatorio (JSON)

```json
{
  "confianzaMath": 4,
  "intereses": ["ahorro", "finanzas"],
  "edad": 20,
  "nivelEducativo": "secundaria",
  "objetivo": "Aprender a calcular porcentajes y ahorrar en mi vida cotidiana"
}
```

*   **`confianzaMath`**: **(Obligatorio)** Número entero entre `1` (muy baja) y `5` (muy alta).
*   **`intereses`**: **(Obligatorio)** Array de strings no vacío. Máximo 10 etiquetas (tags). Cada tag debe ser un texto no vacío.
*   **`edad`**: *(Opcional)* Número entero entre `5` y `120`.
*   **`nivelEducativo`**: *(Opcional)* String controlado. Debe ser exactamente uno de: `primaria`, `secundaria`, `terciaria`, `universitaria`, `ninguno`.
*   **`objetivo`**: *(Opcional)* String de texto descriptivo. Máximo 500 caracteres.

#### Respuesta `POST /onboarding` — exitoso (200)

Calcula la sugerencia y actualiza el campo `onboarding` del perfil de usuario en Firestore marcándolo como completado. Retorna el usuario serializado con su nuevo estado.

```json
{
  "success": true,
  "usuario": {
    "uid": "test-usuario-onboarding",
    "email": "alumno@inova.edu.ar",
    "displayName": "Alumno Test",
    "photoURL": null,
    "provider": "password",
    "puntosTotales": 0,
    "rachaDias": 0,
    "recordRacha": 0,
    "rolActual": "principiante",
    "ultimaLeccionCompletada": null,
    "createdAt": "2026-05-30T13:31:55.377Z",
    "onboarding": {
      "completado": true,
      "edad": 20,
      "nivelEducativo": "secundaria",
      "objetivo": "Aprender a calcular porcentajes y ahorrar en mi vida cotidiana",
      "confianzaMath": 4,
      "intereses": ["ahorro", "finanzas"],
      "moduloRecomendado": "porcentajes"
    }
  }
}
```

#### Respuesta `POST /onboarding/recomendar` — exitoso (200)

Endpoint consultivo e idempotente. Procesa las respuestas de la misma forma que el motor de recomendación, pero **no realiza ninguna escritura** en Firestore. Útil para pre-visualizar sugerencias antes de enviar la encuesta final.

```json
{
  "success": true,
  "moduloRecomendado": "porcentajes"
}
```

#### Reglas del Motor de Recomendación (Cálculo determinista)
1.  **Aritmética Básica (`aritmetica`):** Si la confianza matemática (`confianzaMath`) es `1` o `2` (independientemente del resto de datos).
2.  **Porcentajes (`porcentajes`):** Si la confianza es aceptable (`>= 3`) e incluye intereses prácticos/financieros (`descuentos`, `finanzas`, `negocios`, `ahorro`, `compras`, `porcentajes`).
3.  **Porcentajes (`porcentajes`):** Si la confianza es aceptable (`>= 3`) y el usuario es adulto (`edad >= 18`) o posee nivel educativo secundario, terciario o universitario.
4.  **Aritmética Básica (`aritmetica`):** Por defecto (para perfiles infantiles o casos dudosos fuera de reglas).

---

### Módulos — `/modules` (público, ejercicios dinámicos)

| Método | Ruta | Auth |
|--------|------|------|
| `GET` | `/modules` | No |
| `GET` | `/modules/:moduleId` | No |
| `GET` | `/modules/:moduleId/lessons/:lessonId` | No |

Los ejercicios se **generan al vuelo** con `Math.random()` y semilla determinista. No incluyen la respuesta correcta.

#### `GET /modules` — respuesta

```json
{
  "success": true,
  "modulos": [
    {
      "id": "aritmetica",
      "title": "Base aritmética",
      "description": "...",
      "rolSugerido": "principiante",
      "levelCount": 2
    }
  ]
}
```

#### `GET /modules/:moduleId` — respuesta

```json
{
  "success": true,
  "modulo": {
    "id": "aritmetica",
    "title": "...",
    "semillaSesion": 482910,
    "levels": [
      {
        "id": "nivel-1",
        "lessons": [
          {
            "id": "suma-basica",
            "title": "Suma básica",
            "ejercicios": [
              {
                "id": "suma-mc",
                "tipo": "multiple_choice",
                "enunciado": "¿Cuánto es 12 + 8?",
                "opciones": ["18", "20", "22", "24"],
                "operandos": { "a": 12, "b": 8, "operacion": "suma" },
                "semilla": 482910,
                "puntos": 10
              }
            ]
          }
        ]
      }
    ]
  }
}
```

#### `GET /modules/:moduleId/lessons/:lessonId?semilla=482910`

Misma estructura de `ejercicios` con semilla opcional para reproducir la sesión.

---

### Progreso — `/progress` (protegido)

| Método | Ruta | Auth |
|--------|------|------|
| `GET` | `/progress` | Sí |
| `PATCH` | `/progress/:moduleId` | Sí |

#### `GET /progress`

```json
{
  "success": true,
  "progreso": { "modulos": { ... } },
  "gamificacion": {
    "puntosTotales": 30,
    "rachaDias": 2,
    "recordRacha": 5,
    "rolActual": "principiante"
  }
}
```

#### `PATCH /progress/:moduleId`

```json
{
  "lessonId": "suma-basica",
  "completada": true,
  "puntaje": 25
}
```

---

### Ejercicios — `/exercises` (protegido)

| Método | Ruta | Auth |
|--------|------|------|
| `POST` | `/exercises/validate` | Sí |

**Reglas:** sin vidas, reintentos ilimitados, no se restan puntos por error.

#### Body obligatorio

```json
{
  "moduleId": "aritmetica",
  "lessonId": "suma-basica",
  "exerciseId": "suma-mc",
  "answer": "20",
  "semilla": 482910,
  "operandos": { "a": 12, "b": 8, "operacion": "suma" }
}
```

El front **debe reenviar** `semilla` y `operandos` tal como los recibió al cargar la lección.

#### Respuesta — correcto

```json
{
  "success": true,
  "correcto": true,
  "puntosGanados": 10,
  "rolActual": "principiante",
  "rolSubio": false,
  "puntosTotales": 10,
  "rachaDias": 1,
  "recordRacha": 1
}
```

#### Respuesta — incorrecto

```json
{
  "success": true,
  "correcto": false,
  "puntosGanados": 0,
  "explicacionError": "Sumá paso a paso: 12 + 8 = 20.",
  "habilitarComodin": true,
  "comodinPista": "Pista de Mate-Matico: empezá sumando las unidades.",
  "rolActual": "principiante"
}
```

Tras **2 errores seguidos** en el mismo ejercicio → `habilitarComodin: true`.

---

## Rachas

- Mismo día: mantiene racha.
- Día nuevo dentro de 48 h desde `ultimaLeccionCompletada`: `rachaDias++`.
- Más de 48 h: racha se reinicia a 1; si la racha anterior era récord, actualiza `recordRacha`.

---

## CORS

Variable `CORS_ORIGINS` en `backend/.env`:

```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## Ejemplo completo (validar ejercicio)

```javascript
const API = 'http://localhost:3000/api';

const res = await fetch(`${API}/exercises/validate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    moduleId: 'aritmetica',
    lessonId: 'suma-basica',
    exerciseId: 'suma-mc',
    answer: '20',
    semilla: 482910,
    operandos: { a: 12, b: 8, operacion: 'suma' },
  }),
});

const data = await res.json();
if (data.habilitarComodin) {
  // Mostrar pista del termo en UI
}
```

---

## Secretos

| Variable | Backend | Frontend |
|----------|---------|----------|
| `FIREBASE_PRIVATE_KEY` | Sí | Nunca |
| `FIREBASE_WEB_API_KEY` | Sí | Sí (`VITE_FIREBASE_API_KEY`) |
| `FIREBASE_PROJECT_ID` | Sí | Sí |

---

## Seed Firestore

```bash
cd backend && npm run seed
```

Crea colecciones `modulos` y `plantillasEjercicio` (explicaciones y comodines).

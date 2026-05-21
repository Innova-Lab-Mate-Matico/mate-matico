# Mate-Mático API

API REST desacoplada del frontend. Colección principal de usuarios: **`usuarios`**.

**Base URL (desarrollo):** `http://localhost:3000/api`

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

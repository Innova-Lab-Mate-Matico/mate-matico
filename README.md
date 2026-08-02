# 🧉 Mate Mático — Monorepo (Producción & MVP)

Plataforma educativa de matemáticas adaptativa y gamificada orientada a finanzas personales y uso cotidiano, construida con React, Node.js/Express, Firebase Auth, Supabase PostgreSQL y Google Tag Manager / GA4.

---

## 🏗️ Arquitectura del Monorepo

| Carpeta | Tecnología | Descripción |
| :--- | :--- | :--- |
| **`backend/`** | Node.js + Express + Zod + Firebase Admin + Supabase | API RESTful con validación declarativa, logging estructurado JSON, Graceful Shutdown y batching de telemetría. |
| **`frontend/`** | React + Vanilla CSS + GTM (`GTM-5RDTRVPK`) | Aplicación SPA gamificada, responsiva (Mobile & Desktop) con telemetría en tiempo real y soporte offline/beacon. |
| **`docs/`** | Markdown | Documentación completa de operación, arquitectura, auditoría de seguridad y troubleshooting. |
**`documentos/`** | Python + SQL Server + R Studio + Google Analytics | Pipeline ETL de extracción, auditoría de integridad de datos (100% de coincidencia), análisis estadístico, informes técnicos y reportes ejecutivos.
---

## 📚 Índice de Documentación (`docs/`)

| Documento | Descripción / Propósito |
| :--- | :--- |
| 🚀 **[docs/RUNBOOK.md](docs/RUNBOOK.md)** | Guía paso a paso para instalación, inicio rápido, variables de entorno, scripts `.bat` y operación diaria. |
| 🛠️ **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** | Guía de diagnóstico rápido (Síntoma → Causa → Solución) para errores de red, Auth, backend y base de datos. |
| 🏛️ **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)** | Especificación técnica de módulos, flujos de datos, batching de telemetría y diseño del sistema. |
| 📑 **[backend/API.md](backend/API.md)** | Referencia detallada de endpoints RESTful, contratos de petición/respuesta y esquemas Zod. |
| 🛡️ **[firestore.rules](firestore.rules)** | Reglas estrictas de seguridad (Zero Trust) para Firestore Database. |

---

## 🚀 Inicio Rápido (Desarrollo en Windows)

### 1. Requisitos Previos
- **Node.js 18+ LTS** instalado.
- Proyecto activo en **Firebase Console** (Auth + Firestore).
- Proyecto activo en **Supabase** (para telemetría y analítica por lotes).

### 2. Variables de Entorno
Copia los archivos `.env.example` y completa las credenciales:
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

### 3. Ejecución Automática con Scripts `.bat`
```cmd
:: 1. Liberar puertos si estaban ocupados
detener-todo.bat

:: 2. Iniciar Backend (Puerto 3000) y Frontend (Puerto 3000/3001)
iniciar-todo.bat

:: 3. Verificar estado de dependencias y servicios
verificar-entorno.bat
```

---

## 🌐 URLs de Operación

| Servicio | Entorno Local | Descripción |
| :--- | :--- | :--- |
| **Frontend App** | `http://localhost:3001` | Interfaz React de usuario / estudiante. |
| **Backend API** | `http://localhost:3000/api` | Servidor Express REST. |
| **Health Check** | `http://localhost:3000/api/health` | Estado del servidor y bases de datos. |

---

## 🧪 Pruebas y Verificación

Para ejecutar la suite de pruebas unitarias automatizadas del backend (11/11 subtests):
```bash
cd backend
npm test
```

Para verificar la compilación de producción del frontend:
```bash
cd frontend
npm run build
```

---

## 👥 Créditos y Autores
Desarrollado con ❤️ por **Innova Lab — Mate Mático** (2026).

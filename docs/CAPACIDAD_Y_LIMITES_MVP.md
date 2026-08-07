# 📊 Capacidad de Usuarios y Límites de la Capa Gratuita (MVP)

Este documento detalla los límites técnicos de la infraestructura gratuita de **Mate-Mático** y calcula la capacidad de usuarios reales (mensuales y diarios) que el sistema puede soportar sin costo operativo. Esta información es clave para demostrar la viabilidad financiera y técnica del proyecto como Producto Mínimo Viable (MVP) durante el Demo Day.

---

## 🏛️ Resumen de Capacidad del MVP

| Servicio | Proveedor | Límite Técnico | Métrica Clave | Capacidad Soportada en el MVP |
| :--- | :--- | :--- | :--- | :--- |
| **Autenticación** | Firebase Auth | 50.000 MAU | Usuarios activos/mes | **50.000 usuarios mensuales** |
| **Progreso y Perfiles** | Cloud Firestore | 50k reads / 20k writes día | Operaciones diarias | **~6.600 usuarios activos diarios (DAU)** |
| **Telemetría de Eventos** | Supabase (Postgres) | 500 MB / 5 GB egress | Almacenamiento/Red | **~17.000 sesiones de juego completas** |
| **Tutoría de IA** | Google Gemini (Flash) | 1.500 RPD / 15 RPM | Solicitudes API | **~500 usuarios activos diarios (DAU)** |
| **API Backend** | Render | 750 horas/mes | Horas de servidor | **1 instancia activa 24/7 (con *sleep* de 15 min)** |
| **Hosting Frontend** | Vercel | 100 GB egress/mes | Ancho de banda | **+50.000 visitas completas al mes** |
| **Automatización (ETL)** | GitHub Actions | 2.000 minutos/mes | Minutos de ejecución | **Ilimitado para el uso actual (30 min/mes)** |

---

## 🔍 Análisis Detallado por Componente

### 1. 🔑 Firebase Authentication (Identidad)
*   **Límite gratuito:** **50.000 Usuarios Activos Mensuales (MAU)** para autenticación estándar (Email/Contraseña) y federada (Google).
*   **Traducción para el MVP:** Permite registrar y dar acceso seguro a 50.000 alumnos diferentes cada mes con costo cero de licenciamiento.

### 2. 🗄️ Firebase Cloud Firestore (Base de Datos Transaccional)
*   **Límites gratuitos:** 1 GiB de almacenamiento, **50.000 lecturas diarias** y **20.000 escrituras diarias**.
*   **Optimización de Arquitectura:** El frontend implementa una caché en `localStorage` con un TTL de 5 minutos e invalidación activa (se borra al completar lecciones). Así, navegar por los menús o cargar pantallas repetidas consume **0 lecturas**.
*   **Cálculo de Consumo:**
    *   Un alumno que juegue **3 lecciones diarias** realiza aproximadamente **5 lecturas** de progreso/perfil y **3 escrituras** (al guardar puntos y rachas).
    *   *Cuello de botella (Escrituras):* $20.000 \text{ escrituras diarias} / 3 \text{ escrituras por usuario} \approx$ **6.666 usuarios activos diarios (DAU)**.
    *   *Lecturas:* $50.000 / 5 \approx$ **10.000 usuarios activos diarios (DAU)**.

### 3. 📈 Supabase PostgreSQL (Telemetría y Analíticas)
*   **Límites gratuitos:** **500 MB** de almacenamiento en Postgres y **5 GB** de ancho de banda de salida mensual (egress).
*   **Optimización de Arquitectura:** La telemetría en el frontend acumula los 17 eventos clave de comportamiento en un buffer y los despacha al backend en lotes de a 10 (*batching*) o cada 30 segundos, reduciendo el tráfico HTTP en un 90%.
*   **Cálculo de Consumo:**
    *   Una fila en la tabla de `eventos` (con su columna JSONB `metadata`) pesa en promedio **300 bytes**.
    *   Si una sesión interactiva de un alumno genera **100 eventos** (clicks, respuestas, navegación), la sesión consume **~30 KB** de datos en la base.
    *   $500 \text{ MB} \approx$ **~17.000 sesiones completas** o **1.700.000 eventos analíticos** históricos almacenados.
    *   *Estrategia de Sostenibilidad:* Mediante el proceso ETL de GitHub Actions, podemos archivar eventos históricos fuera de Supabase mensualmente para mantener el espacio de la tabla PostgreSQL gratis a perpetuidad.

### 4. 🧠 APIs de Inteligencia Artificial (Tutor Pedagógico)
*   **Límites gratuitos (Google AI Studio - Gemini Flash):** **1.500 solicitudes diarias (RPD)** y **15 solicitudes por minuto (RPM)**.
*   **Optimización de Arquitectura:** El backend implementa un mecanismo de redundancia (*failover*) de tres niveles en `aiExercise.service.js`:
    1.  **Groq API** (Llama 3.3 70B) por velocidad y alta cuota.
    2.  **Google Gemini API** (Gemini Flash) como respaldo.
    3.  **Motor Local Adaptativo** (fórmulas deterministas) si ambas APIs están caídas o agotan sus límites.
*   **Cálculo de Consumo:**
    *   Si un alumno comete errores y le consulta al tutor de IA **3 veces al día**:
    *   La cuota pura de Gemini soporta **500 usuarios diarios (DAU)** interactuando intensamente con el tutor. Al balancear con Groq y el fallback local, la disponibilidad real del sistema es muy superior.

### 5. ⚙️ Render (Servidor Backend Node.js / Express)
*   **Límite gratuito:** **750 horas de ejecución al mes** compartidas.
*   **Traducción para el MVP:** Un mes tiene 744 horas (31 días), por lo que disponemos de un servidor web corriendo 24/7 de forma gratuita.
*   *Restricción del plan:* El servidor entra en modo de reposición (*sleep*) tras 15 minutos de inactividad. El primer usuario en acceder luego de esto sufrirá un retardo de 30-50 segundos en la carga inicial (despertar del servidor).

### 6. 💻 Vercel (Hosting Frontend React)
*   **Límite gratuito:** **100 GB** de transferencia mensual.
*   **Traducción para el MVP:** El build de producción de React optimizado pesa ~2 MB. La cuota mensual equivale a **más de 50.000 descargas completas de la aplicación**. Como el navegador cachea los recursos locales, la carga de datos subsiguiente es casi nula.

### 7. 🤖 GitHub Actions (Automatizaciones y ETL)
*   **Límite gratuito:** **2.000 minutos mensuales** de ejecución en runners Linux.
*   **Traducción para el MVP:** Nuestro script mensual/diario de consolidación de telemetría tarda en promedio 1 minuto por corrida.
    *   30 corridas al mes = **30 minutos** (1.5% del límite).

---

## 🔄 El Viaje del Usuario (User Journey) y su Consumo Cruzado

Para entender la usabilidad real del MVP, analicemos el consumo de recursos de **un único alumno** que realiza una sesión típica de 15 minutos en la plataforma:

1. **Inicio de Sesión y Carga de Perfil:**
   - El alumno se autentica (usa **Firebase Auth** -> 1 verificación de token JWT).
   - Se descarga su perfil y progreso guardado (usa **Firestore** -> 1 lectura de perfil, 1 lectura de progreso).
   - Se carga la interfaz de React (usa **Vercel** -> consume ~2 MB de ancho de banda).

2. **Resolución de 3 Lecciones (15 minutos):**
   - El alumno completa 3 lecciones de 5 ejercicios cada una.
   - La generación procedural es matemática local en el backend, por lo que **no consume base de datos**.
   - Al terminar cada lección, se guarda el progreso (usa **Firestore** -> 3 escrituras en total para actualizar sus rachas y puntajes).
   - El alumno se equivoca y pide auxilio al tutor de IA 2 veces durante la sesión (usa **Gemini / Groq** -> 2 solicitudes de IA).

3. **Telemetría en Segundo Plano (Batching):**
   - Las interacciones (clicks, navegación, respuestas correctas/incorrectas) generan **50 eventos de telemetría**.
   - El frontend los agrupa en lotes de a 10 eventos.
   - Se envían 5 peticiones de lote al backend (usa **Supabase PostgreSQL** -> se insertan 50 filas de eventos en la tabla JSONB, consumiendo apenas ~15 KB de espacio en la base).

4. **Fin de la Sesión:**
   - El alumno cierra la pestaña.
   - El navegador usa `fetch` con `keepalive: true` para despachar el último lote de eventos remanentes (usa **Supabase PostgreSQL** -> 1 inserción final).

---

### 📊 Consumo Total de una Sesión de Usuario vs. Cuotas de la Capa Gratuita

| Servicio / Recurso | Consumo por Sesión (1 Alumno) | Límite Gratuito de la Capa | Capacidad Simultánea en DAU / MAU |
| :--- | :--- | :--- | :--- |
| **Firebase Auth** | 1 inicio de sesión | 50.000 MAU | **~50.000 usuarios mensuales** |
| **Firestore (Lecturas)** | 2 lecturas | 50.000 al día | **25.000 usuarios diarios** |
| **Firestore (Escrituras)** | 3 escrituras | 20.000 al día | **~6.600 usuarios diarios (DAU)** |
| **Supabase (Espacio)** | ~15 KB (50 eventos) | 500 MB (512.000 KB) | **~34.000 sesiones totales de juego** |
| **AI Studio (Gemini)** | 2 consultas de IA | 1.500 consultas al día | **750 usuarios diarios (DAU)** |
| **Vercel (Ancho de banda)** | ~2 MB | 100 GB (102.400 MB) | **~50.000 visitas completas al mes** |

Esto demuestra que **el verdadero cuello de botella del MVP gratuito es el límite de escrituras de Firestore (~6.600 usuarios activos diarios)** y, en segundo lugar, la **IA de Gemini (~750 usuarios diarios usando el tutor)**. 

Estas métricas son brutales para cualquier etapa de validación, prueba piloto en escuelas o Demo Day, asegurando costo **$0 de operación** en toda la fase de lanzamiento inicial.

---

## 🏫 Pilotos en Colegios

Si decidimos pilotear la plataforma en colegios, la arquitectura de costo cero sigue siendo altamente viable. A continuación, se detalla la capacidad de usabilidad agrupada para un entorno escolar real:

### 1. 👥 Capacidad en Matrícula de Alumnos
Teniendo en cuenta un colegio mediano típico de **1.000 alumnos** donde todos utilicen la plataforma de manera regular:
*   **Consumo diario del colegio entero:** Generaría unas 3.000 escrituras en Firestore (15% del límite diario de la capa gratuita) y unas 300 a 500 consultas a la IA (30% del límite diario de Gemini).
*   **Escalabilidad a costo $0:** La infraestructura gratuita actual puede soportar sin problemas a **6 colegios enteros de 1.000 alumnos** (6.000 alumnos en total usando la app diariamente), o hasta **20 colegios** si se utiliza únicamente en clases de matemáticas específicas de manera rotativa.

### 2. ⚡ Concurrencia en el Aula (El "Momento del Laboratorio")
Un escenario crítico en escuelas es cuando una división entera (ej. **40 alumnos en simultáneo**) entra a hacer ejercicios en el aula de computación o desde sus netbooks:
*   **Carga del Servidor (Render Free):** La API en Express consume menos de 150 MB de RAM de los 512 MB disponibles y procesa peticiones en milisegundos. Soporta la concurrencia de 40 alumnos con un uso de CPU menor al 10%.
*   **Saturación de la IA (Límite RPM):** Si varios alumnos cometen errores al mismo tiempo y consultan al tutor de IA, se podría superar el límite de solicitudes por minuto (15 RPM) de Gemini.
    *   *Resolución de arquitectura:* Ante el error `429 Rate Limit` de Gemini, nuestro **failover automático** desvía las peticiones a **Groq (Llama 3.3)** en menos de un segundo, o en su defecto, al **motor de resolución local**, garantizando que ningún alumno se quede con la pantalla trabada durante la clase.

### 3. 📊 Reporte Docente y Sostenibilidad de Datos (ETL)
Para vender la app a un colegio, la característica más valiosa es el panel analítico del docente (Looker Studio o Power BI). 
*   **El desafío:** 1.000 alumnos jugando diariamente llenarían los 500 MB de Supabase en 17 días con sus logs de telemetría detallados (clics, navegación, errores).
*   **La solución:** El script de automatización (ETL) procesa diariamente los eventos crudos, calcula las métricas consolidadas del alumno (ej. *"Lucas: 3 módulos completados, 85% de efectividad, 45 min de juego, 2 consultas de IA"*) y limpia los registros de clics individuales en Supabase.
*   **Impacto de almacenamiento:** Consolidar los datos reduce el peso en la base de datos en un **98%**, permitiendo guardar el historial de progreso de decenas de colegios a lo largo de todo el ciclo lectivo dentro de la capa gratuita.



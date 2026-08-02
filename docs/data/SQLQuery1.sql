USE FINAL_PASANTIA
GO 
-- =====================================================
-- 1. TABLA USUARIOS (Limpia y sincronizada con el CSV)
-- =====================================================
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
    id_documento VARCHAR(MAX),
    uid VARCHAR(MAX),
    email VARCHAR(MAX),
    nombre VARCHAR(MAX),
    fecha_registro VARCHAR(MAX),
    nivel_actual VARCHAR(MAX),
    ultimaLeccionCompletada VARCHAR(MAX),
    ultima_conexion VARCHAR(MAX),
    usuario_id VARCHAR(MAX),
    provider VARCHAR(MAX),
    ejercicios_correctos VARCHAR(MAX),
    logins_semana VARCHAR(MAX),
    porcentaje_progreso VARCHAR(MAX),
    puntos_totales VARCHAR(MAX),
    puntosTotales VARCHAR(MAX),
    ejercicios_totales VARCHAR(MAX),
    photoURL VARCHAR(MAX), -- <-- CAMBIADO DE TEXT A VARCHAR(MAX)
    racha_actual VARCHAR(MAX),
    recordRacha VARCHAR(MAX),
    onboarding VARCHAR(MAX),
    tema_actual VARCHAR(MAX),
    rol VARCHAR(MAX),
    rolActual VARCHAR(MAX),
    role VARCHAR(MAX),
    esAdmin VARCHAR(MAX),
    displayName VARCHAR(MAX),
    rachaDias VARCHAR(MAX),
    lastLoginAt VARCHAR(MAX),
    createdAt VARCHAR(MAX)
);

-- 2. Script para importar los datos directamente desde el CSV
BULK INSERT usuarios
FROM 'D:\Back up TAMARA AL 06062022\TAMARA\PASANTIA\ULTIMA BD\Nuevo\usuarios.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIRSTROW = 2,
    FIELDQUOTE = '"'
);


Use FINAL_PASANTIA
go

-- =====================================================
-- 2. CREACIÓN DE LA TABLA MODULOS
-- =====================================================
DROP TABLE IF EXISTS modulos;

CREATE TABLE modulos (
    id_documento VARCHAR(255) not null PRIMARY KEY,
    titulo VARCHAR(MAX),
    descripcion VARCHAR(MAX),
    orden VARCHAR(MAX),
	rolSugerido VARCHAR(MAX)
);

-- =====================================================
-- IMPORTACIÓN DE DATOS (BULK INSERT)
-- =====================================================
BULK INSERT modulos
FROM 'D:\Back up TAMARA AL 06062022\TAMARA\PASANTIA\ULTIMA BD\Nuevo\modulos .csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIRSTROW = 2,
    FIELDQUOTE = '"'
);


Use FINAL_PASANTIA
GO
-- =====================================================
-- 3. CREACIÓN DE LA TABLA PROGRESO
-- =====================================================
DROP TABLE IF EXISTS progreso;

CREATE TABLE progreso (
    id_documento VARCHAR(255) NOT NULL PRIMARY KEY,
    modulos VARCHAR(MAX),
    ultimaActualizacion VARCHAR(MAX)
);

-- =====================================================
-- IMPORTACIÓN DE DATOS (BULK INSERT)
-- =====================================================
BULK INSERT progreso
FROM 'D:\Back up TAMARA AL 06062022\TAMARA\PASANTIA\ULTIMA BD\Nuevo\progreso.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIRSTROW = 2,
    FIELDQUOTE = '"'
);



Use FINAL_PASANTIA
go

-- =====================================================
-- 4. CREACIÓN DE LA TABLA EVENTOS (La de mayor telemetría)
-- =====================================================

DROP TABLE IF EXISTS eventos;

CREATE TABLE eventos (
    evento_id VARCHAR(255) NOT NULL PRIMARY KEY, 
    usuario_id VARCHAR(MAX),
    tipo_evento VARCHAR(MAX),
    modulo VARCHAR(MAX),
    leccion VARCHAR(MAX),
    ejercicio VARCHAR(MAX),
    tiempo_segundos VARCHAR(MAX),
    resultado VARCHAR(MAX),
    intentos VARCHAR(MAX),
    puntaje VARCHAR(MAX),
    metadata VARCHAR(MAX),
    fecha VARCHAR(MAX),
    sincronizado_en VARCHAR(MAX)
);

--  BULK INSERT 
BULK INSERT eventos
FROM 'D:\Back up TAMARA AL 06062022\TAMARA\PASANTIA\ULTIMA BD\Nuevo\Eventos.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '0x0a',
    FIRSTROW = 2,
    FIELDQUOTE = '"'
);



--LIMPIEZA DE DATOS

-- LAS TABLAS FUERON IMPORTADAS DESDE FIREBASE (PYTHON) MENOS LA TABLA EVENTOS QUE SE PUDO BAJAR DIRECTAMENRTE DE DATABASE

-- Creamos una vista limpia para los usuarios eliminando las comillas excesivas y casteando tipos


-- 1. LIMPIEZA DE USUARIOS

uSE FINAL_PASANTIA
GO

DROP VIEW IF EXISTS vw_usuarios_limpios;
GO
CREATE VIEW vw_usuarios_limpios AS
SELECT 
    REPLACE(usuario_id, '"', '') AS usuario_id,
    REPLACE(email, '"', '') AS email,
    REPLACE(nombre, '"', '') AS nombre,
    TRY_CAST(REPLACE(puntos_totales, '"', '') AS FLOAT) AS puntos_totales,
    TRY_CAST(REPLACE(racha_actual, '"', '') AS INT) AS racha_actual,
    REPLACE(nivel_actual, '"', '') AS nivel_actual -- Verifica si en tu tabla se llama distinto
FROM usuarios
WHERE usuario_id IS NOT NULL;
GO


-- 2. LIMPIEZA DE EVENTOS
DROP VIEW IF EXISTS vw_eventos_limpios;
GO
CREATE VIEW vw_eventos_limpios AS
SELECT 
    REPLACE(evento_id, '"', '') AS evento_id,
    REPLACE(usuario_id, '"', '') AS usuario_id,
    REPLACE(tipo_evento, '"', '') AS tipo_evento,
    REPLACE(modulo, '"', '') AS modulo,
    REPLACE(leccion, '"', '') AS leccion,
    REPLACE(ejercicio, '"', '') AS ejercicio,
    TRY_CAST(REPLACE(tiempo_segundos, '"', '') AS FLOAT) AS tiempo_segundos,
    REPLACE(resultado, '"', '') AS resultado,
    TRY_CAST(REPLACE(intentos, '"', '') AS INT) AS intentos,
    TRY_CAST(REPLACE(puntaje, '"', '') AS FLOAT) AS puntaje
FROM eventos
WHERE evento_id IS NOT NULL;
GO

-- 3. LIMPIEZA DE MODULOS
DROP VIEW IF EXISTS vw_modulos_limpios;
GO
CREATE VIEW vw_modulos_limpios AS
SELECT 
    REPLACE(id_documento, '"', '') AS id_documento,
    REPLACE(titulo, '"', '') AS titulo,
    REPLACE(descripcion, '"', '') AS descripcion,
    REPLACE(orden, '"', '') AS orden
FROM modulos
WHERE id_documento IS NOT NULL;
GO

-- 4. LIMPIEZA DE PROGRESO
DROP VIEW IF EXISTS vw_progreso_limpios;
GO
CREATE VIEW vw_progreso_limpios AS
SELECT 
    REPLACE(id_documento, '"', '') AS id_documento
FROM progreso
WHERE id_documento IS NOT NULL;
GO
--Análisis Estadístico 

-- 1) DISTRIBUCIÓN DE SESIONES E INTERACCIONES POR TIPO DE EVENTO
-- Permite conocer qué acciones predominan en la app (inicios de sesión, lecciones iniciadas, actualizaciones de racha).
SELECT 
    tipo_evento,
    COUNT(*) AS total_eventos,
    COUNT(DISTINCT usuario_id) AS usuarios_unicos,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje_total
FROM vw_eventos_limpios
GROUP BY tipo_evento
ORDER BY total_eventos DESC;
GO

-- 2) VOLUMEN DE EVENTOS REGISTRADOS POR CADA USUARIO
-- Mide el nivel de actividad general por usuario para identificar a los más activos dentro de la plataforma.
SELECT 
    usuario_id,
    COUNT(*) AS total_interacciones_app,
    COUNT(DISTINCT tipo_evento) AS variedad_acciones_realizadas
FROM vw_eventos_limpios
WHERE usuario_id IS NOT NULL AND usuario_id != ''
GROUP BY usuario_id
ORDER BY total_interacciones_app DESC;
GO


-- 3) RENDIMIENTO Y TIEMPO GENERAL DE INTERACCIÓN EN LA APP
-- Evalúa los tiempos globales de ejecución registrados en los eventos que poseen métrica de tiempo.
SELECT 
    COUNT(*) AS total_registros_con_tiempo,
    ROUND(AVG(tiempo_segundos), 2) AS tiempo_promedio_segundos,
    MIN(tiempo_segundos) AS tiempo_minimo_segundos,
    MAX(tiempo_segundos) AS tiempo_maximo_segundos
FROM vw_eventos_limpios
WHERE tiempo_segundos IS NOT NULL;
GO


-- 4) DISTRIBUCIÓN DE PUNTAJES Y PROMEDIO GENERAL DE LOS USUARIOS
-- Analiza el desempeño acumulado de puntos de los usuarios registrados en el sistema.
SELECT 
    MIN(puntos_totales) AS puntaje_minimo,
    MAX(puntos_totales) AS puntaje_maximo,
    ROUND(AVG(puntos_totales), 2) AS promedio_puntos_generales,
    COUNT(*) AS total_usuarios_evaluados
FROM vw_usuarios_limpios
WHERE puntos_totales IS NOT NULL;
GO


-- 5) ANÁLISIS DE RACHAS (STREAK) Y RETENCIÓN ACTIVA
-- Mide el compromiso analizando las rachas actuales frente a los puntos acumulados de los usuarios.
SELECT 
    racha_actual,
    COUNT(usuario_id) AS cantidad_usuarios,
    ROUND(AVG(puntos_totales), 2) AS promedio_puntos
FROM vw_usuarios_limpios
WHERE racha_actual IS NOT NULL
GROUP BY racha_actual
ORDER BY racha_actual DESC;
GO


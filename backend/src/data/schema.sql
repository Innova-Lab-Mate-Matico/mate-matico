-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  usuario_id VARCHAR(64) PRIMARY KEY,
  nombre VARCHAR(150) NULL,
  email VARCHAR(150) NULL,
  foto_url VARCHAR(255) NULL,
  proveedor VARCHAR(50) NULL,
  puntos_totales INT DEFAULT 0,
  rol_actual VARCHAR(50) NULL,
  tema_actual VARCHAR(50) NULL,
  nivel_actual VARCHAR(50) NULL,
  porcentaje_progreso INT DEFAULT 0,
  edad INT NULL,
  nivel_educativo VARCHAR(50) NULL,
  objetivo VARCHAR(255) NULL,
  confianza_math INT NULL,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL,
  ultima_conexion TIMESTAMP WITH TIME ZONE NOT NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Rachas (Relación lógica con usuarios)
CREATE TABLE IF NOT EXISTS rachas (
  usuario_id VARCHAR(64) PRIMARY KEY,
  racha_actual INT DEFAULT 0,
  record_racha INT DEFAULT 0,
  ultima_leccion_completada TIMESTAMP WITH TIME ZONE NULL,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Progreso de Lecciones (Relación lógica con usuarios)
CREATE TABLE IF NOT EXISTS progreso_lecciones (
  usuario_id VARCHAR(64) NOT NULL,
  modulo_id VARCHAR(50) NOT NULL,
  leccion_id VARCHAR(50) NOT NULL,
  completada BOOLEAN DEFAULT FALSE,
  puntaje INT DEFAULT 0,
  actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (usuario_id, modulo_id, leccion_id)
);

-- Tabla de Sesiones (Relación lógica con usuarios)
CREATE TABLE IF NOT EXISTS sesiones (
  sesion_id VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(64) NOT NULL,
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  proveedor VARCHAR(50) NULL
);

-- Tabla de Eventos (con columna JSONB para flexibilidad analítica)
CREATE TABLE IF NOT EXISTS eventos (
  evento_id VARCHAR(64) PRIMARY KEY,
  usuario_id VARCHAR(64) NULL,
  tipo_evento VARCHAR(50) NOT NULL,
  modulo VARCHAR(50) NULL,
  leccion VARCHAR(50) NULL,
  ejercicio VARCHAR(50) NULL,
  tiempo_segundos INT NULL,
  resultado VARCHAR(20) NULL,
  intentos INT NULL,
  puntaje INT NULL,
  metadata JSONB NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  sincronizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices optimizados para analítica y Power BI
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_eventos_usuario ON eventos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_metadata ON eventos USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso_lecciones(usuario_id);

-- Índice funcional sobre la clave sesion_id dentro del JSONB de metadata
CREATE INDEX IF NOT EXISTS idx_eventos_metadata_sesion_id ON eventos ((metadata->>'sesion_id'));

-- Índices compuestos para joins temporales y filtros analíticos
CREATE INDEX IF NOT EXISTS idx_eventos_usuario_fecha ON eventos (usuario_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo_fecha ON eventos (tipo_evento, fecha DESC);

-- Catálogo: Módulos
CREATE TABLE IF NOT EXISTS modulos (
  modulo_id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

-- Catálogo: Lecciones
CREATE TABLE IF NOT EXISTS lecciones (
  leccion_id VARCHAR(50) PRIMARY KEY,
  modulo_id VARCHAR(50) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  CONSTRAINT fk_modulo FOREIGN KEY (modulo_id) REFERENCES modulos(modulo_id) ON DELETE CASCADE
);

-- Catálogo: Ejercicios
CREATE TABLE IF NOT EXISTS ejercicios (
  ejercicio_id VARCHAR(50) PRIMARY KEY,
  leccion_id VARCHAR(50) NOT NULL,
  dificultad VARCHAR(20) NULL,
  CONSTRAINT fk_leccion FOREIGN KEY (leccion_id) REFERENCES lecciones(leccion_id) ON DELETE CASCADE
);

-- =========================================================================
-- VISTAS ANALÍTICAS VIRTUALIZADAS (Juicio Final III)
-- =========================================================================

-- 1. Vista: vista_respuestas_ejercicios
-- Expone el desempeño y las respuestas de los alumnos para análisis pedagógico
CREATE OR REPLACE VIEW vista_respuestas_ejercicios AS
SELECT 
  evento_id AS respuesta_id,
  usuario_id,
  ejercicio AS ejercicio_id,
  (resultado = 'correcto') AS es_correcta,
  intentos AS numero_intento,
  tiempo_segundos AS tiempo_respuesta_seg,
  metadata->>'respuesta_usuario' AS respuesta_usuario,
  metadata->>'tipo_error_pedagogico' AS tipo_error_pedagogico,
  fecha AS respondido_en
FROM eventos
WHERE tipo_evento = 'ejercicio_completado';

-- 2. Vista: vista_duracion_sesion
-- Calcula la duración de las sesiones analizando el sesion_id de metadata
CREATE OR REPLACE VIEW vista_duracion_sesion AS
SELECT 
  metadata->>'sesion_id' AS sesion_id,
  usuario_id,
  MIN(fecha) AS fecha_inicio,
  MAX(fecha) AS fecha_fin,
  EXTRACT(EPOCH FROM (MAX(fecha) - MIN(fecha)))::INT AS duracion_segundos
FROM eventos
WHERE metadata->>'sesion_id' IS NOT NULL
GROUP BY metadata->>'sesion_id', usuario_id;

-- 3. Vista: vista_abandono_ejercicio
-- Identifica ejercicios iniciados que no se completaron dentro de una ventana de 15 minutos.
-- Calcula el tiempo de interacción estimado basándose en el último evento registrado en ese lapso.
-- Filtra para reportar solo abandonos consolidados (fecha de inicio menor a 15 minutos en el pasado).
CREATE OR REPLACE VIEW vista_abandono_ejercicio AS
SELECT 
  e_ini.usuario_id,
  e_ini.ejercicio AS ejercicio_id,
  e_ini.fecha AS iniciado_en,
  TRUE AS abandonado,
  EXTRACT(EPOCH FROM (
    COALESCE(
      (
        SELECT MAX(e_sig.fecha) 
        FROM eventos e_sig 
        WHERE e_sig.usuario_id = e_ini.usuario_id 
          AND e_sig.fecha BETWEEN e_ini.fecha AND (e_ini.fecha + INTERVAL '15 minutes')
      ), 
      e_ini.fecha
    ) - e_ini.fecha
  ))::INT AS tiempo_antes_de_salir_seg
FROM eventos e_ini
LEFT JOIN eventos e_comp ON e_comp.usuario_id = e_ini.usuario_id 
  AND e_comp.ejercicio = e_ini.ejercicio 
  AND e_comp.fecha BETWEEN e_ini.fecha AND (e_ini.fecha + INTERVAL '15 minutes')
  AND e_comp.tipo_evento = 'ejercicio_completado'
WHERE e_ini.tipo_evento = 'ejercicio_iniciado'
  AND e_comp.evento_id IS NULL
  AND e_ini.fecha < (NOW() - INTERVAL '15 minutes');

-- 4. Vista: vista_feedback
-- Analiza la calificación y comentarios de feedback de las lecciones.
-- Protegida contra fallos de casteo mediante validación de expresión regular.
CREATE OR REPLACE VIEW vista_feedback AS
SELECT 
  evento_id AS feedback_id,
  usuario_id,
  leccion AS leccion_id,
  CASE 
    WHEN (metadata->>'calificacion') ~ '^[0-9]+$' THEN (metadata->>'calificacion')::INT 
    ELSE NULL 
  END AS calificacion,
  metadata->>'comentario' AS comentario,
  fecha AS enviado_en
FROM eventos
WHERE tipo_evento = 'feedback_enviado';


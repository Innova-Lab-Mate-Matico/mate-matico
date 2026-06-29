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

import { env } from './env.js';

/**
 * Logger estructurado liviano para producción y desarrollo
 * Enmascara campos sensibles (password, idToken, Authorization)
 */

function sanitizePayload(data) {
  if (!data || typeof data !== 'object') return data;
  const clone = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(clone)) {
    if (['password', 'idtoken', 'authorization', 'secret', 'token'].includes(key.toLowerCase())) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = sanitizePayload(clone[key]);
    }
  }
  return clone;
}

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const sanitizedMeta = sanitizePayload(meta);

  if (env.isProduction) {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedMeta
    });
  }

  const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
  const reset = '\x1b[0m';
  const metaStr = Object.keys(sanitizedMeta).length ? ` ${JSON.stringify(sanitizedMeta)}` : '';
  return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${metaStr}`;
}

export const logger = {
  info(message, meta) {
    console.log(formatLog('info', message, meta));
  },
  warn(message, meta) {
    console.warn(formatLog('warn', message, meta));
  },
  error(message, meta) {
    console.error(formatLog('error', message, meta));
  },
  debug(message, meta) {
    if (!env.isProduction) {
      console.log(formatLog('debug', message, meta));
    }
  }
};

export default logger;

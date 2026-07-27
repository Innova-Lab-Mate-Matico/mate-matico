/**
 * TelemetryService - Cliente de Ingesta por Lote (Buffer & Batching)
 * Acumula eventos en memoria y los envía en lote a Supabase a través del backend Express.
 * Reduce el tráfico HTTP en un 90% y garantiza 0 escrituras en Firestore.
 */

class TelemetryService {
  constructor() {
    this.queue = [];
    this.batchSizeLimit = 10; // Trigger por cantidad (10 eventos)
    this.flushIntervalMs = 30000; // Trigger por tiempo (30 segundos)
    this.timer = null;
    this.apiCallRef = null;
    this.sessionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ses_${Date.now()}`;
    this.initialized = false;
  }

  /**
   * Inicializa el servicio con la función apiCall y activa los escuchadores de ciclo de vida del navegador
   */
  init(apiCall) {
    if (this.initialized) return;
    this.apiCallRef = apiCall;
    this.initialized = true;

    // 1. Temporizador de vaciado automático cada 30 segundos
    if (!this.timer) {
      this.timer = setInterval(() => {
        if (this.queue.length > 0) {
          this.flush();
        }
      }, this.flushIntervalMs);
    }

    // 2. Escuchar cambio de visibilidad (cambio de pestaña / minimizar) y cierre de navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.queue.length > 0) {
          this.flushBeacon();
        }
      });

      window.addEventListener('beforeunload', () => {
        if (this.queue.length > 0) {
          this.flushBeacon();
        }
      });
    }
  }

  /**
   * Registra un evento en el buffer en memoria.
   * Notifica en paralelo a GTM (Google Tag Manager) para el compañero de Data.
   */
  track(tipoEvento, metadata = {}) {
    const eventPayload = {
      evento_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt_${Date.now()}_${Math.random()}`,
      tipo_evento: tipoEvento,
      fecha: new Date().toISOString(),
      metadata: {
        sesion_id: this.sessionId,
        ...metadata
      }
    };

    // Agregar al buffer local
    this.queue.push(eventPayload);

    // Integración transparente con Google Tag Manager / GA4 (si está presente en index.html)
    if (typeof window !== 'undefined' && window.dataLayer && Array.isArray(window.dataLayer)) {
      try {
        window.dataLayer.push({
          event: tipoEvento,
          ...metadata
        });
      } catch (gtmErr) {
        // Silencioso
      }
    }

    // Trigger por cantidad: vaciar inmediatamente si alcanzamos el lote objetivo (10 eventos)
    if (this.queue.length >= this.batchSizeLimit) {
      this.flush();
    }
  }

  /**
   * Vacía el buffer enviando un único payload HTTP en lote al backend
   */
  async flush() {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = []; // Limpiar buffer en memoria

    try {
      if (this.apiCallRef) {
        await this.apiCallRef('/tracking/batch', {
          method: 'POST',
          body: JSON.stringify({ eventos: eventsToSend })
        });
      }
    } catch (err) {
      console.warn('[TelemetryService] Falló el vaciado en lote, reinsertando en cola:', err.message);
      // Reinsertar eventos fallidos al principio de la cola para no perder datos
      this.queue = [...eventsToSend, ...this.queue];
    }
  }

  /**
   * Vaciado de emergencia no bloqueante para cierres de pestaña (beforeunload) mediante sendBeacon / fetch keepalive
   */
  flushBeacon() {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('idToken') : null;
    const apiBase = process.env.REACT_APP_API_BASE_URL || 'https://mate-matico-backend.onrender.com/api';
    const targetUrl = `${apiBase}/tracking/batch`;
    const payload = JSON.stringify({ eventos: eventsToSend });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(targetUrl, blob);
      } else {
        fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Ignorar errores en cierre de navegador
    }
  }
}

export const telemetry = new TelemetryService();
export default telemetry;

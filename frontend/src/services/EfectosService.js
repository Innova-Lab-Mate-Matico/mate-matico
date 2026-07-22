/**
 * MATE-MÁTICO — Servicio de Efectos Especiales (Sonidos & Animaciones)
 * - Sonidos sintetizados enriquecidos (Web Audio API) para máxima dopamina.
 * - Confeti nativo en Canvas HTML5 para la pantalla de lección completada.
 * - Soporte de silencio (mute) persistente en localStorage.
 */

let muted = localStorage.getItem('mate_matico_muted') === 'true';

export const EfectosService = {
  // ── Estado de silencio ──────────────────────────────────
  isMuted() {
    return muted;
  },

  setMuted(val) {
    muted = val;
    localStorage.setItem('mate_matico_muted', String(val));
  },

  toggleMute() {
    const newVal = !muted;
    this.setMuted(newVal);
    // Reproducir un micro bip de confirmación si se desmutea
    if (!newVal) {
      this.reproducirBipCorto();
    }
    return newVal;
  },

  reproducirBipCorto() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch(e) {}
  },

  // ── Web Audio API Polyphonic Synthesizer ────────────────
  reproducirSonido(tipo) {
    if (muted) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();

      // Utilidad para reproducir una nota con campana y decaimiento
      const sonarNota = (freq, startOffset, duration, volume = 0.15, type = 'sine') => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
        
        // Volumen inicial cero
        gainNode.gain.setValueAtTime(0, ctx.currentTime + startOffset);
        // Ataque rápido para evitar clics de audio
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startOffset + 0.02);
        // Decaimiento exponencial (efecto campana/arpa)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + startOffset);
        osc.stop(ctx.currentTime + startOffset + duration + 0.05);
      };

      if (tipo === 'acierto') {
        // Arpegio mayor rápido y brillante (C5 -> E5 -> G5 -> C6) tipo Nintendo
        const volumen = 0.18;
        sonarNota(523.25, 0.00, 0.35, volumen, 'sine'); // C5
        sonarNota(659.25, 0.06, 0.35, volumen, 'sine'); // E5
        sonarNota(783.99, 0.12, 0.35, volumen, 'sine'); // G5
        sonarNota(1046.50, 0.18, 0.50, volumen, 'sine'); // C6 (decaimiento largo)
      } else if (tipo === 'error') {
        // Dos notas discordantes bajas en frecuencia descendente
        sonarNota(180, 0.00, 0.30, 0.15, 'sawtooth');
        sonarNota(172, 0.04, 0.30, 0.12, 'sawtooth');
      } else if (tipo === 'logro') {
        // Acorde triunfal expansivo y brillante (C4 + G4 + C5 + E5 + G5 + C6)
        const volLogro = 0.12;
        sonarNota(261.63, 0.00, 1.20, volLogro * 1.5, 'triangle'); // C4 (bajo)
        sonarNota(392.00, 0.04, 1.20, volLogro, 'sine'); // G4
        sonarNota(523.25, 0.08, 1.20, volLogro, 'sine'); // C5
        sonarNota(659.25, 0.12, 1.20, volLogro, 'sine'); // E5
        sonarNota(783.99, 0.16, 1.20, volLogro, 'sine'); // G5
        sonarNota(1046.50, 0.20, 1.50, volLogro * 1.2, 'sine'); // C6 (agudo brillante)
      }
    } catch (e) {
      console.warn('AudioContext no soportado o bloqueado por el navegador:', e);
    }
  },

  // ── Animación Confeti Canvas Nativa ──────────────────────────
  dispararConfeti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    const colores = ['#7b61ff', '#a78bfa', '#ffb800', '#00f0ff', '#ff007a', '#00ff66'];
    const particulas = [];

    for (let i = 0; i < 75; i++) {
      particulas.push({
        x: Math.random() * width,
        y: Math.random() * -height - 20,
        r: Math.random() * 6 + 4,
        d: Math.random() * height,
        color: colores[Math.floor(Math.random() * colores.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    const startTime = Date.now();

    function draw() {
      ctx.clearRect(0, 0, width, height);

      let activas = false;
      particulas.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 15;

        if (p.y <= height) {
          activas = true;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (activas && Date.now() - startTime < 2500) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animationFrameId);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    }

    draw();
  },

  // Celebración combinada
  celebrarLogro() {
    this.reproducirSonido('logro');
    this.dispararConfeti();
  }
};

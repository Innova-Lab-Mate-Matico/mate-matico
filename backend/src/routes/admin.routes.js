import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { db } from '../config/firebase.js';
import { obtenerUsuario } from '../services/usuario.service.js';

const router = Router();

// Middleware para verificar que el usuario autenticado sea Administrador
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }
    const userProfile = await obtenerUsuario(req.user.uid);
    const role = userProfile?.rol;
    const esAdmin = userProfile?.esAdmin;
    if (role === 'admin' || esAdmin === true) {
      req.user.rol = role;
      req.user.esAdmin = esAdmin;
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado: Se requieren permisos de Administrador para gestionar tableros.'
    });
  } catch (error) {
    console.error('Error en middleware requireAdmin:', error);
    return res.status(500).json({ success: false, error: 'Error interno de autorización.' });
  }
};

// Fallback por defecto si no existen tableros aún en Firestore
const DEFAULT_DASHBOARDS = [
  {
    id: 'dash-ga4-overview',
    titulo: 'Métricas de Uso y Audiencia (GA4)',
    descripcion: 'Reporte en tiempo real de tráfico, retención de usuarios y comportamiento en la app.',
    proveedor: 'looker',
    url: 'https://lookerstudio.google.com/embed/reporting/0B1g_gL_0Z_1Z/page/1M',
    activo: true,
    orden: 1,
    creadoEn: new Date().toISOString()
  },
  {
    id: 'dash-telemetria-supabase',
    titulo: 'Telemetría y Errores Pedagógicos',
    descripcion: 'Análisis detallado de ejercicios resueltos, tiempo por lección y consultas al Tutor IA.',
    proveedor: 'looker',
    url: 'https://lookerstudio.google.com/embed/reporting/0B1g_gL_0Z_1Z/page/2M',
    activo: true,
    orden: 2,
    creadoEn: new Date().toISOString()
  }
];

// 1. Obtener lista de tableros (Accesible por admin y viewer)
router.get('/dashboards', requireAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('dashboards').get();

    if (snapshot.empty) {
      return res.json({ success: true, dashboards: DEFAULT_DASHBOARDS });
    }

    const dashboards = [];
    snapshot.forEach(doc => {
      dashboards.push({ id: doc.id, ...doc.data() });
    });

    // Ordenar por campo 'orden'
    dashboards.sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));

    return res.json({ success: true, dashboards });
  } catch (error) {
    console.error('Error al obtener tableros de analítica:', error);
    return res.json({ success: true, dashboards: DEFAULT_DASHBOARDS });
  }
});

// 2. Agregar un nuevo tablero (Solo Administrador)
router.post('/dashboards', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, url, proveedor } = req.body ?? {};

    if (!titulo || !url) {
      return res.status(400).json({
        success: false,
        error: 'El título y la URL del tablero son obligatorios.'
      });
    }

    const newDash = {
      titulo: String(titulo).trim(),
      descripcion: descripcion ? String(descripcion).trim() : '',
      url: String(url).trim(),
      proveedor: proveedor || 'looker',
      activo: true,
      orden: Date.now(),
      creadoPor: req.user.uid,
      creadoEn: new Date().toISOString()
    };

    const docRef = await db.collection('dashboards').add(newDash);

    return res.json({
      success: true,
      dashboard: { id: docRef.id, ...newDash }
    });
  } catch (error) {
    console.error('Error al agregar tablero:', error);
    return res.status(500).json({
      success: false,
      error: 'No se pudo guardar el tablero en la base de datos.'
    });
  }
});

// 3. Eliminar un tablero (Solo Administrador)
router.delete('/dashboards/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID de tablero inválido.' });
    }

    await db.collection('dashboards').doc(id).delete();

    return res.json({ success: true, id });
  } catch (error) {
    console.error('Error al eliminar tablero:', error);
    return res.status(500).json({ success: false, error: 'Error al eliminar el tablero.' });
  }
});

export default router;

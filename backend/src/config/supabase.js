import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const { url, anonKey } = env.supabase || {};

if (env.isProduction && (!url || !anonKey)) {
  console.warn('⚠️ [Supabase Warning] Las variables de entorno de Supabase están incompletas en producción.');
}

function initSupabase() {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  } catch (err) {
    console.warn('⚠️ [Supabase Warning] No se pudo inicializar el cliente Supabase:', err.message);
    return null;
  }
}

export const supabase = initSupabase();
export default supabase;

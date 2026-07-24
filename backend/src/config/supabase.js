import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const { url, anonKey } = env.supabase;

if (env.isProduction && (!url || !anonKey)) {
  console.warn('⚠️ [Supabase Warning] Las variables de entorno de Supabase están incompletas en producción.');
}

export const supabase = (url && anonKey) 
  ? createClient(url, anonKey) 
  : null;
export default supabase;

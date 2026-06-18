import { db } from '../config/firebase.js';
import { COLECCION_USUARIOS, dbToUsuario, usuarioToDb } from '../models/usuario.model.js';
import { BigQuery } from '@google-cloud/bigquery';
import { getFirebaseServiceAccount } from '../config/env.js';

const usuariosCol = () => db.collection(COLECCION_USUARIOS);

// Inicializar cliente de BigQuery utilizando las mismas credenciales de la cuenta de servicio
const credentials = getFirebaseServiceAccount();
const bigquery = new BigQuery({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});

/**
 * Motor de Recomendación Inicial
 * Algoritmo determinista basado en el perfil cognitivo y de intereses del usuario.
 */
export function calcularRecomendacionOnboarding({ confianzaMath, edad, intereses, nivelEducativo }) {
  // Regla 1: Si la confianza matemática es muy baja (1 o 2), empezamos con Aritmética Básica.
  if (confianzaMath <= 2) {
    return 'aritmetica';
  }

  // Regla 2: Si tienen confianza media-alta y muestran interés explícito en temas prácticos
  // de la vida cotidiana o finanzas, les recomendamos Porcentajes directamente.
  const interesesPracticos = ['descuentos', 'finanzas', 'negocios', 'ahorro', 'compras', 'porcentajes'];
  const tieneInteresPractico = intereses && intereses.some(tag => 
    interesesPracticos.includes(tag.toLowerCase().trim())
  );

  if (tieneInteresPractico) {
    return 'porcentajes';
  }

  // Regla 3: Si son adultos (edad >= 18) o tienen nivel educativo secundario/superior,
  // y confianza matemática aceptable (>= 3), podemos retarlos con Porcentajes.
  const esAdulto = edad && edad >= 18;
  const nivelEducativoAvanzado = ['secundaria', 'terciaria', 'universitaria'].includes(nivelEducativo);
  
  if (esAdulto || nivelEducativoAvanzado) {
    return 'porcentajes';
  }

  // Por defecto, ante la duda o perfiles más jóvenes sin intereses marcados:
  return 'aritmetica';
}

/**
 * Guarda las respuestas de onboarding, calcula el módulo recomendado,
 * marca el onboarding como completado y actualiza Firestore.
 */
export async function guardarOnboardingUsuario(uid, respuestas) {
  const ref = usuariosCol().doc(uid);
  const recomendacion = calcularRecomendacionOnboarding(respuestas);

  const onboardingData = {
    completado: true,
    edad: respuestas.edad !== undefined ? Number(respuestas.edad) : null,
    nivelEducativo: respuestas.nivelEducativo ?? null,
    objetivo: respuestas.objetivo ?? null,
    confianzaMath: Number(respuestas.confianzaMath),
    intereses: respuestas.intereses ?? [],
    moduloRecomendado: recomendacion,
  };

  await ref.update(usuarioToDb({
    onboarding: onboardingData
  }));

  // Envío en tiempo real a BigQuery (Streaming Insert) como un proceso complementario
  try {
    const datasetId = 'onboarding_data';
    const tableId = 'usuarios_onboarding';

    const row = {
      usuario_id: uid,
      edad: onboardingData.edad,
      nivel_educativo: onboardingData.nivelEducativo,
      objetivo: onboardingData.objetivo,
      confianza_math: onboardingData.confianzaMath,
      modulo_recomendo: onboardingData.moduloRecomendado,
      fecha_registro: BigQuery.timestamp(new Date()),
    };

    await bigquery.dataset(datasetId).table(tableId).insert([row]);
  } catch (bqError) {
    console.error('Error al insertar datos de onboarding en BigQuery:', bqError);
  }

  const updatedDoc = await ref.get();
  const data = dbToUsuario(updatedDoc.data());
  data.uid = updatedDoc.id;
  return data;
}



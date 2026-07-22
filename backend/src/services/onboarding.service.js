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
  // Inicializamos puntajes por módulo
  const scores = {
    aritmetica: 0,
    porcentajes: 0,
    fracciones: 0,
    economia: 0,
  };

  // 1. Influencia de los intereses seleccionados
  if (intereses && Array.isArray(intereses)) {
    intereses.forEach(interes => {
      const tag = interes.toLowerCase().trim();
      
      // Economía Doméstica / Finanzas del hogar
      if (['economia', 'cuotas', 'finanzas', 'ahorro', 'prestamos'].includes(tag)) {
        scores.economia += 3;
        scores.porcentajes += 1;
      }
      // Porcentajes / Descuentos
      if (['promos', 'sueldos', 'descuentos', 'porcentajes', 'negocios', 'compras'].includes(tag)) {
        scores.porcentajes += 3;
        scores.economia += 1;
      }
      // Fracciones y decimales
      if (['repartos', 'recetas', 'partes', 'medidas', 'fracciones'].includes(tag)) {
        scores.fracciones += 3;
        scores.aritmetica += 1;
      }
      // Aritmética básica
      if (['basicas', 'calculos', 'operaciones', 'sumas', 'restas'].includes(tag)) {
        scores.aritmetica += 3;
      }
    });
  }

  // 2. Ajuste según perfil cognitivo (edad, nivel educativo, confianza)
  // Si la confianza es muy baja (<= 2), le sumamos un bonus a Aritmética para ir a lo seguro.
  if (confianzaMath <= 2) {
    scores.aritmetica += 4;
  } else if (confianzaMath === 3) {
    scores.aritmetica += 2;
  }

  // Si tiene buena confianza (>= 4) y es adulto/educado, le damos un bonus para temas avanzados.
  if (confianzaMath >= 4) {
    const esAdulto = edad && edad >= 18;
    const nivelAvanzado = ['secundaria', 'terciaria', 'universitaria'].includes(nivelEducativo);
    if (esAdulto || nivelAvanzado) {
      scores.economia += 1.5;
      scores.porcentajes += 1.5;
      scores.fracciones += 1;
    }
  }

  // Encontrar el módulo con el puntaje más alto
  let maxScore = -1;
  let moduloRecomendado = 'aritmetica'; // por defecto

  Object.entries(scores).forEach(([modulo, score]) => {
    if (score > maxScore) {
      maxScore = score;
      moduloRecomendado = modulo;
    }
  });

  return moduloRecomendado;
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

  try {
    await ref.update(usuarioToDb({
      onboarding: onboardingData
    }));
  } catch (err) {
    if (err && (err.code === 8 || err.message?.includes('Quota exceeded') || err.details?.includes('Quota exceeded'))) {
      console.warn('⚠️ Firestore cuota superada al guardar onboarding. Continuando en modo local.');
    } else {
      throw err;
    }
  }

  return {
    uid,
    onboarding: onboardingData
  };

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
      fecha_registro: new Date().toISOString(),
    };

    const ndjson = JSON.stringify(row) + '\n';
    const table = bigquery.dataset(datasetId).table(tableId);

    const writeStream = table.createWriteStream({
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      writeDisposition: 'WRITE_APPEND',
    });

    writeStream.on('error', (err) => {
      console.error('[BigQuery Stream Error] Falló el stream del usuario onboarding a BigQuery:', err.message);
    });

    writeStream.write(ndjson);
    writeStream.end();
  } catch (bqError) {
    console.error('Error al insertar datos de onboarding en BigQuery:', bqError);
  }

  const updatedDoc = await ref.get();
  const data = dbToUsuario(updatedDoc.data());
  data.uid = updatedDoc.id;
  return data;
}



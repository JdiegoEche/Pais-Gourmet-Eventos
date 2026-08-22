import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '../../../../lib/sanity';
import type { RestaurantDoc } from '../../../../lib/admin/parseRestaurantsExcel';
import { validateRestaurantDoc } from '../../../../lib/admin/validateRestaurantDoc';
import { isRateLimited } from '../../../../lib/rateLimit';

export const prerender = false;

const MAX_DOCUMENTS = 500;

export const POST: APIRoute = async (context) => {
  const { request } = context;

  if (await isRateLimited(context, 'RATE_LIMITER_WRITE')) {
    return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Esperá un minuto e intentá de nuevo.' }), {
      status: 429,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), { status: 400 });
  }

  if (typeof body !== 'object' || body === null || !Array.isArray((body as { documents?: unknown }).documents)) {
    return new Response(JSON.stringify({ error: 'Falta la lista de restaurantes a importar' }), { status: 400 });
  }

  const documents = (body as { documents: unknown[] }).documents;
  if (documents.length === 0) {
    return new Response(JSON.stringify({ error: 'No hay restaurantes para importar' }), { status: 400 });
  }
  if (documents.length > MAX_DOCUMENTS) {
    return new Response(
      JSON.stringify({ error: `Demasiados restaurantes en un solo lote (máximo ${MAX_DOCUMENTS})` }),
      { status: 400 }
    );
  }

  const invalidIndex = documents.findIndex((doc) => !validateRestaurantDoc(doc));
  if (invalidIndex !== -1) {
    return new Response(
      JSON.stringify({ error: `El restaurante en la posición ${invalidIndex + 1} tiene datos inválidos o incompletos` }),
      { status: 400 }
    );
  }
  const validatedDocuments = documents as RestaurantDoc[];

  const client = getSanityWriteClient();
  const imported: string[] = [];
  const failed: { name: string; error: string }[] = [];

  // Un solo POST por restaurante tarda demasiado con listas grandes (167 documentos).
  // Se agrupan en transacciones (createOrReplace por documento, pero un solo viaje de red por lote).
  const BATCH_SIZE = 40;
  for (let i = 0; i < validatedDocuments.length; i += BATCH_SIZE) {
    const batch = validatedDocuments.slice(i, i + BATCH_SIZE);
    try {
      const tx = client.transaction();
      for (const doc of batch) tx.createOrReplace(doc);
      await tx.commit();
      imported.push(...batch.map((d) => d.name));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      failed.push(...batch.map((d) => ({ name: d.name, error: message })));
    }
  }

  return new Response(JSON.stringify({ importedCount: imported.length, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

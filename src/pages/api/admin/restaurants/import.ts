import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '../../../../lib/sanity';
import type { RestaurantDoc } from '../../../../lib/admin/parseRestaurantsExcel';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), { status: 400 });
  }

  if (typeof body !== 'object' || body === null || !Array.isArray((body as { documents?: unknown }).documents)) {
    return new Response(JSON.stringify({ error: 'Falta la lista de restaurantes a importar' }), { status: 400 });
  }

  const documents = (body as { documents: RestaurantDoc[] }).documents;
  if (documents.length === 0) {
    return new Response(JSON.stringify({ error: 'No hay restaurantes para importar' }), { status: 400 });
  }

  const client = getSanityWriteClient();
  const imported: string[] = [];
  const failed: { name: string; error: string }[] = [];

  // Un solo POST por restaurante tarda demasiado con listas grandes (167 documentos).
  // Se agrupan en transacciones (createOrReplace por documento, pero un solo viaje de red por lote).
  const BATCH_SIZE = 40;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
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

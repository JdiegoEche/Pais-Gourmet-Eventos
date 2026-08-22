import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '../../../../lib/sanity';

export const prerender = false;

// Cada archivo llega con el campo "photo::{restaurantId}" para saber a qué restaurante pertenece
// (evita mandar metadata JSON aparte de los binarios).
const FIELD_PREFIX = 'photo::';

export const POST: APIRoute = async ({ request }) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo leer el formulario' }), { status: 400 });
  }

  const byRestaurant = new Map<string, File[]>();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(FIELD_PREFIX) || !(value instanceof File)) continue;
    const restaurantId = key.slice(FIELD_PREFIX.length);
    const list = byRestaurant.get(restaurantId) ?? [];
    list.push(value);
    byRestaurant.set(restaurantId, list);
  }

  if (byRestaurant.size === 0) {
    return new Response(JSON.stringify({ error: 'No hay fotos para subir' }), { status: 400 });
  }

  const client = getSanityWriteClient();
  const results: { restaurantId: string; uploaded: number; error?: string }[] = [];

  for (const [restaurantId, files] of byRestaurant) {
    try {
      const gallery = [];
      for (const file of files) {
        const asset = await client.assets.upload('image', file, { filename: file.name });
        gallery.push({ _type: 'image', _key: asset._id.slice(-12), asset: { _type: 'reference', _ref: asset._id } });
      }
      await client.patch(restaurantId).set({ gallery }).commit();
      results.push({ restaurantId, uploaded: gallery.length });
    } catch (error) {
      results.push({
        restaurantId,
        uploaded: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

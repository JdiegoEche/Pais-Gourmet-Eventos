import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '../../../../lib/sanity';
import { isRateLimited } from '../../../../lib/rateLimit';

export const prerender = false;

// Cada archivo llega con el campo "photo::{restaurantId}" para saber a qué restaurante pertenece
// (evita mandar metadata JSON aparte de los binarios).
const FIELD_PREFIX = 'photo::';

// La compresión de imágenes es solo client-side (ver script de carga-masiva.astro) — un script
// que le pegue directo a la API podría saltearla, así que acá se valida de nuevo en el servidor.
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const POST: APIRoute = async (context) => {
  const { request } = context;

  if (await isRateLimited(context, 'RATE_LIMITER_WRITE')) {
    return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Esperá un minuto e intentá de nuevo.' }), {
      status: 429,
    });
  }

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
    const invalidFile = files.find((f) => !ALLOWED_IMAGE_TYPES.has(f.type) || f.size > MAX_FILE_SIZE);
    if (invalidFile) {
      results.push({
        restaurantId,
        uploaded: 0,
        error: `Archivo inválido (${invalidFile.name}): tipo no permitido o supera ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
      continue;
    }
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

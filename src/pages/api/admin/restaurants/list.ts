import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '../../../../lib/sanity';

export const prerender = false;

// useCdn:false via getSanityWriteClient para ver el estado real, sin el lag del CDN de lectura
// (por ejemplo justo después de importar restaurantes o subir fotos).
export const GET: APIRoute = async ({ url }) => {
  const eventId = url.searchParams.get('eventId');
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Falta el eventId' }), { status: 400 });
  }

  const client = getSanityWriteClient();
  const restaurants = await client.fetch<{ _id: string; name: string; hasGallery: boolean }[]>(
    `*[_type == "restaurant" && event._ref == $eventId] | order(name asc) {
      _id,
      name,
      "hasGallery": count(gallery) > 0
    }`,
    { eventId }
  );

  return new Response(JSON.stringify({ restaurants }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

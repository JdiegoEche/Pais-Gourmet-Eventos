import type { APIRoute } from 'astro';
import { getSanityWriteClient } from '../../../lib/sanity';

export const prerender = false;

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), { status: 400 });
  }

  const { name, startDate, endDate, whatIncludes } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof startDate !== 'string' ||
    !startDate ||
    typeof endDate !== 'string' ||
    !endDate ||
    typeof whatIncludes !== 'string' ||
    !whatIncludes.trim()
  ) {
    return new Response(JSON.stringify({ error: 'Faltan datos del evento' }), { status: 400 });
  }

  const slug = slugify(name);
  const client = getSanityWriteClient();

  try {
    const doc = await client.createOrReplace({
      _id: `event-${slug}`,
      _type: 'event',
      name: name.trim(),
      slug: { _type: 'slug', current: slug },
      startDate,
      endDate,
      whatIncludes: whatIncludes.trim(),
      priceRanges: [],
      zones: [],
      zoneShowcase: [],
      featuredRestaurants: [],
      heroRecommendedEnabled: false,
      heroRecommendedRestaurants: [],
      weeklyRecommendedEnabled: true,
      banners: [],
      sponsorLogos: [],
    });
    return new Response(JSON.stringify({ id: doc._id, slug }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: `No se pudo crear el evento: ${message}` }), { status: 500 });
  }
};

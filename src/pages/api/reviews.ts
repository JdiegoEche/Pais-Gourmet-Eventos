import type { APIRoute } from 'astro';
import { createReview, getReviews } from '../../lib/data';

export const prerender = false;

const MAX_NAME_LENGTH = 100;
const MAX_COMMENT_LENGTH = 1000;

// Anti-spam de contenido (Turnstile) y rate limiting por IP (Cloudflare Rate Limiting Rules)
// quedan pendientes de configuración en la cuenta de Cloudflare — ver README.md.
export const POST: APIRoute = async ({ request, url }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return new Response(JSON.stringify({ error: 'Origen no permitido' }), { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  const { restaurantSlug, name, foodRating, serviceRating, ambianceRating, comment } = body as Record<
    string,
    unknown
  >;

  const isValidSubRating = (value: unknown): value is 1 | 2 | 3 | 4 | 5 =>
    Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;

  if (
    typeof restaurantSlug !== 'string' ||
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > MAX_NAME_LENGTH ||
    typeof comment !== 'string' ||
    !comment.trim() ||
    comment.trim().length > MAX_COMMENT_LENGTH ||
    !isValidSubRating(foodRating) ||
    !isValidSubRating(serviceRating) ||
    !isValidSubRating(ambianceRating)
  ) {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  const rating = Math.round((foodRating + serviceRating + ambianceRating) / 3) as 1 | 2 | 3 | 4 | 5;

  try {
    const review = await createReview({
      restaurantSlug,
      name: name.trim(),
      rating,
      foodRating,
      serviceRating,
      ambianceRating,
      comment: comment.trim(),
    });
    return new Response(JSON.stringify(review), { status: 201 });
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo publicar la reseña' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const restaurantSlug = url.searchParams.get('restaurant');
  if (!restaurantSlug) {
    return new Response(JSON.stringify({ error: 'Falta el parámetro restaurant' }), { status: 400 });
  }
  const reviews = await getReviews(restaurantSlug);
  return new Response(JSON.stringify(reviews), { status: 200 });
};

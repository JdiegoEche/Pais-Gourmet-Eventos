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

  const { restaurantSlug, name, rating, comment } = body as Record<string, unknown>;

  if (
    typeof restaurantSlug !== 'string' ||
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > MAX_NAME_LENGTH ||
    typeof comment !== 'string' ||
    !comment.trim() ||
    comment.trim().length > MAX_COMMENT_LENGTH ||
    !Number.isInteger(rating) ||
    (rating as number) < 1 ||
    (rating as number) > 5
  ) {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  try {
    const review = await createReview({
      restaurantSlug,
      name: name.trim(),
      rating: rating as 1 | 2 | 3 | 4 | 5,
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

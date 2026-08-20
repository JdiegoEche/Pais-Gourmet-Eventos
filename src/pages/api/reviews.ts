import type { APIRoute } from 'astro';
import { createReview, getReviews } from '../../lib/data';
import { isRateLimited } from '../../lib/rateLimit';
import { isTurnstileValid } from '../../lib/turnstile';

export const prerender = false;

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 30;
const MAX_COMMENT_LENGTH = 300;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s()-]{7,20}$/;

export const POST: APIRoute = async (context) => {
  const { request, url, clientAddress } = context;
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return new Response(JSON.stringify({ error: 'Origen no permitido' }), { status: 403 });
  }

  if (await isRateLimited(context)) {
    return new Response(JSON.stringify({ error: 'Demasiadas solicitudes, intentá más tarde' }), { status: 429 });
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

  const { restaurantSlug, name, phone, email, foodRating, serviceRating, ambianceRating, comment, turnstileToken } =
    body as Record<string, unknown>;

  const isValidSubRating = (value: unknown): value is 1 | 2 | 3 | 4 | 5 =>
    Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;

  if (
    typeof restaurantSlug !== 'string' ||
    typeof name !== 'string' ||
    name.trim().length < MIN_NAME_LENGTH ||
    name.trim().length > MAX_NAME_LENGTH ||
    typeof phone !== 'string' ||
    !PHONE_PATTERN.test(phone.trim()) ||
    typeof email !== 'string' ||
    !EMAIL_PATTERN.test(email.trim()) ||
    typeof comment !== 'string' ||
    !comment.trim() ||
    comment.trim().length > MAX_COMMENT_LENGTH ||
    !isValidSubRating(foodRating) ||
    !isValidSubRating(serviceRating) ||
    !isValidSubRating(ambianceRating)
  ) {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  if (!(await isTurnstileValid(turnstileToken, clientAddress))) {
    return new Response(JSON.stringify({ error: 'No pudimos verificar que sos una persona. Intentá de nuevo.' }), {
      status: 403,
    });
  }

  const rating = Math.round((foodRating + serviceRating + ambianceRating) / 3) as 1 | 2 | 3 | 4 | 5;

  try {
    const review = await createReview({
      restaurantSlug,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      rating,
      foodRating,
      serviceRating,
      ambianceRating,
      comment: comment.trim(),
    });
    const { id, name: publicName, rating: publicRating, foodRating: fr, serviceRating: sr, ambianceRating: ar, comment: publicComment, createdAt } = review;
    return new Response(
      JSON.stringify({ id, name: publicName, rating: publicRating, foodRating: fr, serviceRating: sr, ambianceRating: ar, comment: publicComment, createdAt, replies: [] }),
      { status: 201 }
    );
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
  // Nunca se exponen phone/email (ni de la reseña ni de sus respuestas): son datos privados para la base de leads.
  const publicReviews = reviews.map(({ id, name, rating, foodRating, serviceRating, ambianceRating, comment, createdAt, replies }) => ({
    id,
    name,
    rating,
    foodRating,
    serviceRating,
    ambianceRating,
    comment,
    createdAt,
    replies: replies.map(({ name, message, createdAt }) => ({ name, message, createdAt })),
  }));
  return new Response(JSON.stringify(publicReviews), { status: 200 });
};

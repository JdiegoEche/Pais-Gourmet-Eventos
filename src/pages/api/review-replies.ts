import type { APIRoute } from 'astro';
import { addReviewReply } from '../../lib/data';

export const prerender = false;

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 300;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s()-]{7,20}$/;

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

  const { reviewId, name, phone, email, message } = body as Record<string, unknown>;

  if (
    typeof reviewId !== 'string' ||
    !reviewId.trim() ||
    typeof name !== 'string' ||
    name.trim().length < MIN_NAME_LENGTH ||
    name.trim().length > MAX_NAME_LENGTH ||
    typeof phone !== 'string' ||
    !PHONE_PATTERN.test(phone.trim()) ||
    typeof email !== 'string' ||
    !EMAIL_PATTERN.test(email.trim()) ||
    typeof message !== 'string' ||
    !message.trim() ||
    message.trim().length > MAX_MESSAGE_LENGTH
  ) {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  try {
    const reply = await addReviewReply(reviewId, {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    return new Response(JSON.stringify({ name: reply.name, message: reply.message, createdAt: reply.createdAt }), {
      status: 201,
    });
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo publicar la respuesta' }), { status: 500 });
  }
};

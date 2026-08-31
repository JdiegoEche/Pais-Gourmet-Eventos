import type { APIRoute } from 'astro';
import { createLeadSignup } from '../../lib/data';
import { isRateLimited } from '../../lib/rateLimit';
import { isTurnstileValid } from '../../lib/turnstile';
import { getClientAddress } from '../../lib/clientAddress';

export const prerender = false;

const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\s()-]{7,20}$/;

export const POST: APIRoute = async (context) => {
  const { request, url } = context;
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

  const { name, email, phone, turnstileToken } = body as Record<string, unknown>;

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > MAX_NAME_LENGTH ||
    typeof email !== 'string' ||
    !EMAIL_PATTERN.test(email.trim()) ||
    typeof phone !== 'string' ||
    !PHONE_PATTERN.test(phone.trim())
  ) {
    return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
  }

  if (!(await isTurnstileValid(turnstileToken, getClientAddress(context)))) {
    return new Response(JSON.stringify({ error: 'No pudimos verificar que eres una persona. Intentá de nuevo.' }), {
      status: 403,
    });
  }

  try {
    await createLeadSignup({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo procesar la inscripción' }), { status: 500 });
  }
};

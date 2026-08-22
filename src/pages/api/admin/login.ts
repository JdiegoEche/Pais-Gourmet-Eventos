import type { APIRoute } from 'astro';
import { isRateLimited } from '../../../lib/rateLimit';
import { setSessionCookie, timingSafeEqual } from '../../../lib/adminAuth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;

  if (await isRateLimited(context, 'RATE_LIMITER')) {
    return new Response(JSON.stringify({ error: 'Demasiados intentos. Esperá un minuto e intentá de nuevo.' }), {
      status: 429,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), { status: 400 });
  }

  const { password } = (body ?? {}) as Record<string, unknown>;
  if (typeof password !== 'string' || !password) {
    return new Response(JSON.stringify({ error: 'Falta la contraseña' }), { status: 400 });
  }

  const expectedPassword = import.meta.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return new Response(JSON.stringify({ error: 'El panel no está configurado. Falta ADMIN_PASSWORD.' }), {
      status: 500,
    });
  }

  const isValid = await timingSafeEqual(password, expectedPassword);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Contraseña incorrecta' }), { status: 401 });
  }

  try {
    await setSessionCookie(cookies);
  } catch {
    return new Response(JSON.stringify({ error: 'El panel no está configurado. Falta ADMIN_SESSION_SECRET.' }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

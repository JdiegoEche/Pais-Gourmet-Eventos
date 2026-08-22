import type { AstroCookies } from 'astro';

// Helpers de autenticación del panel admin: una sola contraseña compartida para un equipo
// chico no técnico (sin tabla de usuarios). La sesión se guarda en una cookie firmada con
// HMAC-SHA256 vía Web Crypto (crypto.subtle) — NO el módulo "crypto" de Node, que no es
// confiable en el runtime de Cloudflare Workers.

export const ADMIN_SESSION_COOKIE = 'admin_session';

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas: alcanza una jornada de carga

// secure:false en dev (import.meta.env.PROD es false con "astro dev") para no romper el
// flujo de desarrollo local por http; en el build de producción (Cloudflare, siempre https)
// queda en true.
export const ADMIN_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'lax' as const,
  // path "/" porque la cookie tiene que viajar tanto a /admin/* (páginas) como a
  // /api/admin/* (API) — no comparten un prefijo más específico que la raíz.
  path: '/',
  maxAge: Math.floor(SESSION_DURATION_MS / 1000),
};

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

interface SessionPayload {
  exp: number;
}

/** Crea el valor firmado de la cookie de sesión: base64url(payload) + "." + base64url(firma). */
export async function createSessionToken(): Promise<string> {
  const secret = import.meta.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('Falta configurar ADMIN_SESSION_SECRET');

  const payload: SessionPayload = { exp: Date.now() + SESSION_DURATION_MS };
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const key = await getHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  const signatureB64 = base64urlEncode(new Uint8Array(signature));

  return `${payloadB64}.${signatureB64}`;
}

/** Verifica firma y expiración de un valor de cookie de sesión. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const secret = import.meta.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const [payloadB64, signatureB64] = token.split('.');
  if (!payloadB64 || !signatureB64) return false;

  let signatureBytes: Uint8Array<ArrayBuffer>;
  try {
    signatureBytes = base64urlDecode(signatureB64);
  } catch {
    return false;
  }

  const key = await getHmacKey(secret);
  // crypto.subtle.verify hace la comparación de la firma en tiempo constante.
  const validSignature = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(payloadB64)
  );
  if (!validSignature) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64))) as Partial<SessionPayload>;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;
  } catch {
    return false;
  }

  return true;
}

/**
 * Compara dos strings en tiempo constante sin depender de un timingSafeEqual nativo
 * (no existe en Web Crypto): firma ambos con HMAC usando una clave efímera aleatoria y
 * compara los MACs resultantes (largo fijo) byte a byte con OR acumulado.
 */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const [macA, macB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(a)),
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(b)),
  ]);
  const bytesA = new Uint8Array(macA);
  const bytesB = new Uint8Array(macB);
  if (bytesA.length !== bytesB.length) return false;
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

export async function isAuthenticated(cookies: AstroCookies): Promise<boolean> {
  return verifySessionToken(cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function setSessionCookie(cookies: AstroCookies): Promise<void> {
  const token = await createSessionToken();
  cookies.set(ADMIN_SESSION_COOKIE, token, ADMIN_SESSION_COOKIE_OPTIONS);
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(ADMIN_SESSION_COOKIE, { path: ADMIN_SESSION_COOKIE_OPTIONS.path });
}

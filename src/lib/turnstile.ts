const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function isTurnstileValid(token: unknown, remoteIp?: string): Promise<boolean> {
  let env: Env;
  try {
    ({ env } = await import('cloudflare:workers'));
  } catch {
    return true;
  }

  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  if (typeof token !== 'string' || !token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    const result = (await response.json()) as { success: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

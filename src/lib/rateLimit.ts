import type { APIContext } from 'astro';

export async function isRateLimited(context: Pick<APIContext, 'clientAddress'>): Promise<boolean> {
  let env: Env;
  try {
    ({ env } = await import('cloudflare:workers'));
  } catch {
    return false;
  }

  const { success } = await env.RATE_LIMITER.limit({ key: context.clientAddress });
  return !success;
}

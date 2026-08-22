import type { APIContext } from 'astro';

type LimiterBinding = 'RATE_LIMITER' | 'RATE_LIMITER_WRITE';

// Solo se avisa una vez por instancia del worker para no inundar los logs si el binding
// falta durante toda la vida del proceso (ej. wrangler.toml desactualizado en un entorno).
let warnedMissingBinding = false;

export async function isRateLimited(
  context: Pick<APIContext, 'clientAddress'>,
  binding: LimiterBinding = 'RATE_LIMITER'
): Promise<boolean> {
  // "astro dev" plano (Node) no tiene el runtime de Cloudflare Workers, y el adapter de
  // Cloudflare no expone `Astro.clientAddress` fuera de "wrangler dev"/producción (tira una
  // excepción al leerlo, no un undefined): todo este bloque se deja pasar sin rate limit si
  // falla por cualquiera de los dos motivos, tal como ya hacía este helper.
  try {
    const { env } = await import('cloudflare:workers');
    const limiter = env[binding];
    if (!limiter) {
      if (!warnedMissingBinding) {
        console.warn(
          `[rateLimit] El binding "${binding}" no está disponible en runtime (¿falta en wrangler.toml, o corriste "astro dev" en vez de "wrangler dev"?). Se deja pasar la request sin límite.`
        );
        warnedMissingBinding = true;
      }
      return false;
    }

    const { success } = await limiter.limit({ key: context.clientAddress });
    return !success;
  } catch {
    return false;
  }
}

import type { APIContext } from 'astro';

// `Astro.clientAddress` es un getter que TIRA una excepción al leerlo bajo "astro dev" plano
// (Node) con el adapter de Cloudflare, en vez de devolver undefined — solo funciona bajo
// "wrangler dev" o en producción. Nunca leer `context.clientAddress` directo: usar este wrapper.
export function getClientAddress(context: Pick<APIContext, 'clientAddress'>): string | undefined {
  try {
    return context.clientAddress;
  } catch {
    return undefined;
  }
}

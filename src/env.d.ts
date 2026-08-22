/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  readonly ADMIN_PASSWORD?: string;
  readonly ADMIN_SESSION_SECRET?: string;
}

interface RateLimitOutcome {
  success: boolean;
}

interface RateLimit {
  limit: (options: { key: string }) => Promise<RateLimitOutcome>;
}

interface Env {
  RATE_LIMITER: RateLimit;
  // Límite más generoso para endpoints de escritura ya autenticados (defensa en profundidad).
  RATE_LIMITER_WRITE: RateLimit;
  TURNSTILE_SECRET_KEY?: string;
}

declare module 'cloudflare:workers' {
  export const env: Env;
}

/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface RateLimitOutcome {
  success: boolean;
}

interface RateLimit {
  limit: (options: { key: string }) => Promise<RateLimitOutcome>;
}

interface Env {
  RATE_LIMITER: RateLimit;
  TURNSTILE_SECRET_KEY?: string;
}

declare module 'cloudflare:workers' {
  export const env: Env;
}

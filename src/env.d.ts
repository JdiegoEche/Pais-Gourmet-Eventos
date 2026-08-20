interface RateLimitOutcome {
  success: boolean;
}

interface RateLimit {
  limit: (options: { key: string }) => Promise<RateLimitOutcome>;
}

interface Env {
  RATE_LIMITER: RateLimit;
}

declare module 'cloudflare:workers' {
  export const env: Env;
}

type RateLimitOptions = { limit: number; windowMs: number };
type Bucket = { count: number; resetAt: number };

export function createMemoryRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string) {
      const now = Date.now();
      const bucket = buckets.get(key);

      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true };
      }

      bucket.count += 1;
      return { allowed: bucket.count <= options.limit, resetAt: bucket.resetAt };
    },
  };
}

export const rewriteRateLimiter = createMemoryRateLimiter({ limit: 10, windowMs: 60_000 });

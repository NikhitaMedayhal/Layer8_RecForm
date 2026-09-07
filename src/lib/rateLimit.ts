/**
 * Minimal in-memory rate limiter, keyed by IP.
 *
 * LIMITATION: this only works within a single running Node process. On
 * Vercel's serverless runtime each invocation *may* land on a different
 * instance, so this is a best-effort speed bump against casual spam/bots —
 * not a hard guarantee. If abuse becomes a real problem, swap this for
 * Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`), which is free at
 * this scale and works across instances. The call site (src/app/api/apply/route.ts)
 * is written so that swap is a one-function change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 5; // 5 submissions per IP per minute

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    return true;
  }
  return false;
}

// Periodically clear stale buckets so this map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(ip);
  }
}, WINDOW_MS).unref?.();

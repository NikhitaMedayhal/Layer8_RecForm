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

// --- Separate, stricter limiter for admin login attempts ---
//
// Two keys are checked independently so an attacker can't dodge the limit
// by either spraying one email from many IPs (botnet/credential stuffing)
// or guessing many emails from one IP:
//   - `ip:<ip>`        caps total login attempts from a single address
//   - `email:<email>`  caps total attempts against a single admin account
//
// Only failures increment the counter (see recordAuthFailure) — normal
// correct logins never get anyone closer to a lockout.
const authBuckets = new Map<string, Bucket>();
const AUTH_WINDOW_MS = 15 * 60_000; // 15 minutes
const AUTH_MAX_FAILURES = 5;

export function isAuthLocked(key: string): boolean {
  const bucket = authBuckets.get(key);
  if (!bucket || bucket.resetAt < Date.now()) return false;
  return bucket.count >= AUTH_MAX_FAILURES;
}

export function recordAuthFailure(key: string): void {
  const now = Date.now();
  const bucket = authBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    authBuckets.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return;
  }
  bucket.count += 1;
}

export function clearAuthFailures(key: string): void {
  authBuckets.delete(key);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of authBuckets) {
    if (bucket.resetAt < now) authBuckets.delete(key);
  }
}, AUTH_WINDOW_MS).unref?.();

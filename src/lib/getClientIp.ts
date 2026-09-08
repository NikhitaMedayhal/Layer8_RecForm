/**
 * Extracts the client IP from proxy headers. Works with both a real
 * NextRequest (Headers instance) and NextAuth's RequestInternal (a plain
 * object), which is why the lookup is written generically.
 *
 * NOTE: x-forwarded-for is only trustworthy because Vercel (and most
 * reverse proxies) set/overwrite it themselves at the edge — it is not
 * safe to trust this header on a server directly exposed to the internet
 * without a proxy in front of it.
 */
export function getClientIp(headers: Headers | Record<string, any> | undefined): string {
  if (!headers) return "unknown";

  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    const value = (headers as Record<string, any>)[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const forwarded = get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return get("x-real-ip") || "unknown";
}

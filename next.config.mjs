/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

// Next.js's dev server relies on eval() for hot-reload/source-maps, so the
// strict script-src only makes sense in production. Ship the relaxed CSP
// during `next dev`, and the locked-down one for the real deployment.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "frame-src https://challenges.cloudflare.com",
      "connect-src 'self'",
    ].join("; "),
  },
  // Only sent in production: tells browsers to always use HTTPS for this
  // domain (skip the initial plaintext request entirely, not just redirect
  // after the fact) for the next year, including subdomains. Forcing this
  // in dev would break plain http://localhost.
  ...(!isDev
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
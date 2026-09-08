import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { turso } from "./turso";
import { getClientIp } from "./getClientIp";
import { isAuthLocked, recordAuthFailure, clearAuthFailures } from "./rateLimit";

// Used to compare against when no admin matches the given email, so that
// bcrypt.compare() always runs and takes roughly the same time whether or
// not the account exists. Without this, "no such admin" returns instantly
// while "wrong password" takes ~100ms+ (bcrypt is intentionally slow),
// letting an attacker enumerate valid admin emails purely by timing.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password-just-for-timing", 12);

async function logAuditEvent(action: string, actorEmail: string | null, ip: string, detail?: string) {
  try {
    await turso.execute({
      sql: `INSERT INTO audit_log (actorEmail, action, detail, ip) VALUES (?, ?, ?, ?)`,
      args: [actorEmail, action, detail ?? null, ip],
    });
  } catch (err) {
    // Never let audit logging break the actual auth flow.
    console.error("[auth] failed to write audit log:", err);
  }
}

// Only harden the cookie in production. The `__Host-` prefix requires the
// `Secure` attribute, and browsers only send Secure cookies over HTTPS —
// forcing this in dev would silently break login on plain http://localhost.
const isProd = process.env.NODE_ENV === "production";
const cookiePrefix = isProd ? "__Host-" : "";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 hour sessions
  useSecureCookies: isProd,
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        // No external OAuth provider here (Credentials only, submitted via
        // an in-app form), so there's no legitimate top-level-redirect flow
        // that needs the looser "lax" default — "strict" is safe and cuts
        // off more CSRF surface than NextAuth's default.
        sameSite: "strict",
        path: "/",
        secure: isProd,
        // __Host- cookies are explicitly forbidden from setting Domain —
        // omitting it here (rather than leaving it undefined-by-default)
        // documents that this is intentional, not an oversight.
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Admin login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const ip = getClientIp(req?.headers);
        const ipKey = `ip:${ip}`;
        const emailKey = `email:${email}`;

        // Locked out from too many recent failures — from this IP, or
        // against this specific account. Don't even touch the database.
        if (isAuthLocked(ipKey) || isAuthLocked(emailKey)) {
          await logAuditEvent("login_locked", email, ip);
          return null;
        }

        const result = await turso.execute({
          sql: "SELECT id, name, email, passwordHash FROM admins WHERE email = ? LIMIT 1",
          args: [email],
        });

        const admin = result.rows[0];
        const hashToCheck = admin ? String(admin.passwordHash) : DUMMY_HASH;
        const valid = await bcrypt.compare(credentials.password, hashToCheck);

        if (!admin || !valid) {
          recordAuthFailure(ipKey);
          recordAuthFailure(emailKey);
          await logAuditEvent("login_failure", email, ip);
          return null;
        }

        clearAuthFailures(ipKey);
        clearAuthFailures(emailKey);
        await logAuditEvent("login_success", email, ip);

        return { id: String(admin.id), email: String(admin.email), name: String(admin.name) };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
};
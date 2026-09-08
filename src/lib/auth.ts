import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { turso } from "./turso";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 hour sessions
  providers: [
    CredentialsProvider({
      name: "Admin login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const result = await turso.execute({
          sql: "SELECT id, name, email, passwordHash FROM admins WHERE email = ? LIMIT 1",
          args: [email],
        });

        const admin = result.rows[0];
        if (!admin) return null;

        const valid = await bcrypt.compare(credentials.password, String(admin.passwordHash));
        if (!valid) return null;

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

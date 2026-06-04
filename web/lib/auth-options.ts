import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const hash = process.env.ADMIN_PASSWORD_HASH;

        if (!email || !password || !adminEmail || !hash) {
          console.log("[auth][credentials] reject: missing input/env", {
            hasEmail: Boolean(email),
            hasPassword: Boolean(password),
            hasAdminEmail: Boolean(adminEmail),
            hasPasswordHash: Boolean(hash),
          });
          return null;
        }
        if (email !== adminEmail) {
          console.log("[auth][credentials] reject: email mismatch");
          return null;
        }
        const ok = await compare(password, hash);
        if (!ok) {
          console.log("[auth][credentials] reject: password mismatch");
          return null;
        }
        console.log("[auth][credentials] success");
        return { id: "admin", email: adminEmail, name: "Admin" };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

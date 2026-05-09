// =====================================================================
//  src/lib/auth.ts
//  NextAuth configuration — JWT strategy only (no PrismaAdapter).
//
//  Our schema uses custom model names (OAuthAccount, not Account)
//  which are incompatible with PrismaAdapter's expected shape.
//  We use JWT sessions instead — user data is stored in the token,
//  not in the database sessions table.
// =====================================================================

import { type NextAuthOptions } from "next-auth";
import CredentialsProvider        from "next-auth/providers/credentials";
import { prisma }                  from "@/lib/prisma";
import bcrypt                      from "bcryptjs";

// ── Extend built-in types to carry role + id ──────────────────────────
declare module "next-auth" {
  interface User {
    id:       string;
    role:     string;
    username: string;
  }
  interface Session {
    user: {
      id:       string;
      role:     string;
      username: string;
      email:    string;
      name?:    string | null;
      image?:   string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:       string;
    role:     string;
    username: string;
  }
}

// ─────────────────────────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  // JWT strategy — no database sessions table needed
  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",

  pages: {
    signIn: "/auth/login",
    error:  "/auth/error",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });

          if (!user || !user.passwordHash) return null;

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) return null;

          return {
            id:       user.id,
            email:    user.email,
            name:     user.username,
            username: user.username,
            role:     user.role,
            image:    user.avatarUrl ?? null,
          };
        } catch {
          // DB not yet connected during initial setup
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.role     = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id       = token.id;
      session.user.role     = token.role;
      session.user.username = token.username;
      return session;
    },
  },
};

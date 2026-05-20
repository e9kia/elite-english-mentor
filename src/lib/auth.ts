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

// Simple in-memory login rate limiter for brute-force mitigation
const loginFailures = new Map<string, { count: number; lockUntil: number }>();

function trackFailedLogin(emailKey: string) {
  const current = loginFailures.get(emailKey) || { count: 0, lockUntil: 0 };
  const count = current.count + 1;
  const lockUntil = count >= 5 ? Date.now() + 15 * 60 * 1000 : 0; // 15-minute lock after 5 failures
  loginFailures.set(emailKey, { count, lockUntil });
}

async function sleepDelay(emailKey: string) {
  const current = loginFailures.get(emailKey);
  const count = current ? current.count : 1;
  // Progressive timing attack mitigation delay: 1.5s + 0.5s per failed attempt (up to 5s max)
  const delay = 1500 + Math.min(count * 500, 3500);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// ─────────────────────────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  // ── Robust Persistent Sessions ──
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days session persistence
    updateAge: 24 * 60 * 60, // 24 hours update interval
  },

  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",

  // ── CSRF & XSS Protection Cookie Configurations ──
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

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

        const emailKey = credentials.email.toLowerCase().trim();
        const now = Date.now();

        // 🛡️ Cyber Defense: Check rate limiter lockout
        const failureRecord = loginFailures.get(emailKey);
        if (failureRecord && failureRecord.count >= 5 && failureRecord.lockUntil > now) {
          const remainingTime = Math.ceil((failureRecord.lockUntil - now) / 1000);
          console.warn(`[BRUTE-FORCE BLOCKED] Login attempt on locked email: ${emailKey}. Locked for ${remainingTime}s.`);
          throw new Error(`Too many failed login attempts. Locked out for ${remainingTime} seconds.`);
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: emailKey },
          });

          if (!user || !user.passwordHash) {
            // Track generic authentication failure to mitigate account enumeration
            trackFailedLogin(emailKey);
            await sleepDelay(emailKey);
            return null;
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) {
            trackFailedLogin(emailKey);
            await sleepDelay(emailKey);
            return null;
          }

          // Successful authentication - clear lockout tracking
          loginFailures.delete(emailKey);

          return {
            id:       user.id,
            email:    user.email,
            name:     user.username,
            username: user.username,
            role:     user.role,
            image:    user.avatarUrl ?? null,
          };
        } catch (err) {
          console.error("[AUTH ERROR]", err);
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

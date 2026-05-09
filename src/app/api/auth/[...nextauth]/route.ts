// src/app/api/auth/[...nextauth]/route.ts
// NextAuth catch-all handler — must exist for any auth to work.

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  // 1. Restrict /admin to admins only
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 2. Restrict /study and /compete from admins (redirect to preview)
  if (req.nextUrl.pathname.startsWith("/study") || req.nextUrl.pathname.startsWith("/compete")) {
    if (token?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/preview", req.url));
    }
  }

  // 3. Cyber Security Hardening: Secure all API routes under /api (excluding public /api/auth paths)
  if (req.nextUrl.pathname.startsWith("/api")) {
    if (!req.nextUrl.pathname.startsWith("/api/auth")) {
      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: "Access Denied: Session Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin",
    "/study/:path*",
    "/study",
    "/compete/:path*",
    "/compete",
    "/api/:path*"
  ],
};

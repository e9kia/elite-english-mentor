import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  // 1. Restrict /admin to admins only
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // If it's the preview page, allow admins
    if (req.nextUrl.pathname.startsWith("/admin/preview")) {
      if (!token || token.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      if (!token || token.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 2. Restrict /study from admins (redirect to preview)
  if (req.nextUrl.pathname.startsWith("/study")) {
    if (token?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/preview", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/study/:path*", "/study"],
};

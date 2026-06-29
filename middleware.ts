// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Define public routes
    const publicRoutes = ["/login", "/register", "/forgot-password"];
    const isPublicRoute = publicRoutes.includes(path);
    const isRoot = path === "/";
    const isApiAuth = path.startsWith("/api/auth");

    // ✅ Allow API auth routes to pass through
    if (isApiAuth) {
      return NextResponse.next();
    }

    // If authenticated and on public route → redirect to feed
    if (token && isPublicRoute) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }

    // If authenticated and on root → redirect to feed
    if (token && isRoot) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }

    // If NOT authenticated and on root → redirect to login
    if (!token && isRoot) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If NOT authenticated and NOT on public route → redirect to login
    if (!token && !isPublicRoute) {
      const loginUrl = new URL("/login", req.url);
      // ✅ Only add callbackUrl if it's the first redirect
      if (!req.nextUrl.searchParams.has("callbackUrl")) {
        loginUrl.searchParams.set("callbackUrl", path);
      }
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/feed/:path*",
    "/explore/:path*",
    "/bookmarks/:path*",
    "/scheduled/:path*",
    "/analytics/:path*",
    "/achievements/:path*",
    "/notifications/:path*",
    "/messages/:path*",
    "/communities/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};

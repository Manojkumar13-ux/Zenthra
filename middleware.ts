import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Define public routes (accessible without authentication)
    const publicRoutes = ["/login", "/register", "/forgot-password"];
    
    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.includes(path);
    
    // Check if the current path is the root
    const isRoot = path === "/";

    // If user is authenticated
    if (token) {
      // Redirect from public routes to feed
      if (isPublicRoute) {
        return NextResponse.redirect(new URL("/feed", req.url));
      }
      // Redirect from root to feed
      if (isRoot) {
        return NextResponse.redirect(new URL("/feed", req.url));
      }
      // Allow access to all other routes
      return NextResponse.next();
    }

    // If user is not authenticated
    if (!token) {
      // Redirect from root to login
      if (isRoot) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // Redirect from protected routes to login
      if (!isPublicRoute) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", path);
        return NextResponse.redirect(loginUrl);
      }
      // Allow access to public routes (login, register, forgot-password)
      return NextResponse.next();
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
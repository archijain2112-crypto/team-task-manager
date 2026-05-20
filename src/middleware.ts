import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Retrieve the session token from cookies
  const token = request.cookies.get("token")?.value;

  // 2. Validate token
  const user = token ? await verifyJWT(token) : null;

  // 3. Define path types
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/tasks");
  const isProtectedApiRoute =
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/dashboard");

  // User is logged in and tries to access /login or /signup -> redirect to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // User is not logged in and tries to access a protected page -> redirect to login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // User is not logged in and tries to access a protected API route -> return 401 JSON
  if (isProtectedApiRoute && !user) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized access. Please log in." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Proceed with request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
    "/api/dashboard/:path*",
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Allow access to protected routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public pages (login/register/password pages, home) and NextAuth/api routes
        if (
          req.nextUrl.pathname.startsWith("/login") ||
          req.nextUrl.pathname.startsWith("/auth/forgot-password") ||
          req.nextUrl.pathname.startsWith("/auth/reset-password") ||
          req.nextUrl.pathname.startsWith("/api/auth") ||
          req.nextUrl.pathname.startsWith("/register") ||
          req.nextUrl.pathname === "/"
        ) {
          return true;
        }
        // For all other routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login, register, forgotpassword, 404, index pages
     * - api/seed-users, api/seed-comprehensive, api/seed-organized, api/seed-course, api/purge-database (development only - should be protected in production)
     */
    "/((?!api/auth|api/seed-users|api/seed-comprehensive|api/seed-organized|api/seed-course|api/seed-seet-mce|api/seed-more-students|api/admin/auto-register-and-grade|api/admin/course-registrations|api/purge-database|api/debug|_next/static|_next/image|favicon.ico|login|register|auth/forgot-password|auth/reset-password|404|$).*)",
  ],
};

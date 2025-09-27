// pages/api/auth/[...nextauth].ts (Pages Router)
// or app/api/auth/[...nextauth]/route.ts (App Router)

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Find user in DB with role information
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
            isActive: true,
            // Get profile information based on role
            student: {
              select: {
                name: true,
                matricNumber: true,
                level: true,
              },
            },
            lecturer: {
              select: {
                name: true,
              },
            },
            departmentAdmin: {
              select: {
                name: true,
              },
            },
            schoolAdmin: {
              select: {
                name: true,
              },
            },
            senateAdmin: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        if (!user.email) {
          throw new Error("User account has no email address");
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated");
        }

        // Compare password with bcrypt
        if (!user.password) {
          throw new Error("User account has no password set");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Get the appropriate name based on role
        let name = "Unknown User";
        switch (user.role) {
          case "STUDENT":
            name = user.student?.name || "Student";
            break;
          case "LECTURER":
            name = user.lecturer?.name || "Lecturer";
            break;
          case "DEPARTMENT_ADMIN":
            name = user.departmentAdmin?.name || "Department Admin";
            break;
          case "SCHOOL_ADMIN":
            name = user.schoolAdmin?.name || "School Admin";
            break;
          case "SENATE_ADMIN":
            name = user.senateAdmin?.name || "Senate Admin";
            break;
        }

        // Handle demo users with specific names
        if (user.email.includes("@demo.com")) {
          switch (user.email) {
            case "student@demo.com":
              name = "Demo Student";
              break;
            case "lecturer@demo.com":
              name = "Demo Lecturer";
              break;
            case "admin@demo.com":
              name = "Demo Admin";
              break;
          }
        }

        // Return only the fields that NextAuth expects
        // Ensure we never return null values as NextAuth expects non-null strings
        return {
          id: user.id.toString(),
          email: user.email || "", // Ensure email is never null
          name: name || "Unknown User", // Ensure name is never null
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Store the user ID for later use
        token.id = user.id;

        // Fetch additional user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            isActive: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role ?? "STUDENT"; // or another sensible default
          token.isActive = dbUser.isActive;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as
          | "STUDENT"
          | "LECTURER"
          | "DEPARTMENT_ADMIN"
          | "SCHOOL_ADMIN"
          | "SENATE_ADMIN";
        (session.user as any).isActive = token.isActive as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If it's already an absolute URL on the same origin, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "fallback-secret-for-development",
  debug: process.env.NODE_ENV === "development",
  // SSR configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  // Add these for better session persistence
  useSecureCookies: process.env.NODE_ENV === "production",
};

export default NextAuth(authOptions);

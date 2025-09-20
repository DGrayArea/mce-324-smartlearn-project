// pages/api/auth/[...nextauth].ts (Pages Router)
// or app/api/auth/[...nextauth]/route.ts (App Router)

import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password required");
          }

          console.log("Attempting login for:", credentials.email);

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
            console.log("No user found with email:", credentials.email);
            throw new Error("No user found with this email");
          }

          if (!user.email) {
            console.log("User has no email address");
            throw new Error("User account has no email address");
          }

          if (!user.isActive) {
            console.log("User account is deactivated");
            throw new Error("Account is deactivated");
          }

          // Compare password with bcrypt
          if (!user.password) {
            console.log("User has no password set");
            throw new Error("User account has no password set");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            console.log("Invalid password for user:", credentials.email);
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

          console.log("Login successful for user:", user.id, name);

          // Return user object for NextAuth
          return {
            id: user.id,
            email: user.email,
            name: name,
            role: user.role,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("JWT Callback - Token:", token.sub, "User:", user?.id);
      
      if (user) {
        // First time login - store user data in token
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        console.log("Storing user data in JWT:", { 
          id: user.id, 
          role: user.role, 
          isActive: user.isActive 
        });
      } else if (token.id) {
        // Subsequent requests - validate user is still active
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              isActive: true,
            },
          });

          if (!dbUser || !dbUser.isActive) {
            console.log("User no longer active or not found:", token.id);
            return {}; // This will force logout
          }

          token.role = dbUser.role ?? "STUDENT";
          token.isActive = dbUser.isActive;
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
          return {}; // Force logout on database error
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      console.log("Session Callback - Token ID:", token.id);
      
      if (token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "STUDENT"
          | "LECTURER"
          | "DEPARTMENT_ADMIN"
          | "SCHOOL_ADMIN"
          | "SENATE_ADMIN";
        session.user.isActive = token.isActive as boolean;
        
        console.log("Session created for user:", session.user.id, session.user.role);
      } else {
        console.log("No token ID in session callback");
      }
      
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - URL:", url, "BaseURL:", baseUrl);
      
      // If url is relative, make it absolute
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log("Redirecting to:", redirectUrl);
        return redirectUrl;
      }
      
      // If url is absolute and starts with baseUrl, allow it
      if (url.startsWith(baseUrl)) {
        console.log("Allowing redirect to:", url);
        return url;
      }
      
      // Default redirect to dashboard
      const defaultUrl = `${baseUrl}/dashboard`;
      console.log("Default redirect to:", defaultUrl);
      return defaultUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
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
        domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
      },
    },
  },
};

export default NextAuth(authOptions);
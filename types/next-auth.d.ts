import "next-auth";
import "next-auth/jwt";

// Define UserRole type to match our schema
type UserRole =
  | "STUDENT"
  | "LECTURER"
  | "DEPARTMENT_ADMIN"
  | "FACULTY_ADMIN"
  | "SENATE_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      isActive: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: UserRole;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
  }
}

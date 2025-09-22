import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";

interface User {
  id: string;
  email: string;
  name: string;
  role:
    | "STUDENT"
    | "LECTURER"
    | "DEPARTMENT_ADMIN"
    | "SCHOOL_ADMIN"
    | "SENATE_ADMIN";
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      // Use session data directly from NextAuth
      const sessionUser: User = {
        id: session.user?.id || "",
        email: session.user?.email || "",
        name: session.user?.name || "",
        role: (session.user?.role as any) || "STUDENT",
        isActive: session.user?.isActive ?? true,
      };
      setUser(sessionUser);
      setIsAuthenticated(true);
      setIsLoading(false);
    } else if (status === "unauthenticated") {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const logout = () => {
    signOut({ redirect: false });
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

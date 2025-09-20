import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import AuthService, { User, AuthState } from "@/lib/auth";

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
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
  const { data: session, status } = useSession() || {
    data: null,
    status: "loading",
  };
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize dummy data
    AuthService.initializeDummyData();

    // Check NextAuth session first
    if (session?.user) {
      // Fetch complete user data from database
      const fetchUserData = async () => {
        try {
          console.log("Fetching user profile for:", session.user.id);
          const response = await fetch("/api/user/profile");
          console.log("Profile API response status:", response.status);
          if (response.ok) {
            const userData = await response.json();
            // Ensure user data has proper structure with fallbacks
            const safeUserData = {
              id: userData?.id || session.user.id,
              email: userData?.email || session.user.email || "",
              password: "",
              firstName:
                userData?.firstName || session.user.name?.split(" ")[0] || "",
              lastName:
                userData?.lastName ||
                session.user.name?.split(" ").slice(1).join(" ") ||
                "",
              role: userData?.role || session.user.role || "STUDENT",
              department: userData?.department || "",
              studentId: userData?.studentId,
              staffId: userData?.staffId,
              isActive: userData?.isActive ?? session.user.isActive ?? true,
              isVerified: userData?.isVerified ?? true,
              createdAt: userData?.createdAt || new Date().toISOString(),
            };
            setUser(safeUserData);
            setIsAuthenticated(true);
          } else {
            // If API call fails, use fallback data
            console.warn("Failed to fetch user profile, using session data");
            const fallbackUser: User = {
              id: session.user?.id || "",
              email: session.user?.email || "",
              password: "",
              firstName: session.user?.name?.split(" ")[0] || "User",
              lastName: session.user?.name?.split(" ").slice(1).join(" ") || "",
              role: (session.user?.role as any) || "STUDENT",
              department: "",
              isActive: session.user?.isActive ?? true,
              isVerified: true,
              createdAt: new Date().toISOString(),
            };
            setUser(fallbackUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to basic session data with safe defaults
          const nextAuthUser: User = {
            id: session.user?.id || "",
            email: session.user?.email || "",
            password: "",
            firstName: session.user?.name?.split(" ")[0] || "User",
            lastName: session.user?.name?.split(" ").slice(1).join(" ") || "",
            role: (session.user?.role as any) || "STUDENT",
            department: "",
            isActive: session.user?.isActive ?? true,
            isVerified: true,
            createdAt: new Date().toISOString(),
          };
          setUser(nextAuthUser);
          setIsAuthenticated(true);
        }
      };

      fetchUserData();
    } else if (status === "unauthenticated") {
      // Check for existing dummy user session as fallback
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    // This is now used as fallback for dummy accounts
    const result = await AuthService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const register = async (userData: any) => {
    const result = await AuthService.register(userData);
    if (result.success && result.user) {
      // Auto-login after registration
      setUser(result.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    // Sign out from NextAuth
    signOut({ redirect: false });

    // Also clear dummy session
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const resetPassword = async (email: string) => {
    return await AuthService.resetPassword(email);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!user) return { success: false, error: "No user logged in" };

    const result = await AuthService.changePassword(
      user.id,
      currentPassword,
      newPassword
    );
    if (result.success) {
      // Update user state
      const updatedUser = AuthService.getCurrentUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
    return result;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

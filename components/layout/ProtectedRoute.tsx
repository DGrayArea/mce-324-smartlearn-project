import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/auth";
import { isMobile, forceMobileNavigation } from "@/lib/mobileAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  // Check auth and redirect on client only
  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    if (!isAuthenticated || !user) {
      // Use mobile-specific navigation
      if (isMobile()) {
        forceMobileNavigation("/login");
      } else {
        router.push("/login");
      }
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Use mobile-specific navigation
      if (isMobile()) {
        forceMobileNavigation("/unauthorized");
      } else {
        router.push("/unauthorized");
      }
    }
  }, [isAuthenticated, user, allowedRoles, router, isLoading]);

  // Show loading spinner while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while deciding what to do
  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

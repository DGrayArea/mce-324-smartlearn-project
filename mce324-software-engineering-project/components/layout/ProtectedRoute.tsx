import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/auth";
import { useRouter } from "next/router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    router.push("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    router.push("/unauthorized");
  }

  return <>{children}</>;
};

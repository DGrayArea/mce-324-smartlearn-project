import { LoginForm } from "@/components/auth/LoginForm";
import { useSession } from "next-auth/react";
import { GraduationCap } from "lucide-react";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-medium mb-4">
          <GraduationCap className="h-6 w-6 text-primary animate-spin" />
        </div>
        <h1 className="text-3xl font-bold text-white">Loading...</h1>
        <p className="text-white/80">Checking authentication status</p>
      </div>
    </div>
  </div>
);

const Login = () => {
  const { status } = useSession();
  if (status === "loading") return <LoadingScreen />;
  return <LoginForm />;
};

export default Login;

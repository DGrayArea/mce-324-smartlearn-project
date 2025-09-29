import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
// import { SeedUsers } from "@/components/SeedUsers";
// import SeedComprehensive from "@/components/SeedComprehensive";

export const LoginForm = () => {
  const [email, setEmail] = useState("mce.admin@university.edu");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to dashboard when session is established
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Use a small delay to prevent glitching
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use NextAuth for email/password form
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "Login successful",
          description: "Welcome back to the learning platform!",
        });
        // Redirect will be handled by useEffect when session is established
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    // Validate credentials
    if (!email || !password) {
      toast({
        title: "Login Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use NextAuth for quick login with real database credentials
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "Login successful",
          description: "Welcome back to the learning platform!",
        });
        // Redirect will be handled by useEffect when session is established
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickLoginCredentials = async (roleOrKey: string) => {
    let email = "";
    const password = "password123";

    switch (roleOrKey) {
      // Students
      case "STUDENT_100":
        email = "isa-muby@university.edu"; // 100L (Muhammed Isa-Mubaraq)
        break;
      case "STUDENT_200":
        email = "mce.200l@university.edu";
        break;
      case "STUDENT_300":
        email = "mce.300l@university.edu";
        break;
      case "STUDENT_400":
        email = "mce.400l@university.edu";
        break;
      case "STUDENT_500":
        email = "mce.500l@university.edu";
        break;
      // Staff
      case "LECTURER":
        email = "folorunsho@university.edu"; // Engr. Dr. T.A Folorunsho
        break;
      case "DEPARTMENT_ADMIN":
        email = "mce.admin@university.edu"; // Engr. Dr. Gray
        break;
      case "SCHOOL_ADMIN":
        email = "seet.admin@university.edu";
        break;
      case "SENATE_ADMIN":
        email = "senate.admin@university.edu";
        break;
      default:
        console.warn(`Unknown quick login key: ${roleOrKey}`);
        return;
    }

    setEmail(email);
    setPassword(password);

    setTimeout(async () => {
      await handleQuickLogin(email, password);
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-medium mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/80">Sign in to your learning platform</p>
        </div>

        <Card className="shadow-large border-0">
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                Quick Login (click to auto-fill & sign in)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("STUDENT_100")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  Student 100L
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("LECTURER")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  Lecturer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("DEPARTMENT_ADMIN")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  Dept Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("SCHOOL_ADMIN")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  School Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("SENATE_ADMIN")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  Senate Admin
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("STUDENT_200")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  200L
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("STUDENT_300")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  300L
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("STUDENT_400")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  400L
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fillQuickLoginCredentials("STUDENT_500")}
                  className="text-xs"
                  disabled={isLoading}
                >
                  500L
                </Button>
              </div>
            </div>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </span>
            </div>

            {/* Database Setup Section - Only show in development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 space-y-4">
                {/* <SeedUsers />
                <SeedComprehensive /> */}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

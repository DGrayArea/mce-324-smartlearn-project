import { Link, Navigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Video,
  MessageSquare,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: BookOpen,
      title: "Course Management",
      description:
        "Create, organize, and deliver courses with rich content and interactive materials.",
    },
    {
      icon: Users,
      title: "Multi-Role Access",
      description:
        "Students, lecturers, and admins each have tailored experiences and permissions.",
    },
    {
      icon: Award,
      title: "Assessment & Grading",
      description:
        "Comprehensive grading system with automated result computation and approval workflow.",
    },
    {
      icon: Video,
      title: "Virtual Classrooms",
      description:
        "Integrated video meetings, live classes, and real-time collaboration tools.",
    },
    {
      icon: MessageSquare,
      title: "Communication Hub",
      description:
        "Discussion forums, chat rooms, Q&A boards, and notification system.",
    },
    {
      icon: CheckCircle,
      title: "Analytics & Reports",
      description:
        "Detailed analytics for students, courses, and system performance metrics.",
    },
  ];

  const stats = [
    { label: "Active Students", value: "10,000+" },
    { label: "Expert Lecturers", value: "500+" },
    { label: "Courses Available", value: "200+" },
    { label: "Success Rate", value: "98%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">LearnHub</span>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link className="" to="/login">
                Sign In
              </Link>
            </Button>
            <Button asChild className="bg-gradient-primary hover:opacity-90">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Transform Your Learning Experience
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            A comprehensive learning platform designed for students, lecturers,
            and administrators. Engage, learn, and succeed with our modern
            educational tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              asChild
              className="bg-white text-primary hover:bg-white/90"
            >
              <Link to="/register">
                Start Learning Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white text-primary hover:bg-white hover:text-primary"
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>

          {/* Demo Accounts */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-semibold mb-3">Try Demo Accounts</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-white/10 rounded p-2">
                <p className="font-medium">Student</p>
                <p className="text-xs opacity-80">student@demo.com</p>
              </div>
              <div className="bg-white/10 rounded p-2">
                <p className="font-medium">Lecturer</p>
                <p className="text-xs opacity-80">lecturer@demo.com</p>
              </div>
              <div className="bg-white/10 rounded p-2">
                <p className="font-medium">Admin</p>
                <p className="text-xs opacity-80">admin@demo.com</p>
              </div>
            </div>
            <p className="text-xs mt-2 opacity-80">
              Password for all demo accounts: password123
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform provides comprehensive tools for modern education,
              supporting every aspect of the learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-soft hover:shadow-medium transition-shadow"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of students and educators already using our platform.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-white text-primary hover:bg-white/90"
          >
            <Link to="/register">
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">LearnHub</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2025 LearnHub. Empowering education through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

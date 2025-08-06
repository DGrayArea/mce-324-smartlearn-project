import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import {
  BookOpen,
  Users,
  FileText,
  Award,
  TrendingUp,
  Calendar,
  Bell,
  Activity,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";

const Dashboard = () => {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case "student":
        return `Welcome back, ${user.firstName}! Ready to continue your learning journey?`;
      case "lecturer":
        return `Welcome back, ${user.firstName}! Your students are waiting for new content.`;
      case "admin":
        return `Welcome back, ${user.firstName}! The platform is running smoothly.`;
      default:
        return "Welcome to the Learning Platform!";
    }
  };

  const getQuickStats = () => {
    switch (user?.role) {
      case "student":
        return [
          {
            title: "Enrolled Courses",
            value: "6",
            icon: BookOpen,
            color: "text-primary",
            trend: { value: "+1", isPositive: true },
          },
          {
            title: "Assignments Due",
            value: "3",
            icon: Clock,
            color: "text-warning",
            trend: { value: "-2", isPositive: true },
          },
          {
            title: "Current GPA",
            value: "3.8",
            icon: Award,
            color: "text-success",
            trend: { value: "+0.2", isPositive: true },
          },
          {
            title: "Study Hours (Week)",
            value: "24h",
            icon: Activity,
            color: "text-accent",
            trend: { value: "+4h", isPositive: true },
          },
          {
            title: "Completed Tasks",
            value: "18",
            icon: CheckCircle,
            color: "text-success",
            trend: { value: "+5", isPositive: true },
          },
          {
            title: "Course Progress",
            value: "78%",
            icon: Target,
            color: "text-primary",
            trend: { value: "+12%", isPositive: true },
          },
        ];
      case "lecturer":
        return [
          {
            title: "Courses Teaching",
            value: "4",
            icon: BookOpen,
            color: "text-primary",
            trend: { value: "+1", isPositive: true },
          },
          {
            title: "Total Students",
            value: "156",
            icon: Users,
            color: "text-secondary",
            trend: { value: "+12", isPositive: true },
          },
          {
            title: "Pending Reviews",
            value: "12",
            icon: FileText,
            color: "text-warning",
            trend: { value: "-8", isPositive: true },
          },
          {
            title: "Avg Class Rating",
            value: "4.8",
            icon: Award,
            color: "text-success",
            trend: { value: "+0.3", isPositive: true },
          },
          {
            title: "Attendance Rate",
            value: "94%",
            icon: CheckCircle,
            color: "text-success",
            trend: { value: "+2%", isPositive: true },
          },
          {
            title: "Active Discussions",
            value: "28",
            icon: Activity,
            color: "text-accent",
            trend: { value: "+7", isPositive: true },
          },
        ];
      case "admin":
        return [
          {
            title: "Total Users",
            value: "1,234",
            icon: Users,
            color: "text-primary",
            trend: { value: "+87", isPositive: true },
          },
          {
            title: "Active Courses",
            value: "89",
            icon: BookOpen,
            color: "text-secondary",
            trend: { value: "+5", isPositive: true },
          },
          {
            title: "System Load",
            value: "78%",
            icon: TrendingUp,
            color: "text-warning",
            trend: { value: "+5%", isPositive: false },
          },
          {
            title: "Support Tickets",
            value: "5",
            icon: AlertTriangle,
            color: "text-destructive",
            trend: { value: "-3", isPositive: true },
          },
          {
            title: "Revenue (Month)",
            value: "$24.5k",
            icon: Award,
            color: "text-success",
            trend: { value: "+12%", isPositive: true },
          },
          {
            title: "Server Uptime",
            value: "99.9%",
            icon: CheckCircle,
            color: "text-success",
            trend: { value: "0%", isPositive: true },
          },
        ];
      default:
        return [];
    }
  };

  const getRecentActivity = () => {
    switch (user?.role) {
      case "student":
        return [
          'Completed "Introduction to Algorithms" quiz',
          'Submitted assignment for "Database Design"',
          'Joined virtual meeting for "Web Development"',
          'Downloaded lecture notes for "Data Structures"',
        ];
      case "lecturer":
        return [
          'Graded 15 assignments for "Web Development"',
          'Uploaded new lecture for "Database Systems"',
          "Scheduled virtual meeting for tomorrow",
          "Responded to 8 student questions",
        ];
      case "admin":
        return [
          "Approved 3 new course registrations",
          "Reviewed system performance metrics",
          "Updated platform security settings",
          "Processed 12 support tickets",
        ];
      default:
        return [];
    }
  };

  const stats = getQuickStats();
  const activities = getRecentActivity();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}</h1>
        <p className="text-white/80">
          Here's what's happening in your learning environment today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Analytics Charts */}
      <AnalyticsChart userRole={user?.role || "student"} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm text-muted-foreground flex-1">
                    {activity}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <QuickActions userRole={user?.role || "student"} />
      </div>
    </div>
  );
};

export default withDashboardLayout(Dashboard);

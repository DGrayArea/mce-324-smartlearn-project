import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
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
  Loader2,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: dashboardData, loading, error } = useDashboardData();

  const getWelcomeMessage = () => {
    const firstName = user?.name?.split(" ")[0] || "User";
    switch (user?.role) {
      case "STUDENT":
        return `Welcome back, ${firstName}! Ready to continue your learning journey?`;
      case "LECTURER":
        return `Welcome back, ${firstName}! Your students are waiting for new content.`;
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
        return `Welcome back, ${firstName}! The platform is running smoothly.`;
      default:
        return "Welcome to the Learning Platform!";
    }
  };

  const getQuickStats = () => {
    if (!dashboardData?.stats) return [];

    const stats = dashboardData.stats;

    switch (user?.role) {
      case "STUDENT":
        return [
          {
            title: "Enrolled Courses",
            value: stats.enrolledCourses?.toString() || "0",
            icon: BookOpen,
            color: "text-primary",
            trend: { value: "+1", isPositive: true },
          },
          {
            title: "Assignments Due",
            value: stats.pendingAssignments?.toString() || "0",
            icon: Clock,
            color: "text-warning",
            trend: { value: "-2", isPositive: true },
          },
          {
            title: "Current GPA",
            value: stats.currentGPA || "0.0",
            icon: Award,
            color: "text-success",
            trend: { value: "+0.2", isPositive: true },
          },
          {
            title: "Study Hours (Week)",
            value: stats.studyHours || "0h",
            icon: Activity,
            color: "text-accent",
            trend: { value: "+4h", isPositive: true },
          },
          {
            title: "Completed Tasks",
            value: stats.completedTasks?.toString() || "0",
            icon: CheckCircle,
            color: "text-success",
            trend: { value: "+5", isPositive: true },
          },
          {
            title: "Course Progress",
            value: stats.courseProgress || "0%",
            icon: Target,
            color: "text-primary",
            trend: { value: "+12%", isPositive: true },
          },
        ];
      case "LECTURER":
        return [
          {
            title: "Courses Teaching",
            value: stats.coursesTeaching?.toString() || "0",
            icon: BookOpen,
            color: "text-primary",
            trend: { value: "+1", isPositive: true },
          },
          {
            title: "Total Students",
            value: stats.totalStudents?.toString() || "0",
            icon: Users,
            color: "text-secondary",
            trend: { value: "+12", isPositive: true },
          },
          {
            title: "Pending Reviews",
            value: stats.pendingReviews?.toString() || "0",
            icon: FileText,
            color: "text-warning",
            trend: { value: "-8", isPositive: true },
          },
          {
            title: "Avg Class Rating",
            value: stats.avgClassRating || "0.0",
            icon: Award,
            color: "text-success",
            trend: { value: "+0.3", isPositive: true },
          },
          {
            title: "Attendance Rate",
            value: stats.attendanceRate || "0%",
            icon: CheckCircle,
            color: "text-success",
            trend: { value: "+2%", isPositive: true },
          },
          {
            title: "Active Discussions",
            value: stats.activeDiscussions?.toString() || "0",
            icon: Activity,
            color: "text-accent",
            trend: { value: "+7", isPositive: true },
          },
        ];
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
        return [
          {
            title: "Total Users",
            value: stats.totalUsers?.toString() || "0",
            icon: Users,
            color: "text-primary",
            trend: { value: "+87", isPositive: true },
          },
          {
            title: "Active Courses",
            value: stats.activeCourses?.toString() || "0",
            icon: BookOpen,
            color: "text-secondary",
            trend: { value: "+5", isPositive: true },
          },
          {
            title: "System Load",
            value: stats.systemLoad || "0%",
            icon: TrendingUp,
            color: "text-warning",
            trend: { value: "+5%", isPositive: false },
          },
          {
            title: "Support Tickets",
            value: stats.supportTickets?.toString() || "0",
            icon: AlertTriangle,
            color: "text-destructive",
            trend: { value: "-3", isPositive: true },
          },
          {
            title: "Revenue (Month)",
            value: stats.revenue || "$0k",
            icon: Award,
            color: "text-success",
            trend: { value: "+12%", isPositive: true },
          },
          {
            title: "Server Uptime",
            value: stats.serverUptime || "0%",
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
    // Use real data from API if available, otherwise fallback to hardcoded
    if (dashboardData?.recentActivity) {
      return dashboardData.recentActivity;
    }

    // Fallback data
    switch (user?.role) {
      case "STUDENT":
        return [
          'Completed "Introduction to Algorithms" quiz',
          'Submitted assignment for "Database Design"',
          'Joined virtual meeting for "Web Development"',
          'Downloaded lecture notes for "Data Structures"',
        ];
      case "LECTURER":
        return [
          'Graded 15 assignments for "Web Development"',
          'Uploaded new lecture for "Database Systems"',
          "Scheduled virtual meeting for tomorrow",
          "Responded to 8 student questions",
        ];
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
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

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-hero rounded-lg p-6 text-white">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <h1 className="text-2xl font-bold">Loading Dashboard...</h1>
          </div>
          <p className="text-white/80 mt-2">Fetching your latest data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            Error Loading Dashboard
          </h1>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-red-500">
            Showing fallback data. Please refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}</h1>
        <p className="text-white/80">
          Here&apos;s what&apos;s happening in your learning environment today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats?.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat?.title || "N/A"}
            value={stat?.value || "0"}
            icon={stat?.icon || Activity}
            color={stat?.color || "text-gray-500"}
            trend={stat?.trend || { value: "0", isPositive: true }}
          />
        )) || []}
      </div>

      {/* Analytics Charts */}
      <AnalyticsChart userRole={user?.role || "STUDENT"} />

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
              {activities?.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <p className="text-sm text-muted-foreground flex-1">
                    {activity || "No recent activity"}
                  </p>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-4">
                  No recent activity to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <QuickActions userRole={user?.role || "STUDENT"} />
      </div>
    </div>
  );
};

export default withDashboardLayout(Dashboard);

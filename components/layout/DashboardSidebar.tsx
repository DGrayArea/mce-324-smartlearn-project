import {
  Home,
  BookOpen,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  GraduationCap,
  Video,
  MessageSquare,
  ClipboardCheck,
  Award,
  UserCheck,
  HelpCircle,
  Bell,
  Star,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "My Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
    roles: ["STUDENT", "LECTURER"],
  },
  {
    title: "Course Selection",
    href: "/dashboard/student/course-selection",
    icon: ClipboardCheck,
    roles: ["STUDENT"],
  },
  {
    title: "My Grades",
    href: "/dashboard/student/grades",
    icon: Award,
    roles: ["STUDENT"],
  },
  {
    title: "Quizzes",
    href: "/dashboard/student/quizzes",
    icon: ClipboardCheck,
    roles: ["STUDENT"],
  },
  {
    title: "Course Management",
    href: "/dashboard/courses",
    icon: BookOpen,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "Assignments",
    href: "/dashboard/assignments",
    icon: FileText,
    roles: ["STUDENT", "LECTURER"],
  },
  {
    title: "Virtual Meetings",
    href: "/dashboard/student/meetings",
    icon: Video,
    roles: ["STUDENT"],
  },
  {
    title: "Virtual Meetings",
    href: "/dashboard/meetings",
    icon: Video,
    roles: ["LECTURER"],
  },
  {
    title: "Chat",
    href: "/dashboard/student/chat",
    icon: MessageSquare,
    roles: ["STUDENT"],
  },
  {
    title: "Messages & Forums",
    href: "/dashboard/messages",
    icon: MessageSquare,
    roles: ["LECTURER"],
  },
  {
    title: "Discussion Forums",
    href: "/dashboard/forums",
    icon: MessageSquare,
    roles: [
      "STUDENT",
      "LECTURER",
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Q&A Boards",
    href: "/dashboard/qa",
    icon: HelpCircle,
    roles: [
      "STUDENT",
      "LECTURER",
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Course Evaluations",
    href: "/dashboard/course-evaluations",
    icon: Star,
    roles: [
      "STUDENT",
      "LECTURER",
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Grades & Results",
    href: "/dashboard/grades",
    icon: Award,
    roles: ["LECTURER"],
  },
  {
    title: "Content Library",
    href: "/dashboard/content",
    icon: FileText,
    roles: ["LECTURER"],
  },
  {
    title: "Student Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["LECTURER"],
  },
  {
    title: "Course Registrations",
    href: "/dashboard/admin/course-registrations",
    icon: ClipboardCheck,
    roles: ["DEPARTMENT_ADMIN"],
  },
  {
    title: "Academic Sessions",
    href: "/dashboard/admin/sessions",
    icon: Calendar,
    roles: ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "Student Progression",
    href: "/dashboard/admin/student-progression",
    icon: GraduationCap,
    roles: ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "FAQ Management",
    href: "/dashboard/admin/faq-management",
    icon: HelpCircle,
    roles: ["SENATE_ADMIN"],
  },
  {
    title: "User Management",
    href: "/dashboard/users",
    icon: Users,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "Result Approval",
    href: "/dashboard/result-approval",
    icon: UserCheck,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "System Analytics",
    href: "/dashboard/system-analytics",
    icon: BarChart3,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "Advanced Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "Performance Metrics",
    href: "/dashboard/performance-metrics",
    icon: Activity,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "User Activity Monitoring",
    href: "/dashboard/admin/user-activity",
    icon: Activity,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Email Notifications",
    href: "/dashboard/email-notifications",
    icon: Bell,
    roles: ["SCHOOL_ADMIN", "DEPARTMENT_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "FAQ",
    href: "/dashboard/faq",
    icon: HelpCircle,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Support Tickets",
    href: "/dashboard/support-tickets",
    icon: HelpCircle,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Knowledge Base",
    href: "/dashboard/knowledge-base",
    icon: BookOpen,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Live Chat",
    href: "/dashboard/live-chat",
    icon: MessageSquare,
    roles: ["STUDENT", "DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"],
  },
  {
    title: "Contact Support",
    href: "/contact",
    icon: HelpCircle,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
  {
    title: "Chat Rooms",
    href: "/dashboard/chatrooms",
    icon: MessageSquare,
    roles: [
      "STUDENT",
      "LECTURER",
      "SCHOOL_ADMIN",
      "DEPARTMENT_ADMIN",
      "SENATE_ADMIN",
    ],
  },
];

export const DashboardSidebar = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { pathname } = router;

  // Show loading state while user data is being fetched
  if (isLoading || !user) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="animate-pulse bg-muted rounded-lg h-16"></div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-muted rounded-lg h-10"
            ></div>
          ))}
        </nav>
      </div>
    );
  }

  const filteredItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "text-student";
      case "LECTURER":
        return "text-lecturer";
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
        return "text-admin";
      default:
        return "text-primary";
    }
  };

  const getRoleBg = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "bg-student/10";
      case "LECTURER":
        return "bg-lecturer/10";
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
        return "bg-admin/10";
      default:
        return "bg-primary/10";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Role Badge */}
      <div className="p-4 border-b">
        <div
          className={cn(
            "flex items-center justify-center space-x-2 p-3 rounded-lg",
            getRoleBg(user?.role || "")
          )}
        >
          <GraduationCap
            className={cn("h-5 w-5", getRoleColor(user?.role || ""))}
          />
          <span
            className={cn(
              "font-semibold capitalize",
              getRoleColor(user?.role || "")
            )}
          >
            {user?.role === "DEPARTMENT_ADMIN"
              ? "Department Admin"
              : user?.role === "SCHOOL_ADMIN"
                ? "School Admin"
                : user?.role === "SENATE_ADMIN"
                  ? "Senate Admin"
                  : user?.role || "User"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
            pathname === "/dashboard/settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
};

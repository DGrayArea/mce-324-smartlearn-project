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
      "student",
      "lecturer",
      "faculty_admin",
      "department_admin",
      "senate_admin",
    ],
  },
  {
    title: "My Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
    roles: ["student", "lecturer"],
  },
  {
    title: "Course Management",
    href: "/dashboard/courses",
    icon: BookOpen,
    roles: ["faculty_admin", "department_admin", "senate_admin"],
  },
  {
    title: "Assignments",
    href: "/dashboard/assignments",
    icon: FileText,
    roles: ["student", "lecturer"],
  },
  {
    title: "Virtual Meetings",
    href: "/dashboard/meetings",
    icon: Video,
    roles: ["student", "lecturer"],
  },
  {
    title: "Messages & Forums",
    href: "/dashboard/messages",
    icon: MessageSquare,
    roles: ["student", "lecturer"],
  },
  {
    title: "Grades & Results",
    href: "/dashboard/grades",
    icon: Award,
    roles: ["student", "lecturer"],
  },
  {
    title: "Content Library",
    href: "/dashboard/content",
    icon: FileText,
    roles: ["lecturer"],
  },
  {
    title: "Student Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["lecturer"],
  },
  {
    title: "User Management",
    href: "/dashboard/users",
    icon: Users,
    roles: ["faculty_admin", "department_admin", "senate_admin"],
  },
  {
    title: "Result Approval",
    href: "/dashboard/result-approval",
    icon: UserCheck,
    roles: ["faculty_admin", "department_admin", "senate_admin"],
  },
  {
    title: "System Analytics",
    href: "/dashboard/system-analytics",
    icon: BarChart3,
    roles: ["faculty_admin", "department_admin", "senate_admin"],
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    roles: [
      "student",
      "lecturer",
      "faculty_admin",
      "department_admin",
      "senate_admin",
    ],
  },
  {
    title: "Help & Support",
    href: "/dashboard/support",
    icon: HelpCircle,
    roles: [
      "student",
      "lecturer",
      "faculty_admin",
      "department_admin",
      "senate_admin",
    ],
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: [
      "student",
      "lecturer",
      "faculty_admin",
      "department_admin",
      "senate_admin",
    ],
  },
  {
    title: "Chat Rooms",
    href: "/dashboard/chatrooms",
    icon: MessageSquare,
    roles: [
      "student",
      "lecturer",
      "faculty_admin",
      "department_admin",
      "senate_admin",
    ],
  },
];

export const DashboardSidebar = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { pathname } = router;

  const filteredItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "text-student";
      case "lecturer":
        return "text-lecturer";
      case "admin":
        return "text-admin";
      default:
        return "text-primary";
    }
  };

  const getRoleBg = (role: string) => {
    switch (role) {
      case "student":
        return "bg-student/10";
      case "lecturer":
        return "bg-lecturer/10";
      case "admin":
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
            {user?.role}
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

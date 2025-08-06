import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Users,
  FileText,
  Award,
  TrendingUp,
  Calendar,
  MessageSquare,
  Download,
  Upload,
  Settings,
  UserPlus,
  CheckCircle,
} from "lucide-react";
import { UserRole } from "@/lib/auth";
import { useRouter } from "next/router";

interface QuickActionsProps {
  userRole: UserRole;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ userRole }) => {
  const { toast } = useToast();
  const router = useRouter();

  const handleAction = (action: string, targetRoute?: string) => {
    if (targetRoute) {
      router.push(targetRoute);
    }

    toast({
      title: "Action Completed",
      description: `${action} functionality activated (demo mode)`,
    });
  };
  const renderStudentActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Browse Courses", "/dashboard/courses")}
      >
        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <span className="text-xs font-medium text-center">Browse Courses</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() =>
          handleAction("Submit Assignment", "/dashboard/assignments")
        }
      >
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
        <span className="text-xs font-medium text-center">
          Submit Assignment
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("View Schedule", "/dashboard/calendar")}
      >
        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
        <span className="text-xs font-medium text-center">View Schedule</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Check Grades", "/dashboard/grades")}
      >
        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
        <span className="text-xs font-medium text-center">Check Grades</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() =>
          handleAction("Download Notes", "/dashboard/content-library")
        }
      >
        <Download className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
        <span className="text-xs font-medium text-center">Download Notes</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Join Discussion", "/dashboard/chatrooms")}
      >
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <span className="text-xs font-medium text-center">Join Discussion</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Take Quiz")}
      >
        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
        <span className="text-xs font-medium text-center">Take Quiz</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("View Progress", "/dashboard/analytics")}
      >
        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
        <span className="text-xs font-medium text-center">View Progress</span>
      </Button>
    </div>
  );

  const renderLecturerActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() =>
          handleAction("Upload Content", "/dashboard/content-library")
        }
      >
        <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <span className="text-xs font-medium text-center">Upload Content</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Grade Students", "/dashboard/grades")}
      >
        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
        <span className="text-xs font-medium text-center">Grade Students</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Schedule Meeting", "/dashboard/meetings")}
      >
        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
        <span className="text-xs font-medium text-center">
          Schedule Meeting
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("View Analytics", "/dashboard/analytics")}
      >
        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
        <span className="text-xs font-medium text-center">View Analytics</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() =>
          handleAction("Create Assignment", "/dashboard/assignments")
        }
      >
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
        <span className="text-xs font-medium text-center">
          Create Assignment
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Answer Questions", "/dashboard/chatrooms")}
      >
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <span className="text-xs font-medium text-center">
          Answer Questions
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Manage Courses", "/dashboard/courses")}
      >
        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
        <span className="text-xs font-medium text-center">Manage Courses</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Issue Certificates")}
      >
        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
        <span className="text-xs font-medium text-center">
          Issue Certificates
        </span>
      </Button>
    </div>
  );

  const renderAdminActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() =>
          handleAction("Manage Users", "/dashboard/user-management")
        }
      >
        <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <span className="text-xs font-medium text-center">Manage Users</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Course Management", "/dashboard/courses")}
      >
        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
        <span className="text-xs font-medium text-center">
          Course Management
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() =>
          handleAction("System Analytics", "/dashboard/system-analytics")
        }
      >
        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
        <span className="text-xs font-medium text-center">
          System Analytics
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() =>
          handleAction("Approve Results", "/dashboard/result-approval")
        }
      >
        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
        <span className="text-xs font-medium text-center">Approve Results</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("System Settings", "/dashboard/settings")}
      >
        <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
        <span className="text-xs font-medium text-center">System Settings</span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Generate Reports", "/dashboard/analytics")}
      >
        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <span className="text-xs font-medium text-center">
          Generate Reports
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Monitor Activity", "/dashboard/analytics")}
      >
        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
        <span className="text-xs font-medium text-center">
          Monitor Activity
        </span>
      </Button>
      <Button
        variant="outline"
        className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow"
        onClick={() => handleAction("Support Tickets", "/dashboard/support")}
      >
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
        <span className="text-xs font-medium text-center">Support Tickets</span>
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          {userRole === "student" && "Access your learning tools and resources"}
          {userRole === "lecturer" &&
            "Manage your courses and students efficiently"}
          {userRole === "admin" && "System administration and management tools"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userRole === "student" && renderStudentActions()}
        {userRole === "lecturer" && renderLecturerActions()}
        {userRole === "admin" && renderAdminActions()}
      </CardContent>
    </Card>
  );
};

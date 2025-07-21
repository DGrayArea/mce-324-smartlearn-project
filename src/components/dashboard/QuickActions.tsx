import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  CheckCircle
} from 'lucide-react';
import { UserRole } from '@/lib/auth';

interface QuickActionsProps {
  userRole: UserRole;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ userRole }) => {
  const renderStudentActions = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="text-xs font-medium">Browse Courses</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <FileText className="h-6 w-6 text-warning" />
        <span className="text-xs font-medium">Submit Assignment</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Calendar className="h-6 w-6 text-secondary" />
        <span className="text-xs font-medium">View Schedule</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Award className="h-6 w-6 text-success" />
        <span className="text-xs font-medium">Check Grades</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Download className="h-6 w-6 text-accent" />
        <span className="text-xs font-medium">Download Notes</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <MessageSquare className="h-6 w-6 text-primary" />
        <span className="text-xs font-medium">Join Discussion</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <CheckCircle className="h-6 w-6 text-success" />
        <span className="text-xs font-medium">Take Quiz</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <TrendingUp className="h-6 w-6 text-destructive" />
        <span className="text-xs font-medium">View Progress</span>
      </Button>
    </div>
  );

  const renderLecturerActions = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Upload className="h-6 w-6 text-primary" />
        <span className="text-xs font-medium">Upload Content</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Users className="h-6 w-6 text-secondary" />
        <span className="text-xs font-medium">Grade Students</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Calendar className="h-6 w-6 text-accent" />
        <span className="text-xs font-medium">Schedule Meeting</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <TrendingUp className="h-6 w-6 text-warning" />
        <span className="text-xs font-medium">View Analytics</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <FileText className="h-6 w-6 text-destructive" />
        <span className="text-xs font-medium">Create Assignment</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <MessageSquare className="h-6 w-6 text-primary" />
        <span className="text-xs font-medium">Answer Questions</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <BookOpen className="h-6 w-6 text-secondary" />
        <span className="text-xs font-medium">Manage Courses</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Award className="h-6 w-6 text-success" />
        <span className="text-xs font-medium">Issue Certificates</span>
      </Button>
    </div>
  );

  const renderAdminActions = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <UserPlus className="h-6 w-6 text-primary" />
        <span className="text-xs font-medium">Manage Users</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <BookOpen className="h-6 w-6 text-secondary" />
        <span className="text-xs font-medium">Course Management</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <TrendingUp className="h-6 w-6 text-accent" />
        <span className="text-xs font-medium">System Analytics</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Award className="h-6 w-6 text-warning" />
        <span className="text-xs font-medium">Approve Results</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Settings className="h-6 w-6 text-destructive" />
        <span className="text-xs font-medium">System Settings</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <FileText className="h-6 w-6 text-primary" />
        <span className="text-xs font-medium">Generate Reports</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <Users className="h-6 w-6 text-secondary" />
        <span className="text-xs font-medium">Monitor Activity</span>
      </Button>
      <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-medium transition-shadow">
        <MessageSquare className="h-6 w-6 text-accent" />
        <span className="text-xs font-medium">Support Tickets</span>
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          {userRole === 'student' && 'Access your learning tools and resources'}
          {userRole === 'lecturer' && 'Manage your courses and students efficiently'}
          {userRole === 'admin' && 'System administration and management tools'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userRole === 'student' && renderStudentActions()}
        {userRole === 'lecturer' && renderLecturerActions()}
        {userRole === 'admin' && renderAdminActions()}
      </CardContent>
    </Card>
  );
};
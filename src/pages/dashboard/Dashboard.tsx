import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Award, 
  TrendingUp, 
  Calendar,
  Bell,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    switch (user?.role) {
      case 'student':
        return `Welcome back, ${user.firstName}! Ready to continue your learning journey?`;
      case 'lecturer':
        return `Welcome back, ${user.firstName}! Your students are waiting for new content.`;
      case 'admin':
        return `Welcome back, ${user.firstName}! The platform is running smoothly.`;
      default:
        return 'Welcome to the Learning Platform!';
    }
  };

  const getQuickStats = () => {
    switch (user?.role) {
      case 'student':
        return [
          { title: 'Enrolled Courses', value: '6', icon: BookOpen, color: 'text-student' },
          { title: 'Assignments Due', value: '3', icon: FileText, color: 'text-warning' },
          { title: 'Current GPA', value: '3.8', icon: Award, color: 'text-success' },
          { title: 'Study Hours', value: '24h', icon: Activity, color: 'text-primary' },
        ];
      case 'lecturer':
        return [
          { title: 'Courses Teaching', value: '4', icon: BookOpen, color: 'text-lecturer' },
          { title: 'Total Students', value: '156', icon: Users, color: 'text-primary' },
          { title: 'Pending Reviews', value: '12', icon: FileText, color: 'text-warning' },
          { title: 'Avg Class Rating', value: '4.8', icon: Award, color: 'text-success' },
        ];
      case 'admin':
        return [
          { title: 'Total Users', value: '1,234', icon: Users, color: 'text-admin' },
          { title: 'Active Courses', value: '89', icon: BookOpen, color: 'text-primary' },
          { title: 'System Load', value: '78%', icon: TrendingUp, color: 'text-warning' },
          { title: 'Support Tickets', value: '5', icon: Bell, color: 'text-destructive' },
        ];
      default:
        return [];
    }
  };

  const getRecentActivity = () => {
    switch (user?.role) {
      case 'student':
        return [
          'Completed "Introduction to Algorithms" quiz',
          'Submitted assignment for "Database Design"',
          'Joined virtual meeting for "Web Development"',
          'Downloaded lecture notes for "Data Structures"',
        ];
      case 'lecturer':
        return [
          'Graded 15 assignments for "Web Development"',
          'Uploaded new lecture for "Database Systems"',
          'Scheduled virtual meeting for tomorrow',
          'Responded to 8 student questions',
        ];
      case 'admin':
        return [
          'Approved 3 new course registrations',
          'Reviewed system performance metrics',
          'Updated platform security settings',
          'Processed 12 support tickets',
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
        <h1 className="text-2xl font-bold mb-2">
          {getWelcomeMessage()}
        </h1>
        <p className="text-white/80">
          Here's what's happening in your learning environment today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

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
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {user?.role === 'student' && (
                <>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-xs">Browse Courses</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Submit Assignment</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">View Schedule</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Award className="h-5 w-5" />
                    <span className="text-xs">Check Grades</span>
                  </Button>
                </>
              )}
              {user?.role === 'lecturer' && (
                <>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Upload Content</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Grade Students</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Schedule Meeting</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs">View Analytics</span>
                  </Button>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-xs">Course Management</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs">System Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Award className="h-5 w-5" />
                    <span className="text-xs">Approve Results</span>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
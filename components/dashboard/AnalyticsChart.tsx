import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { UserRole } from "@/lib/auth";

interface AnalyticsChartProps {
  userRole: UserRole;
}

const studentProgressData = [
  { month: "Jan", completion: 78, assignments: 12, quizzes: 8 },
  { month: "Feb", completion: 82, assignments: 15, quizzes: 10 },
  { month: "Mar", completion: 85, assignments: 18, quizzes: 12 },
  { month: "Apr", completion: 88, assignments: 20, quizzes: 14 },
  { month: "May", completion: 90, assignments: 22, quizzes: 16 },
  { month: "Jun", completion: 92, assignments: 25, quizzes: 18 },
];

const lecturerEngagementData = [
  { course: "Web Dev", enrolled: 45, active: 38, completed: 32 },
  { course: "Database", enrolled: 38, active: 35, completed: 28 },
  { course: "AI/ML", enrolled: 42, active: 39, completed: 30 },
  { course: "Mobile", enrolled: 35, active: 32, completed: 25 },
];

const adminSystemData = [
  { time: "6AM", users: 120, courses: 89, load: 65 },
  { time: "9AM", users: 450, courses: 89, load: 78 },
  { time: "12PM", users: 380, courses: 89, load: 72 },
  { time: "3PM", users: 420, courses: 89, load: 75 },
  { time: "6PM", users: 320, courses: 89, load: 68 },
  { time: "9PM", users: 180, courses: 89, load: 62 },
];

const gradeDistribution = [
  { name: "A", value: 25, color: "#22c55e" },
  { name: "B", value: 35, color: "#3b82f6" },
  { name: "C", value: 25, color: "#f59e0b" },
  { name: "D", value: 10, color: "#ef4444" },
  { name: "F", value: 5, color: "#6b7280" },
];

const enrollmentTrends = [
  { name: "Computer Science", value: 35, color: "#8b5cf6" },
  { name: "Business", value: 25, color: "#06b6d4" },
  { name: "Engineering", value: 20, color: "#10b981" },
  { name: "Arts", value: 12, color: "#f59e0b" },
  { name: "Science", value: 8, color: "#ef4444" },
];

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ userRole }) => {
  const renderStudentCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>Your completion rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                name="Completion %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
          <CardDescription>Your grades across all courses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderLecturerCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Engagement</CardTitle>
          <CardDescription>
            Student activity across your courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={lecturerEngagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="enrolled"
                fill="hsl(var(--primary))"
                name="Enrolled"
              />
              <Bar
                dataKey="active"
                fill="hsl(var(--secondary))"
                name="Active"
              />
              <Bar
                dataKey="completed"
                fill="hsl(var(--accent))"
                name="Completed"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Submissions</CardTitle>
          <CardDescription>Monthly submission trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="assignments"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                name="Assignments"
              />
              <Line
                type="monotone"
                dataKey="quizzes"
                stroke="hsl(var(--secondary))"
                strokeWidth={3}
                name="Quizzes"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdminCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>System Usage</CardTitle>
          <CardDescription>Daily active users and system load</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={adminSystemData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                name="Active Users"
              />
              <Line
                type="monotone"
                dataKey="load"
                stroke="hsl(var(--destructive))"
                strokeWidth={3}
                name="System Load %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Enrollment</CardTitle>
          <CardDescription>Student distribution by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={enrollmentTrends}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {enrollmentTrends.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  switch (userRole) {
    case "STUDENT":
      return renderStudentCharts();
    case "LECTURER":
      return renderLecturerCharts();
    case "DEPARTMENT_ADMIN":
    case "SCHOOL_ADMIN":
    case "SENATE_ADMIN":
      return renderAdminCharts();
    default:
      return null;
  }
};

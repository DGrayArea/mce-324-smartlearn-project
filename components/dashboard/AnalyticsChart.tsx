import React, { memo } from "react";
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
  userDepartment?: string;
  userSchool?: string;
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

// Enhanced admin data
const adminSystemData = [
  { time: "6AM", users: 120, courses: 89, load: 65, approvals: 5 },
  { time: "9AM", users: 450, courses: 89, load: 78, approvals: 12 },
  { time: "12PM", users: 380, courses: 89, load: 72, approvals: 8 },
  { time: "3PM", users: 420, courses: 89, load: 75, approvals: 15 },
  { time: "6PM", users: 320, courses: 89, load: 68, approvals: 10 },
  { time: "9PM", users: 180, courses: 89, load: 62, approvals: 3 },
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

// New admin data
const userRoleDistribution = [
  { name: "Students", value: 1250, color: "#3b82f6" },
  { name: "Lecturers", value: 85, color: "#10b981" },
  { name: "Department Admins", value: 15, color: "#f59e0b" },
  { name: "School Admins", value: 8, color: "#8b5cf6" },
  { name: "Senate Admins", value: 3, color: "#ef4444" },
];

const approvalStatusData = [
  { name: "Pending", value: 45, color: "#f59e0b" },
  { name: "Department Approved", value: 120, color: "#3b82f6" },
  { name: "Faculty Approved", value: 95, color: "#10b981" },
  { name: "Senate Approved", value: 280, color: "#22c55e" },
  { name: "Rejected", value: 15, color: "#ef4444" },
];

const monthlyTrends = [
  { month: "Jan", registrations: 45, approvals: 120, systemLoad: 65 },
  { month: "Feb", registrations: 52, approvals: 135, systemLoad: 68 },
  { month: "Mar", registrations: 48, approvals: 142, systemLoad: 72 },
  { month: "Apr", registrations: 61, approvals: 158, systemLoad: 75 },
  { month: "May", registrations: 55, approvals: 145, systemLoad: 78 },
  { month: "Jun", registrations: 67, approvals: 162, systemLoad: 82 },
];

// Role-specific data
const departmentCourses = [
  { course: "Web Development", students: 45, avgGrade: 3.2 },
  { course: "Database Systems", students: 38, avgGrade: 3.1 },
  { course: "Data Structures", students: 42, avgGrade: 3.3 },
  { course: "Algorithms", students: 35, avgGrade: 2.9 },
  { course: "Software Engineering", students: 40, avgGrade: 3.0 },
];

const schoolDepartments = [
  { department: "Computer Science", students: 450, courses: 25 },
  { department: "Information Technology", students: 320, courses: 18 },
  { department: "Cybersecurity", students: 280, courses: 22 },
  { department: "Data Science", students: 150, courses: 12 },
];

const systemSchools = [
  { school: "School of Computing", departments: 4, students: 1200 },
  { school: "School of Business", departments: 3, students: 800 },
  { school: "School of Engineering", departments: 5, students: 900 },
  { school: "School of Sciences", departments: 4, students: 600 },
];

export const AnalyticsChart: React.FC<AnalyticsChartProps> = memo(
  ({ userRole, userDepartment, userSchool }) => {
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
      <div className="space-y-6">
        {/* First Row - System Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Usage & Approvals</CardTitle>
              <CardDescription>
                Daily active users, system load, and approval activity
              </CardDescription>
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
                  <Line
                    type="monotone"
                    dataKey="approvals"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    name="Approvals/Hour"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
              <CardDescription>Platform users by role type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userRoleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userRoleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    labelStyle={{ color: "#374151" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Approval Status & Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Result Approval Status</CardTitle>
              <CardDescription>
                Current status of all result approvals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={approvalStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {approvalStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Current system metrics and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">99.8%</div>
                  <div className="text-sm text-blue-800">Server Uptime</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">78%</div>
                  <div className="text-sm text-green-800">System Load</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    1,361
                  </div>
                  <div className="text-sm text-purple-800">Active Users</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">45</div>
                  <div className="text-sm text-orange-800">
                    Pending Approvals
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fourth Row - Grade Distribution & Department Enrollment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Grade Distribution</CardTitle>
              <CardDescription>
                Grade distribution across all courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
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

          {userRole === "DEPARTMENT_ADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle>Department Courses</CardTitle>
                <CardDescription>Courses in your department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentCourses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="students"
                      fill="hsl(var(--primary))"
                      name="Students"
                    />
                    <Bar
                      dataKey="avgGrade"
                      fill="hsl(var(--secondary))"
                      name="Avg Grade"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {userRole === "SCHOOL_ADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle>School Departments</CardTitle>
                <CardDescription>Departments in your school</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={schoolDepartments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="students"
                      fill="hsl(var(--primary))"
                      name="Students"
                    />
                    <Bar
                      dataKey="courses"
                      fill="hsl(var(--secondary))"
                      name="Courses"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {userRole === "SENATE_ADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle>System Schools</CardTitle>
                <CardDescription>Schools across the system</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={systemSchools}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="school" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="departments"
                      fill="hsl(var(--primary))"
                      name="Departments"
                    />
                    <Bar
                      dataKey="students"
                      fill="hsl(var(--secondary))"
                      name="Students"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
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
  }
);

AnalyticsChart.displayName = "AnalyticsChart";

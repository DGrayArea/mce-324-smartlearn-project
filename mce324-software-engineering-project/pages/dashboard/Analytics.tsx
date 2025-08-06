import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Calendar,
  Download,
  Eye,
  Filter,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface AnalyticsData {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  attendance: number;
  averageGrade: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  lastActivity: string;
  engagement: "high" | "medium" | "low";
  progress: number;
}

interface CourseAnalytics {
  courseId: string;
  courseName: string;
  enrolledStudents: number;
  averageGrade: number;
  completionRate: number;
  engagementScore: number;
  assignments: number;
  activitiesThisWeek: number;
}

const studentAnalytics: AnalyticsData[] = [
  {
    id: "1",
    studentName: "Alice Johnson",
    studentId: "ST001",
    course: "CS101",
    attendance: 95,
    averageGrade: 88.5,
    assignmentsCompleted: 8,
    totalAssignments: 10,
    lastActivity: "2024-01-20 14:30",
    engagement: "high",
    progress: 85,
  },
  {
    id: "2",
    studentName: "Bob Smith",
    studentId: "ST002",
    course: "CS101",
    attendance: 78,
    averageGrade: 72.3,
    assignmentsCompleted: 6,
    totalAssignments: 10,
    lastActivity: "2024-01-19 16:45",
    engagement: "medium",
    progress: 60,
  },
  {
    id: "3",
    studentName: "Carol Williams",
    studentId: "ST003",
    course: "CS201",
    attendance: 92,
    averageGrade: 91.2,
    assignmentsCompleted: 9,
    totalAssignments: 10,
    lastActivity: "2024-01-20 12:15",
    engagement: "high",
    progress: 90,
  },
  {
    id: "4",
    studentName: "David Brown",
    studentId: "ST004",
    course: "CS201",
    attendance: 65,
    averageGrade: 68.8,
    assignmentsCompleted: 5,
    totalAssignments: 10,
    lastActivity: "2024-01-18 09:30",
    engagement: "low",
    progress: 50,
  },
];

const courseAnalytics: CourseAnalytics[] = [
  {
    courseId: "CS101",
    courseName: "Introduction to Computer Science",
    enrolledStudents: 45,
    averageGrade: 80.4,
    completionRate: 78,
    engagementScore: 82,
    assignments: 10,
    activitiesThisWeek: 34,
  },
  {
    courseId: "CS201",
    courseName: "Data Structures and Algorithms",
    enrolledStudents: 38,
    averageGrade: 75.6,
    completionRate: 71,
    engagementScore: 76,
    assignments: 12,
    activitiesThisWeek: 28,
  },
  {
    courseId: "CS301",
    courseName: "Database Design",
    enrolledStudents: 32,
    averageGrade: 83.2,
    completionRate: 85,
    engagementScore: 88,
    assignments: 8,
    activitiesThisWeek: 25,
  },
];

const Analytics = () => {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedEngagement, setSelectedEngagement] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getEngagementBadge = (engagement: string) => {
    const variants = {
      high: "default",
      medium: "secondary",
      low: "destructive",
    } as const;

    return (
      <Badge variant={variants[engagement as keyof typeof variants]}>
        {engagement}
      </Badge>
    );
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const filteredStudents = studentAnalytics.filter((student) => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourse === "all" || student.course === selectedCourse;
    const matchesEngagement =
      selectedEngagement === "all" || student.engagement === selectedEngagement;

    return matchesSearch && matchesCourse && matchesEngagement;
  });

  const courses = Array.from(new Set(studentAnalytics.map((s) => s.course)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Student Analytics
          </h2>
          <p className="text-muted-foreground">
            Track student performance, engagement, and progress across courses.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View Dashboard
          </Button>
        </div>
      </div>

      <Tabs defaultValue="student-analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="student-analytics">Student Analytics</TabsTrigger>
          <TabsTrigger value="course-overview">Course Overview</TabsTrigger>
          <TabsTrigger value="performance-trends">
            Performance Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student-analytics" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">115</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last semester
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Grade
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">79.7%</div>
                <p className="text-xs text-muted-foreground">
                  +2.3% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">
                  -5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Engagement Score
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">82%</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedEngagement}
              onValueChange={setSelectedEngagement}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Engagement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student Analytics Table */}
          <div className="grid gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {student.studentName}
                      </h3>
                      <p className="text-muted-foreground">
                        ID: {student.studentId} • Course: {student.course}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getEngagementBadge(student.engagement)}
                      <Badge variant="outline">
                        {student.averageGrade.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Attendance
                      </p>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={student.attendance}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {student.attendance}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Assignments
                      </p>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={
                            (student.assignmentsCompleted /
                              student.totalAssignments) *
                            100
                          }
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {student.assignmentsCompleted}/
                          {student.totalAssignments}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={student.progress} className="flex-1" />
                        <span className="text-sm font-medium">
                          {student.progress}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Last Activity
                      </p>
                      <p className="text-sm font-medium">
                        {student.lastActivity}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="course-overview" className="space-y-6">
          <div className="grid gap-6">
            {courseAnalytics.map((course) => (
              <Card key={course.courseId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{course.courseName}</CardTitle>
                      <CardDescription>
                        Course ID: {course.courseId}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {course.enrolledStudents} students
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Average Grade
                      </p>
                      <div className="text-2xl font-bold">
                        {course.averageGrade.toFixed(1)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Completion Rate
                      </p>
                      <div className="text-2xl font-bold">
                        {course.completionRate}%
                      </div>
                      <Progress value={course.completionRate} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Engagement Score
                      </p>
                      <div className="text-2xl font-bold">
                        {course.engagementScore}%
                      </div>
                      <Progress
                        value={course.engagementScore}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Activities This Week
                      </p>
                      <div className="text-2xl font-bold">
                        {course.activitiesThisWeek}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance-trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Track student performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>
                    Performance charts and trends visualization would be
                    displayed here
                  </p>
                  <p className="text-sm">
                    Integration with charting library (e.g., Recharts)
                    recommended
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withDashboardLayout(Analytics);

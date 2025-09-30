import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  Download,
  Filter,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";

interface GradeHistory {
  id: string;
  academicYear: string;
  semester: string;
  totalScore: number;
  grade: string;
  status: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    code: string;
    creditUnit: number;
  };
}

interface SemesterSummary {
  academicYear: string;
  semester: string;
  courses: GradeHistory[];
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
  cgpa: number;
}

const GradeHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [gradeHistory, setGradeHistory] = useState<GradeHistory[]>([]);
  const [semesterSummaries, setSemesterSummaries] = useState<SemesterSummary[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filterAcademicYear, setFilterAcademicYear] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch grade history
  const fetchGradeHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAcademicYear !== "all")
        params.append("academicYear", filterAcademicYear);
      if (filterSemester !== "all") params.append("semester", filterSemester);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const res = await fetch(
        `/api/student/grade-history?${params.toString()}`
      );
      const data = await res.json();

      if (res.ok) {
        setGradeHistory(data.gradeHistory || []);
        setSemesterSummaries(data.semesterSummaries || []);
      } else {
        throw new Error(data.message || "Failed to fetch grade history");
      }
    } catch (error) {
      console.error("Error fetching grade history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch grade history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "STUDENT") {
      fetchGradeHistory();
    }
  }, [user?.role, filterAcademicYear, filterSemester, filterStatus]);

  const getGradeBadge = (grade: string) => {
    const gradeColors: { [key: string]: string } = {
      A: "bg-green-100 text-green-800 border-green-200",
      B: "bg-blue-100 text-blue-800 border-blue-200",
      C: "bg-yellow-100 text-yellow-800 border-yellow-200",
      D: "bg-orange-100 text-orange-800 border-orange-200",
      F: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge
        className={
          gradeColors[grade] || "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {grade}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600">
            Pending
          </Badge>
        );
      case "DEPARTMENT_APPROVED":
        return (
          <Badge variant="default" className="bg-blue-600">
            Dept Approved
          </Badge>
        );
      case "FACULTY_APPROVED":
        return (
          <Badge variant="default" className="bg-green-600">
            Faculty Approved
          </Badge>
        );
      case "SENATE_APPROVED":
        return (
          <Badge variant="default" className="bg-emerald-600">
            Finalized
          </Badge>
        );
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGPABadge = (gpa: number) => {
    if (gpa >= 4.5) return "bg-green-100 text-green-800 border-green-200";
    if (gpa >= 3.5) return "bg-blue-100 text-blue-800 border-blue-200";
    if (gpa >= 2.5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (gpa >= 1.5) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const calculateOverallStats = () => {
    const allCourses = gradeHistory.filter(
      (grade) => grade.status === "SENATE_APPROVED"
    );
    const totalCredits = allCourses.reduce(
      (sum, grade) => sum + grade.course.creditUnit,
      0
    );
    const earnedCredits = allCourses.reduce((sum, grade) => {
      const gradePoints =
        grade.grade === "A"
          ? 5
          : grade.grade === "B"
            ? 4
            : grade.grade === "C"
              ? 3
              : grade.grade === "D"
                ? 2
                : 0;
      return sum + gradePoints * grade.course.creditUnit;
    }, 0);
    const cgpa = totalCredits > 0 ? earnedCredits / totalCredits : 0;

    return {
      totalCredits,
      earnedCredits,
      cgpa,
      totalCourses: allCourses.length,
    };
  };

  const overallStats = calculateOverallStats();

  if (user?.role !== "STUDENT") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only students can access grade history.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Grade History</h2>
          <p className="text-muted-foreground">
            View your academic performance across all semesters
          </p>
        </div>
        <Button onClick={fetchGradeHistory} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  CGPA
                </p>
                <p
                  className={`text-2xl font-bold ${getGPABadge(overallStats.cgpa)} px-2 py-1 rounded`}
                >
                  {overallStats.cgpa.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Courses
                </p>
                <p className="text-2xl font-bold">
                  {overallStats.totalCourses}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Credits
                </p>
                <p className="text-2xl font-bold">
                  {overallStats.totalCredits}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Earned Credits
                </p>
                <p className="text-2xl font-bold">
                  {overallStats.earnedCredits}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select
                value={filterAcademicYear}
                onValueChange={setFilterAcademicYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2022/2023">2022/2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Semester</label>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="FIRST">First Semester</SelectItem>
                  <SelectItem value="SECOND">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SENATE_APPROVED">Finalized</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade History Tabs */}
      <Tabs defaultValue="semester-view" className="space-y-4">
        <TabsList>
          <TabsTrigger value="semester-view">Semester View</TabsTrigger>
          <TabsTrigger value="all-grades">All Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="semester-view" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Loading grade history...
                </p>
              </CardContent>
            </Card>
          ) : semesterSummaries.length > 0 ? (
            <div className="space-y-4">
              {semesterSummaries.map((summary) => (
                <Card key={`${summary.academicYear}-${summary.semester}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {summary.academicYear} - {summary.semester} Semester
                        </CardTitle>
                        <CardDescription>
                          {summary.courses.length} course
                          {summary.courses.length !== 1 ? "s" : ""} •{" "}
                          {summary.totalCredits} credit units
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">GPA</div>
                        <div
                          className={`text-2xl font-bold ${getGPABadge(summary.gpa)} px-2 py-1 rounded`}
                        >
                          {summary.gpa.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summary.courses.map((grade) => (
                            <TableRow key={grade.id}>
                              <TableCell className="font-medium">
                                {grade.course.title}
                              </TableCell>
                              <TableCell>{grade.course.code}</TableCell>
                              <TableCell>{grade.course.creditUnit}</TableCell>
                              <TableCell>
                                {grade.totalScore.toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                {getGradeBadge(grade.grade)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(grade.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Grade History</h3>
                <p className="text-muted-foreground">
                  No grade history found for the selected filters.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all-grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Grades</CardTitle>
              <CardDescription>
                Complete list of all your grades across all semesters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading grades...</p>
                </div>
              ) : gradeHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradeHistory.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {grade.academicYear}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{grade.semester}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {grade.course.title}
                          </TableCell>
                          <TableCell>{grade.course.code}</TableCell>
                          <TableCell>{grade.course.creditUnit}</TableCell>
                          <TableCell>{grade.totalScore.toFixed(1)}%</TableCell>
                          <TableCell>{getGradeBadge(grade.grade)}</TableCell>
                          <TableCell>{getStatusBadge(grade.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Grades Found
                  </h3>
                  <p className="text-muted-foreground">
                    No grades found for the selected filters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withDashboardLayout(GradeHistory);

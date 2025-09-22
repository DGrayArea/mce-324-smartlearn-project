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
import {
  Award,
  TrendingUp,
  BookOpen,
  Calculator,
  Calendar,
  GraduationCap,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const StudentGrades = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [cgpa, setCgpa] = useState(0);
  const [gpa, setGpa] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      fetchGrades();
    }
  }, [user, academicYear, semester]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        academicYear,
        ...(semester !== "ALL" && { semester }),
      });

      const response = await fetch(`/api/student/grades?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGrades(data.grades || []);
        setCgpa(data.cgpa || 0);
        setGpa(data.gpa || 0);
        setStatistics(data.statistics || null);
      } else {
        throw new Error("Failed to fetch grades");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load grades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800";
      case "B":
        return "bg-blue-100 text-blue-800";
      case "C":
        return "bg-yellow-100 text-yellow-800";
      case "D":
        return "bg-orange-100 text-orange-800";
      case "F":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGradePoint = (grade: string) => {
    switch (grade) {
      case "A":
        return 5.0;
      case "B":
        return 4.0;
      case "C":
        return 3.0;
      case "D":
        return 2.0;
      case "F":
        return 0.0;
      default:
        return 0.0;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading grades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Grades</h2>
          <p className="text-muted-foreground">
            View your academic performance and grade history
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="academicYear">Academic Year:</label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2022/2023">2022/2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="semester">Semester:</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="FIRST">First</SelectItem>
                  <SelectItem value="SECOND">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPA/CGPA Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Current GPA</p>
                <p className="text-2xl font-bold">{gpa.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Cumulative GPA</p>
                <p className="text-2xl font-bold">{cgpa.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Total Courses</p>
                <p className="text-2xl font-bold">{grades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Passed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.passed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 text-red-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {statistics.failed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Credits</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.totalCredits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Pass Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {statistics.passRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
          <CardDescription>
            Your complete academic record for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Grades Available
              </h3>
              <p className="text-muted-foreground">
                No grades have been recorded for the selected period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">
                      Course Code
                    </TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Credits
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      CA Score
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Exam Score
                    </TableHead>
                    <TableHead>Total Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Grade Point
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Semester
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Academic Year
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="hidden sm:table-cell font-medium">
                        {grade.course.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="sm:hidden text-xs text-muted-foreground mb-1">
                            {grade.course.code}
                          </div>
                          <div className="truncate max-w-[200px]">
                            {grade.course.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {grade.course.creditUnit}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {grade.caScore || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {grade.examScore || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-sm font-bold">
                            {grade.totalScore}
                          </div>
                          <div className="md:hidden text-xs text-muted-foreground">
                            CA: {grade.caScore || "-"} | Exam:{" "}
                            {grade.examScore || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(grade.grade)}>
                          {grade.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getGradePoint(grade.grade).toFixed(1)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{grade.semester}</Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {grade.academicYear}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardLayout(StudentGrades);

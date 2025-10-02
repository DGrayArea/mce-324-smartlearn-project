import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  Filter,
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface StudentResult {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  level: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  academicYear: string;
  semester: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gpa: number;
  cgpa: number;
  status: string;
  lecturerName: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Level {
  value: string;
  label: string;
}

export default function AdminResultsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [results, setResults] = useState<StudentResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<StudentResult[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2024/2025");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const levels: Level[] = [
    { value: "100", label: "100 Level" },
    { value: "200", label: "200 Level" },
    { value: "300", label: "300 Level" },
    { value: "400", label: "400 Level" },
    { value: "500", label: "500 Level" },
  ];

  // Check if user has admin access
  const isAdmin =
    user?.role === "SCHOOL_ADMIN" ||
    user?.role === "DEPARTMENT_ADMIN" ||
    user?.role === "SENATE_ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch departments
        const deptResponse = await fetch("/api/admin/departments");
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.departments || []);
        }

        // Fetch results (admin overview) with filters applied server-side
        const params = new URLSearchParams();
        if (selectedAcademicYear)
          params.append("academicYear", selectedAcademicYear);
        if (selectedSemester) params.append("semester", selectedSemester);
        if (selectedLevel) params.append("level", selectedLevel);
        if (selectedStatus) params.append("status", selectedStatus);

        const resultsResponse = await fetch(
          `/api/admin/student-results-overview?${params.toString()}`
        );

        if (!resultsResponse.ok) {
          throw new Error("Failed to fetch results");
        }

        const resultsData = await resultsResponse.json();

        // resultsData.studentResults is grouped by student; flatten to table rows
        const flatRows: StudentResult[] = [];
        const studentGroups: any[] = resultsData.studentResults || [];
        for (const group of studentGroups) {
          const student = group.student;
          const cgpaValue = Number(group.cgpa || 0);
          const name: string = student?.name || "";
          const [firstName = "", ...rest] = name.split(" ");
          const lastName = rest.join(" ");
          const departmentName = student?.department?.name || "";
          const level = student?.level || "";

          for (const r of group.results || []) {
            flatRows.push({
              id: r.id,
              studentId: student?.matricNumber || student?.id || "",
              firstName,
              lastName,
              email: "", // email not provided in this payload
              department: departmentName,
              level,
              courseCode: r.course?.code || "",
              courseTitle: r.course?.title || "",
              creditUnits: Number(r.course?.creditUnit || 0),
              academicYear: r.academicYear,
              semester: r.semester,
              caScore: Number(r.caScore ?? 0),
              examScore: Number(r.examScore ?? 0),
              totalScore: Number(r.totalScore ?? 0),
              grade: r.grade,
              gpa: Number(cgpaValue),
              cgpa: Number(cgpaValue),
              status: r.status,
              lecturerName: "",
            });
          }
        }

        setResults(flatRows);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load results data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    isAdmin,
    toast,
    selectedAcademicYear,
    selectedSemester,
    selectedLevel,
    selectedStatus,
  ]);

  // Apply filters
  useEffect(() => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(
        (result) => result.department === selectedDepartment
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter((result) => result.level === selectedLevel);
    }

    if (selectedAcademicYear !== "ALL") {
      filtered = filtered.filter(
        (result) => result.academicYear === selectedAcademicYear
      );
    }

    if (selectedSemester !== "ALL") {
      filtered = filtered.filter(
        (result) => result.semester === selectedSemester
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter((result) => result.status === selectedStatus);
    }

    setFilteredResults(filtered);
    // Reset to first page whenever filters change
    setPage(1);
  }, [
    results,
    searchTerm,
    selectedDepartment,
    selectedLevel,
    selectedAcademicYear,
    selectedSemester,
    selectedStatus,
  ]);

  // Pagination derived data
  const totalRecords = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const visibleResults = filteredResults.slice(startIndex, endIndex);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENATE_APPROVED":
        return "bg-green-100 text-green-800";
      case "FACULTY_APPROVED":
        return "bg-blue-100 text-blue-800";
      case "DEPARTMENT_APPROVED":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Department",
      "Level",
      "Course Code",
      "Course Title",
      "Credit Units",
      "Academic Year",
      "Semester",
      "CA Score",
      "Exam Score",
      "Total Score",
      "Grade",
      "GPA",
      "CGPA",
      "Status",
      "Lecturer",
    ];

    const csvData = filteredResults.map((result) => [
      result.studentId,
      `${result.firstName} ${result.lastName}`,
      result.email,
      result.department,
      result.level,
      result.courseCode,
      result.courseTitle,
      result.creditUnits,
      result.academicYear,
      result.semester,
      result.caScore,
      result.examScore,
      result.totalScore,
      result.grade,
      result.gpa,
      result.cgpa,
      result.status,
      result.lecturerName,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student_results_${selectedAcademicYear}_${selectedSemester}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Helper: grade -> points
  const getGradePoints = (grade: string) => {
    switch (grade) {
      case "A":
        return 5.0;
      case "B":
        return 4.0;
      case "C":
        return 3.0;
      case "D":
        return 2.0;
      case "E":
        return 1.0;
      default:
        return 0.0;
    }
  };

  // Compute per-student GPA from currently filtered rows (page-agnostic)
  const computePerStudentGPA = () => {
    const byStudent: Record<string, { credits: number; points: number }> = {};
    for (const row of filteredResults) {
      const credits = Number(row.creditUnits || 0);
      const points = getGradePoints(row.grade) * credits;
      const key = row.studentId;
      if (!byStudent[key]) byStudent[key] = { credits: 0, points: 0 };
      byStudent[key].credits += credits;
      byStudent[key].points += points;
    }
    const gpaMap: Record<string, number> = {};
    Object.entries(byStudent).forEach(([studentId, agg]) => {
      gpaMap[studentId] = agg.credits > 0 ? agg.points / agg.credits : 0;
    });
    return gpaMap;
  };

  const exportToExcel = () => {
    const gpaMap = computePerStudentGPA();
    const rows = filteredResults.map((r) => ({
      StudentID: r.studentId,
      Name: `${r.firstName} ${r.lastName}`.trim(),
      Email: r.email,
      Department: r.department,
      Level: r.level,
      CourseCode: r.courseCode,
      CourseTitle: r.courseTitle,
      CreditUnits: r.creditUnits,
      AcademicYear: r.academicYear,
      Semester: r.semester,
      CAScore: r.caScore,
      ExamScore: r.examScore,
      TotalScore: r.totalScore,
      Grade: r.grade,
      GPA: Number((gpaMap[r.studentId] || 0).toFixed(2)),
      CGPA: Number(
        (r.cgpa || 0).toFixed ? (r.cgpa as number).toFixed(2) : r.cgpa
      ),
      Status: r.status,
      Lecturer: r.lecturerName,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(
      wb,
      `student_results_${selectedAcademicYear}_${selectedSemester}_export.xlsx`
    );
    toast({
      title: "Exported",
      description: `Exported ${rows.length} records`,
    });
  };

  const getStatistics = () => {
    const totalStudents = filteredResults.length;
    const totalCourses = new Set(filteredResults.map((r) => r.courseCode)).size;
    const averageGPA =
      filteredResults.reduce((sum, r) => sum + r.gpa, 0) / totalStudents || 0;
    const averageCGPA =
      filteredResults.reduce((sum, r) => sum + r.cgpa, 0) / totalStudents || 0;

    const gradeDistribution = filteredResults.reduce(
      (acc, result) => {
        acc[result.grade] = (acc[result.grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalStudents,
      totalCourses,
      averageGPA: averageGPA.toFixed(2),
      averageCGPA: averageCGPA.toFixed(2),
      gradeDistribution,
    };
  };

  const stats = getStatistics();

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Alert>
            <AlertDescription>
              You don&apos;t have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Student Results Overview
            </h1>
            <p className="text-muted-foreground">
              Comprehensive view of all student grades and academic performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToExcel} variant="default">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Average GPA
                  </p>
                  <p className="text-2xl font-bold">{stats.averageGPA}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Average CGPA
                  </p>
                  <p className="text-2xl font-bold">{stats.averageCGPA}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search students or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="level">Level</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select
                  value={selectedAcademicYear}
                  onValueChange={setSelectedAcademicYear}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Years</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2023/2024">2023/2024</SelectItem>
                    <SelectItem value="2022/2023">2022/2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Semesters</SelectItem>
                    <SelectItem value="FIRST">First Semester</SelectItem>
                    <SelectItem value="SECOND">Second Semester</SelectItem>
                    <SelectItem value="SUMMER">Summer Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="DEPARTMENT_APPROVED">
                      Department Approved
                    </SelectItem>
                    <SelectItem value="FACULTY_APPROVED">
                      Faculty Approved
                    </SelectItem>
                    <SelectItem value="SENATE_APPROVED">
                      Senate Approved
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Student Results ({filteredResults.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Credit Units</TableHead>
                      <TableHead>CA</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>GPA</TableHead>
                      <TableHead>CGPA</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lecturer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleResults.map((result) => (
                      <TableRow key={`${result.id}-${result.courseCode}`}>
                        <TableCell className="font-medium">
                          {result.studentId}
                        </TableCell>
                        <TableCell>
                          {result.firstName} {result.lastName}
                        </TableCell>
                        <TableCell>{result.department}</TableCell>
                        <TableCell>{result.level}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {result.courseCode}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.courseTitle}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{result.creditUnits}</TableCell>
                        <TableCell>{result.caScore}</TableCell>
                        <TableCell>{result.examScore}</TableCell>
                        <TableCell className="font-medium">
                          {result.totalScore}
                        </TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result.grade)}>
                            {result.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.gpa.toFixed(2)}</TableCell>
                        <TableCell>{result.cgpa.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.lecturerName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{endIndex} of {totalRecords}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            <div className="text-sm">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

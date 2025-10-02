import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useLecturerStudents, useLecturerResults } from "@/hooks/useSWRData";
import { mutate } from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Save,
  Send,
  Users,
  Award,
  Calculator,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const LecturerGrades = () => {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [grades, setGrades] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("FIRST");
  const [exporting, setExporting] = useState(false);

  // SWR hooks for course data
  const {
    students = [],
    isLoading: studentsLoading,
    error: studentsError,
  } = useLecturerStudents(courseId as string);

  const {
    results = [],
    isLoading: resultsLoading,
    error: resultsError,
    mutate: mutateResults,
  } = useLecturerResults(courseId as string, academicYear, semester);

  // Fetch course details separately (not covered by SWR hooks yet)
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const courseResponse = await fetch("/api/lecturer/courses");
        if (courseResponse.ok) {
          const courseData = await courseResponse.json();
          const currentCourse = courseData.courses.find(
            (c: any) => c.id === courseId
          );
          setCourse(currentCourse);
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      }
    };

    if (courseId && user?.role === "LECTURER") {
      fetchCourseDetails();
    }
  }, [courseId, user]);

  // Initialize grades when students data changes
  useEffect(() => {
    if (students.length > 0) {
      const initialGrades: Record<string, any> = {};
      students.forEach((student: any) => {
        initialGrades[student.id] = {
          caScore: 0,
          examScore: 0,
          totalScore: 0,
          grade: "F",
          includeQuizzes: true,
          quizScores: [],
        };
      });
      setGrades(initialGrades);
    }
  }, [students]);

  // Update grades with existing results
  useEffect(() => {
    if (results.length > 0) {
      setGrades((prevGrades) => {
        const updatedGrades = { ...prevGrades };
        results.forEach((result: any) => {
          if (updatedGrades[result.studentId]) {
            updatedGrades[result.studentId] = {
              ...updatedGrades[result.studentId],
              caScore: result.caScore || 0,
              examScore: result.examScore || 0,
              totalScore: result.totalScore || 0,
              grade: result.grade || "F",
            };
          }
        });
        return updatedGrades;
      });
    }
  }, [results]);

  // Handle SWR errors
  useEffect(() => {
    if (studentsError || resultsError) {
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    }
  }, [studentsError, resultsError, toast]);

  const handleGradeChange = (
    studentId: string,
    field: string,
    value: number
  ) => {
    setGrades((prev) => {
      const updated = { ...prev };

      // Apply validation guards
      if (field === "caScore") {
        // CA Score: 0-40 (40% weight)
        updated[studentId] = {
          ...updated[studentId],
          caScore: Math.min(Math.max(value, 0), 40),
        };
      } else if (field === "examScore") {
        // Exam Score: 0-60 (60% weight)
        updated[studentId] = {
          ...updated[studentId],
          examScore: Math.min(Math.max(value, 0), 60),
        };
      } else {
        updated[studentId] = { ...updated[studentId], [field]: value };
      }

      // Calculate total score (CA + Exam)
      const caScore = updated[studentId].caScore || 0;
      const examScore = updated[studentId].examScore || 0;
      updated[studentId].totalScore = caScore + examScore;

      // Calculate grade based on total score
      const totalScore = updated[studentId].totalScore;
      let grade = "F";
      if (totalScore >= 70) grade = "A";
      else if (totalScore >= 60) grade = "B";
      else if (totalScore >= 50) grade = "C";
      else if (totalScore >= 45) grade = "D";

      updated[studentId].grade = grade;

      return updated;
    });
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/lecturer/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          academicYear,
          semester,
          grades: Object.entries(grades).map(([studentId, gradeData]) => ({
            studentId,
            caScore: gradeData.caScore,
            examScore: gradeData.examScore,
            totalScore: gradeData.totalScore,
            grade: gradeData.grade,
          })),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Grades saved successfully",
        });
      } else {
        throw new Error("Failed to save grades");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save grades",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitGrades = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/lecturer/results", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          academicYear,
          semester,
          action: "submit",
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Grades submitted to department admin for review",
        });
        setShowSubmitDialog(false);
        mutateResults();
      } else {
        throw new Error("Failed to submit grades");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit grades",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportGrades = async (
    format: "csv" | "xlsx",
    includeGrades: boolean = true
  ) => {
    try {
      setExporting(true);

      const params = new URLSearchParams({
        courseId: courseId as string,
        academicYear,
        semester,
        format,
        includeGrades: includeGrades.toString(),
      });

      const response = await fetch(`/api/lecturer/export-students?${params}`);

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Students-${course?.code}-${academicYear}-${semester}-${includeGrades ? "with-grades" : "basic"}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: `Student data ${includeGrades ? "with grades" : "basic list"} exported successfully as ${format.toUpperCase()}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to export student data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error exporting student data:", error);
      toast({
        title: "Error",
        description: "Failed to export student data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-600 bg-green-100";
      case "B":
        return "text-blue-600 bg-blue-100";
      case "C":
        return "text-yellow-600 bg-yellow-100";
      case "D":
        return "text-orange-600 bg-orange-100";
      case "F":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (studentsLoading || resultsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading grades...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
        <p className="text-muted-foreground">
          You don&apos;t have access to this course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            End-of-Semester Grades
          </h2>
          <p className="text-muted-foreground">
            {course.title} ({course.code})
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/lecturer/course/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
      </div>

      {/* Academic Period Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="academicYear">Academic Year:</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="semester">Semester:</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST">First</SelectItem>
                  <SelectItem value="SECOND">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Average Score</p>
                <p className="text-2xl font-bold">
                  {students.length > 0
                    ? Math.round(
                        students.reduce(
                          (sum, student) =>
                            sum + (grades[student.id]?.totalScore || 0),
                          0
                        ) / students.length
                      )
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Pass Rate</p>
                <p className="text-2xl font-bold">
                  {students.length > 0
                    ? Math.round(
                        (students.filter(
                          (student) =>
                            (grades[student.id]?.totalScore || 0) >= 60
                        ).length /
                          students.length) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Student Grades</CardTitle>
              <CardDescription>
                Enter CA (40%) and Exam (60%) scores for each student. Total
                score is automatically calculated.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handleExportGrades("xlsx", true)}
                disabled={exporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export Excel (With Grades)"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportGrades("xlsx", false)}
                disabled={exporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export Excel (Basic)"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveGrades}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                onClick={() => handleExportGrades("csv", true)}
                disabled={exporting || students.length === 0}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export CSV (With Grades)"}
              </Button>
              <Button
                onClick={() => handleExportGrades("csv", false)}
                disabled={exporting || students.length === 0}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export CSV (Basic)"}
              </Button>
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={students.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit to Admin
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric Number</TableHead>
                  <TableHead>CA Score (40%)</TableHead>
                  <TableHead>Exam Score (60%)</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const studentGrades = grades[student.id] || {};
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.matricNumber}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="40"
                          value={studentGrades.caScore || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "caScore",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20"
                          placeholder="0-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          value={studentGrades.examScore || ""}
                          onChange={(e) =>
                            handleGradeChange(
                              student.id,
                              "examScore",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20"
                          placeholder="0-60"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {studentGrades.totalScore || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getGradeColor(studentGrades.grade || "F")}
                        >
                          {studentGrades.grade || "F"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Draft</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Grades for Review?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit grades for {students.length} students to
              the department admin for review. This action will send all grades
              to the department admin and cannot be undone.
              <br />
              <br />
              <strong>Academic Year:</strong> {academicYear}
              <br />
              <strong>Semester:</strong> {semester}
              <br />
              <strong>Course:</strong> {course.title} ({course.code})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitGrades}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for Review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withDashboardLayout(LecturerGrades);

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
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
}

interface UploadedScore {
  studentId: string;
  firstName: string;
  lastName: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  isValid: boolean;
  errors: string[];
}

export default function UploadScoresPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("FIRST");
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [uploadedScores, setUploadedScores] = useState<UploadedScore[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch lecturer's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (user?.role !== "LECTURER") return;

      try {
        const response = await fetch("/api/lecturer/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [user]);

  // Fetch students for selected course
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;

      try {
        const response = await fetch(
          `/api/lecturer/students?courseId=${selectedCourse}`
        );
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, [selectedCourse]);

  const calculateGrade = (totalScore: number): string => {
    if (totalScore >= 90) return "A";
    if (totalScore >= 80) return "B";
    if (totalScore >= 70) return "C";
    if (totalScore >= 60) return "D";
    return "F";
  };

  const validateScore = (
    score: any
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (isNaN(score) || score < 0 || score > 100) {
      errors.push("Score must be between 0 and 100");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedScores: UploadedScore[] = jsonData.map(
          (row: any, index: number) => {
            const studentId = String(
              row["Student ID"] || row["studentId"] || ""
            );
            const firstName = String(
              row["First Name"] || row["firstName"] || ""
            );
            const lastName = String(row["Last Name"] || row["lastName"] || "");
            const caScore = parseFloat(row["CA Score"] || row["caScore"] || 0);
            const examScore = parseFloat(
              row["Exam Score"] || row["examScore"] || 0
            );
            const totalScore = caScore + examScore;
            const grade = calculateGrade(totalScore);

            const caValidation = validateScore(caScore);
            const examValidation = validateScore(examScore);
            const errors = [...caValidation.errors, ...examValidation.errors];

            if (!studentId) {
              errors.push("Student ID is required");
            }

            return {
              studentId,
              firstName,
              lastName,
              caScore,
              examScore,
              totalScore,
              grade,
              isValid: errors.length === 0,
              errors,
            };
          }
        );

        setUploadedScores(processedScores);

        toast({
          title: "File Uploaded",
          description: `Processed ${processedScores.length} student records`,
        });
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to process the uploaded file",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const templateData = students.map((student) => ({
      "Student ID": student.studentId,
      "First Name": student.firstName,
      "Last Name": student.lastName,
      "CA Score": "",
      "Exam Score": "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scores");

    XLSX.writeFile(workbook, `scores_template_${selectedCourse}.xlsx`);
  };

  const handleSubmitScores = async () => {
    if (!selectedCourse || uploadedScores.length === 0) {
      toast({
        title: "Error",
        description: "Please select a course and upload scores",
        variant: "destructive",
      });
      return;
    }

    const invalidScores = uploadedScores.filter((score) => !score.isValid);
    if (invalidScores.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/lecturer/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          academicYear,
          semester,
          grades: uploadedScores.map((score) => ({
            studentId: score.studentId,
            caScore: score.caScore,
            examScore: score.examScore,
            totalScore: score.totalScore,
            grade: score.grade,
          })),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Scores uploaded and saved successfully",
        });
        setUploadedScores([]);
      } else {
        throw new Error("Failed to submit scores");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit scores",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validScores = uploadedScores.filter((score) => score.isValid);
  const invalidScores = uploadedScores.filter((score) => !score.isValid);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Upload Student Scores
          </h1>
          <p className="text-muted-foreground">
            Upload and manage student scores for your courses
          </p>
        </div>

        {/* Course Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Course Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2023/2024">2023/2024</SelectItem>
                    <SelectItem value="2022/2023">2022/2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIRST">First Semester</SelectItem>
                    <SelectItem value="SECOND">Second Semester</SelectItem>
                    <SelectItem value="SUMMER">Summer Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        {selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="file-upload">Upload Excel File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="mt-6"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Upload an Excel file with columns: Student ID, First Name,
                  Last Name, CA Score, Exam Score
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Uploaded Scores Preview */}
        {uploadedScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Uploaded Scores Preview
                <div className="flex gap-2">
                  <Badge
                    variant={validScores.length > 0 ? "default" : "secondary"}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validScores.length} Valid
                  </Badge>
                  {invalidScores.length > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {invalidScores.length} Invalid
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>CA Score</TableHead>
                      <TableHead>Exam Score</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedScores.map((score, index) => (
                      <TableRow key={index}>
                        <TableCell>{score.studentId}</TableCell>
                        <TableCell>
                          {score.firstName} {score.lastName}
                        </TableCell>
                        <TableCell>{score.caScore}</TableCell>
                        <TableCell>{score.examScore}</TableCell>
                        <TableCell>{score.totalScore}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              score.grade === "F" ? "destructive" : "default"
                            }
                          >
                            {score.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {score.isValid ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {invalidScores.length > 0 && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please fix the validation errors before submitting:
                    <ul className="mt-2 list-disc list-inside">
                      {invalidScores.map((score, index) => (
                        <li key={index}>
                          {score.studentId}: {score.errors.join(", ")}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleSubmitScores}
                  disabled={invalidScores.length > 0 || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Scores
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

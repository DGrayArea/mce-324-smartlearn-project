import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  Save,
  RefreshCw,
  Building,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import * as XLSX from "xlsx";

interface StudentResult {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    matricNumber: string;
    level: string;
    department: string;
  };
  courses: Array<{
    id: string;
    courseId: string;
    courseCode: string;
    courseTitle: string;
    creditUnit: number;
    caScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    status: string;
    academicYear: string;
    semester: string;
  }>;
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
}

interface EditableResult extends StudentResult {
  courses: Array<
    StudentResult["courses"][0] & {
      tempCaScore: number;
      tempExamScore: number;
      tempTotalScore: number;
      tempGrade: string;
      isEditing: boolean;
    }
  >;
}

const ResultApprovals = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [results, setResults] = useState<
    Record<string, Record<string, EditableResult[]>>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterAcademicYear, setFilterAcademicYear] = useState("2024/2025");
  const [editingResults, setEditingResults] = useState<Set<string>>(new Set());

  // Fetch result approvals based on user role
  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("academicYear", filterAcademicYear);

      const res = await fetch(
        `/api/admin/result-approvals?${params.toString()}`
      );
      const data = await res.json();

      if (res.ok) {
        const editableResults: Record<string, EditableResult[]> = {};

        // All roles now get resultsByLevel structure
        Object.entries(data.resultsByLevel).forEach(
          ([level, levelResults]: [string, any]) => {
            editableResults[level] = levelResults.map(
              (student: StudentResult) => ({
                ...student,
                courses: student.courses.map((course) => ({
                  ...course,
                  tempCaScore: course.caScore,
                  tempExamScore: course.examScore,
                  tempTotalScore: course.totalScore,
                  tempGrade: course.grade,
                  isEditing: false,
                })),
              })
            );
          }
        );

        setResults(editableResults);
      } else {
        throw new Error(data.message || "Failed to fetch results");
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      toast({
        title: "Error",
        description: "Failed to fetch result approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      user?.role &&
      ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role)
    ) {
      fetchResults();
    }
  }, [user?.role, filterAcademicYear]);

  // Calculate grade from total score
  const calculateGrade = (totalScore: number): string => {
    if (totalScore >= 70) return "A";
    if (totalScore >= 60) return "B";
    if (totalScore >= 50) return "C";
    if (totalScore >= 45) return "D";
    return "F";
  };

  // Handle score editing
  const handleScoreEdit = (
    key1: string,
    key2: string,
    studentIndex: number,
    courseIndex: number,
    field: "ca" | "exam",
    value: number
  ) => {
    setResults((prev) => {
      const updated = { ...prev };
      const student = updated[key1][key2][studentIndex];
      const course = student.courses[courseIndex];

      // Apply validation guards
      if (field === "ca") {
        course.tempCaScore = Math.min(Math.max(value, 0), 40);
      } else if (field === "exam") {
        course.tempExamScore = Math.min(Math.max(value, 0), 60);
      }

      // Calculate total score and grade
      course.tempTotalScore = course.tempCaScore + course.tempExamScore;
      course.tempGrade = calculateGrade(course.tempTotalScore);

      return updated;
    });
  };

  // Start editing a course
  const handleStartEdit = (
    key1: string,
    key2: string,
    studentIndex: number,
    courseIndex: number
  ) => {
    setResults((prev) => {
      const updated = { ...prev };
      updated[key1][key2][studentIndex].courses[courseIndex].isEditing = true;
      return updated;
    });

    const courseId = results[key1][key2][studentIndex].courses[courseIndex].id;
    setEditingResults((prev) => new Set(prev).add(courseId));
  };

  // Save all edited results
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates: any[] = [];

      Object.values(results).forEach((levelOrDeptResults) => {
        Object.values(levelOrDeptResults).forEach((levelResults) => {
          levelResults.forEach((student) => {
            student.courses.forEach((course) => {
              if (course.isEditing) {
                updates.push({
                  resultId: course.id,
                  caScore: course.tempCaScore,
                  examScore: course.tempExamScore,
                });
              }
            });
          });
        });
      });

      if (updates.length === 0) {
        toast({
          title: "No Changes",
          description: "No results have been edited",
        });
        return;
      }

      const res = await fetch("/api/admin/result-approvals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: `${updates.length} results updated successfully`,
        });

        // Reset editing state
        setResults((prev) => {
          const updated = { ...prev };
          Object.values(updated).forEach((levelOrDeptResults) => {
            Object.values(levelOrDeptResults).forEach((levelResults) => {
              levelResults.forEach((student) => {
                student.courses.forEach((course) => {
                  if (course.isEditing) {
                    course.isEditing = false;
                    course.caScore = course.tempCaScore;
                    course.examScore = course.tempExamScore;
                    course.totalScore = course.tempTotalScore;
                    course.grade = course.tempGrade;
                  }
                });
              });
            });
          });
          return updated;
        });

        setEditingResults(new Set());
      } else {
        throw new Error(data.message || "Failed to update results");
      }
    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error",
        description: "Failed to save results",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get grade badge color
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

  // Get GPA badge color
  const getGPABadge = (gpa: number) => {
    if (gpa >= 4.5) return "bg-green-100 text-green-800 border-green-200";
    if (gpa >= 3.5) return "bg-blue-100 text-blue-800 border-blue-200";
    if (gpa >= 2.5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (gpa >= 1.5) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData: any[] = [];

    Object.entries(results).forEach(([key1, levelOrDeptResults]) => {
      Object.entries(levelOrDeptResults).forEach(([key2, levelResults]) => {
        levelResults.forEach((student) => {
          const row: any = {
            "First Name": student.student.firstName,
            "Last Name": student.student.lastName,
            "Matric Number": student.student.matricNumber,
            Level: student.student.level,
            Department: student.student.department,
          };

          // Add course scores
          student.courses.forEach((course) => {
            row[`${course.courseCode} (CA)`] = course.caScore;
            row[`${course.courseCode} (Exam)`] = course.examScore;
            row[`${course.courseCode} (Total)`] = course.totalScore;
            row[`${course.courseCode} (Grade)`] = course.grade;
          });

          row["GPA"] = student.gpa.toFixed(2);
          exportData.push(row);
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Result Approvals");
    XLSX.writeFile(wb, `result-approvals-${filterAcademicYear}.xlsx`);
  };

  if (
    !user?.role ||
    !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role)
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access result approvals.
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
          <h2 className="text-3xl font-bold tracking-tight">
            Result Approvals
          </h2>
          <p className="text-muted-foreground">
            Review and approve student results for{" "}
            {user.role === "DEPARTMENT_ADMIN"
              ? "your department"
              : user.role === "SCHOOL_ADMIN"
                ? "your school"
                : "all schools"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <span className="font-medium">{user.role.replace("_", " ")}</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select
                value={filterAcademicYear}
                onValueChange={setFilterAcademicYear}
              >
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
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={fetchResults} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || editingResults.size === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : `Save All Changes (${editingResults.size})`}
          </Button>
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          CA Score: 0-40 | Exam Score: 0-60 | Total: Auto-calculated
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading result approvals...</p>
        </div>
      ) : Object.keys(results).length > 0 ? (
        <Tabs defaultValue={Object.keys(results)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="FIRST">First Semester</TabsTrigger>
            <TabsTrigger value="SECOND">Second Semester</TabsTrigger>
          </TabsList>

          <TabsContent value="FIRST" className="space-y-4">
            <Tabs defaultValue={Object.keys(results)[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {["100", "200", "300", "400", "500"].map((level) => (
                  <TabsTrigger key={level} value={level}>
                    {level}L
                  </TabsTrigger>
                ))}
              </TabsList>

              {["100", "200", "300", "400", "500"].map((level) => (
                <TabsContent key={level} value={level} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {level}L Results - First Semester
                      </CardTitle>
                      <CardDescription>
                        Click on scores to edit • One row per student
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="border-r">
                                First Name
                              </TableHead>
                              <TableHead className="border-r">
                                Last Name
                              </TableHead>
                              <TableHead className="border-r">
                                Matric No
                              </TableHead>
                              <TableHead className="border-r">
                                Department
                              </TableHead>
                              <TableHead className="border-r">Level</TableHead>
                              {/* Course headers will be dynamic based on available courses */}
                              <TableHead className="border-r">
                                Course 1 (CA)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 1 (Exam)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 1 (Total)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 1 (Grade)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 2 (CA)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 2 (Exam)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 2 (Total)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 2 (Grade)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 3 (CA)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 3 (Exam)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 3 (Total)
                              </TableHead>
                              <TableHead className="border-r">
                                Course 3 (Grade)
                              </TableHead>
                              <TableHead className="border-r">GPA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results[level]?.map((student, studentIndex) => (
                              <TableRow
                                key={student.student.id}
                                className="border-b"
                              >
                                <TableCell className="border-r font-medium">
                                  {student.student.firstName}
                                </TableCell>
                                <TableCell className="border-r">
                                  {student.student.lastName}
                                </TableCell>
                                <TableCell className="border-r">
                                  {student.student.matricNumber}
                                </TableCell>
                                <TableCell className="border-r">
                                  {student.student.department}
                                </TableCell>
                                <TableCell className="border-r">
                                  {student.student.level}
                                </TableCell>

                                {/* Course scores - show up to 3 courses */}
                                {[0, 1, 2].map((courseIndex) => {
                                  const course = student.courses[courseIndex];
                                  if (!course) {
                                    return (
                                      <React.Fragment key={courseIndex}>
                                        <TableCell className="border-r">
                                          -
                                        </TableCell>
                                        <TableCell className="border-r">
                                          -
                                        </TableCell>
                                        <TableCell className="border-r">
                                          -
                                        </TableCell>
                                        <TableCell className="border-r">
                                          -
                                        </TableCell>
                                      </React.Fragment>
                                    );
                                  }

                                  return (
                                    <React.Fragment key={courseIndex}>
                                      <TableCell className="border-r">
                                        {course.isEditing ? (
                                          <Input
                                            type="number"
                                            min="0"
                                            max="40"
                                            value={course.tempCaScore}
                                            onChange={(e) =>
                                              handleScoreEdit(
                                                level,
                                                level,
                                                studentIndex,
                                                courseIndex,
                                                "ca",
                                                Number(e.target.value)
                                              )
                                            }
                                            className="w-20"
                                          />
                                        ) : (
                                          <span
                                            className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                            onClick={() =>
                                              handleStartEdit(
                                                level,
                                                level,
                                                studentIndex,
                                                courseIndex
                                              )
                                            }
                                          >
                                            {course.caScore}
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="border-r">
                                        {course.isEditing ? (
                                          <Input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={course.tempExamScore}
                                            onChange={(e) =>
                                              handleScoreEdit(
                                                level,
                                                level,
                                                studentIndex,
                                                courseIndex,
                                                "exam",
                                                Number(e.target.value)
                                              )
                                            }
                                            className="w-20"
                                          />
                                        ) : (
                                          <span
                                            className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                                            onClick={() =>
                                              handleStartEdit(
                                                level,
                                                level,
                                                studentIndex,
                                                courseIndex
                                              )
                                            }
                                          >
                                            {course.examScore}
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="border-r font-medium">
                                        {course.isEditing
                                          ? course.tempTotalScore
                                          : course.totalScore}
                                      </TableCell>
                                      <TableCell className="border-r">
                                        {getGradeBadge(
                                          course.isEditing
                                            ? course.tempGrade
                                            : course.grade
                                        )}
                                      </TableCell>
                                    </React.Fragment>
                                  );
                                })}

                                <TableCell className="border-r">
                                  <Badge className={getGPABadge(student.gpa)}>
                                    {student.gpa.toFixed(2)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="SECOND" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Second Semester</h3>
                <p className="text-muted-foreground">
                  Second semester results will be available after first semester
                  approval.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              No pending results found for the selected filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default withDashboardLayout(ResultApprovals);

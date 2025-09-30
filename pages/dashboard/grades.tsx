import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { grades, studentAssignments } from "@/lib/dummyData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Calendar, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Grades = () => {
  const { user } = useAuth();
  const [academicYear, setAcademicYear] = useState<string>("2024/2025");
  const [semester, setSemester] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [gpa, setGpa] = useState<string>("0.00");
  const [cgpa, setCgpa] = useState<string>("0.00");

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const calculateGPA = () => {
    const gradedAssignments = studentAssignments.filter(
      (a) => a.grade !== undefined
    );
    if (gradedAssignments.length === 0) return 0;

    const totalPoints = gradedAssignments.reduce(
      (sum, a) => sum + (a.grade! / a.maxGrade) * 4,
      0
    );
    return (totalPoints / gradedAssignments.length).toFixed(2);
  };

  useEffect(() => {
    const fetchGrades = async () => {
      if (user?.role !== "STUDENT") return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (academicYear) params.append("academicYear", academicYear);
        if (semester) params.append("semester", semester);
        const res = await fetch(`/api/student/grades?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load grades");
        setStudentGrades(data.grades || []);
        setGpa(
          (data.gpa ?? 0).toFixed
            ? data.gpa.toFixed(2)
            : String(data.gpa || "0.00")
        );
        setCgpa(
          (data.cgpa ?? 0).toFixed
            ? data.cgpa.toFixed(2)
            : String(data.cgpa || "0.00")
        );
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [user?.role, academicYear, semester]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === "LECTURER"
              ? "Grade Management"
              : "My Grades & Results"}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "LECTURER"
              ? "Review and manage student grades and feedback."
              : "Track your academic performance and progress."}
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {user?.role === "STUDENT" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{gpa}</div>
              <p className="text-xs text-muted-foreground">
                +0.1 from last semester
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Assignments
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentAssignments.filter((a) => a.status === "graded").length}
                /{studentAssignments.length}
              </div>
              <p className="text-xs text-muted-foreground">2 pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">88.5%</div>
              <p className="text-xs text-muted-foreground">+5% improvement</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {user?.role === "LECTURER" ? "Recent Submissions" : "Grade History"}
          </h3>
          {user?.role === "STUDENT" && (
            <div className="flex items-center gap-2">
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2022/2023">2022/2023</SelectItem>
                </SelectContent>
              </Select>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="FIRST">First</SelectItem>
                  <SelectItem value="SECOND">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {user?.role === "STUDENT" && loading && (
          <div className="text-sm text-muted-foreground">Loading grades…</div>
        )}
        {user?.role === "STUDENT" && error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {(user?.role === "LECTURER" ? grades : studentGrades).map(
            (item: any, index: number) => {
              const isGrade = "student" in item;
              const gradeLetter =
                user?.role === "STUDENT" ? item.grade : item.grade;
              const percentage =
                user?.role === "STUDENT"
                  ? Math.round(item.totalScore)
                  : Math.round(
                      ((item.grade as number) / (item.maxGrade as number)) * 100
                    );

              return (
                <Card key={index}>
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {user?.role === "STUDENT"
                            ? `${item.course?.title} (${item.course?.code})`
                            : isGrade
                              ? item.assignment
                              : item.title}
                        </CardTitle>
                        <CardDescription>
                          {user?.role === "STUDENT"
                            ? `CU: ${item.course?.creditUnit ?? "-"}`
                            : isGrade
                              ? `${item.course} • Student: ${item.student}`
                              : item.course}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        {user?.role === "STUDENT" ? (
                          <>
                            <div
                              className={`text-lg font-bold ${getGradeColor(percentage)}`}
                            >
                              {gradeLetter}
                            </div>
                            <Badge variant="outline">
                              Total:{" "}
                              {item.totalScore?.toFixed?.(1) ?? item.totalScore}
                              %
                            </Badge>
                          </>
                        ) : (
                          <>
                            <div
                              className={`text-lg font-bold ${getGradeColor(percentage)}`}
                            >
                              {item.grade}/{item.maxGrade}
                            </div>
                            <Badge variant="outline">{percentage}%</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      {user?.role === "STUDENT" ? (
                        <>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>CA</span>
                            <span>{item.caScore ?? "-"}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Exam</span>
                            <span>{item.examScore ?? "-"}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Score</span>
                            <span>{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            Submitted:{" "}
                            {format(
                              new Date(
                                isGrade
                                  ? item.submissionDate
                                  : item.submissionDate!
                              ),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                        {isGrade && item.gradedDate && (
                          <div>
                            Graded:{" "}
                            {format(new Date(item.gradedDate), "MMM dd, yyyy")}
                          </div>
                        )}
                      </div>

                      {isGrade && item.feedback && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <strong>Feedback:</strong> {item.feedback}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(Grades);

import React from "react";
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

const Grades = () => {
  const { user } = useAuth();

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === "lecturer"
              ? "Grade Management"
              : "My Grades & Results"}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "lecturer"
              ? "Review and manage student grades and feedback."
              : "Track your academic performance and progress."}
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {user?.role === "student" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {calculateGPA()}
              </div>
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
        <h3 className="text-xl font-semibold">
          {user?.role === "lecturer" ? "Recent Submissions" : "Grade History"}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {(user?.role === "lecturer"
            ? grades
            : studentAssignments.filter((a) => a.grade !== undefined)
          ).map((item, index) => {
            const isGrade = "student" in item;
            const grade = isGrade ? item.grade : item.grade!;
            const maxGrade = isGrade ? item.maxGrade : item.maxGrade;
            const percentage = Math.round((grade / maxGrade) * 100);

            return (
              <Card key={index}>
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {isGrade ? item.assignment : item.title}
                      </CardTitle>
                      <CardDescription>
                        {isGrade
                          ? `${item.course} • Student: ${item.student}`
                          : item.course}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${getGradeColor(percentage)}`}
                      >
                        {grade}/{maxGrade}
                      </div>
                      <Badge variant="outline">{percentage}%</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Score</span>
                      <span>{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />

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
          })}
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(Grades);

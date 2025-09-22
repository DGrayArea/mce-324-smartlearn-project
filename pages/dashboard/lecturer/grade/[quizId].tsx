import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Award,
  Send,
  Eye,
  AlertCircle,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const LecturerGrading = () => {
  const router = useRouter();
  const { quizId } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [viewAttemptOpen, setViewAttemptOpen] = useState(false);
  const [grades, setGrades] = useState<
    Record<string, { score: number; feedback?: string }>
  >({});

  const fetchQuizAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/lecturer/quiz-attempts?quizId=${quizId}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuiz(data.quiz);
        setAttempts(data.attempts);
        setStatistics(data.statistics);
      } else {
        throw new Error("Failed to fetch quiz attempts");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load quiz attempts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [quizId, toast]);

  useEffect(() => {
    if (quizId && user?.role === "LECTURER") {
      fetchQuizAttempts();
    }
  }, [quizId, user, fetchQuizAttempts]);

  const handleGradeChange = (attemptId: string, score: number) => {
    setGrades({
      ...grades,
      [attemptId]: {
        ...grades[attemptId],
        score,
      },
    });
  };

  const handleFeedbackChange = (attemptId: string, feedback: string) => {
    setGrades({
      ...grades,
      [attemptId]: {
        ...grades[attemptId],
        feedback,
      },
    });
  };

  const handleSubmitGrades = async () => {
    const gradedAttempts = Object.entries(grades).map(([attemptId, grade]) => ({
      attemptId,
      score: grade.score,
      feedback: grade.feedback || "",
    }));

    if (gradedAttempts.length === 0) {
      toast({
        title: "No Grades to Submit",
        description: "Please grade at least one attempt before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/lecturer/quiz-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId,
          grades: gradedAttempts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Grades submitted successfully! ${data.resultsCreated} results sent to department admin for review.`,
        });
        setGrades({});
        fetchQuizAttempts();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit grades");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit grades",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number, totalPoints: number) => {
    const percentage = (score / totalPoints) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeLetter = (score: number, totalPoints: number) => {
    const percentage = (score / totalPoints) * 100;
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">
          Loading quiz attempts...
        </p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Quiz Not Found</h3>
        <p className="text-muted-foreground">
          The requested quiz could not be found or you don&apos;t have access to
          it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{quiz.title}</h2>
          <p className="text-muted-foreground">
            {quiz.course.code} - {quiz.course.title}
          </p>
        </div>
        <Button
          onClick={handleSubmitGrades}
          disabled={submitting || Object.keys(grades).length === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? "Submitting..." : "Submit Grades to Dept Admin"}
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total Attempts</p>
                  <p className="text-2xl font-bold">
                    {statistics.totalAttempts}
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
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">
                    {statistics.completedAttempts}
                  </p>
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
                    {statistics.averageScore}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attempts</CardTitle>
          <CardDescription>
            Review and grade student quiz attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Matric Number</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell className="font-medium">
                    {attempt.student.name}
                  </TableCell>
                  <TableCell>{attempt.student.matricNumber}</TableCell>
                  <TableCell>#{attempt.attemptNumber}</TableCell>
                  <TableCell>
                    {attempt.submittedAt
                      ? new Date(attempt.submittedAt).toLocaleString()
                      : "Not submitted"}
                  </TableCell>
                  <TableCell>
                    {attempt.score !== null ? (
                      <span
                        className={getScoreColor(
                          attempt.score,
                          attempt.totalPoints
                        )}
                      >
                        {attempt.score} / {attempt.totalPoints}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not graded</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.score !== null ? (
                      <Badge variant="outline">
                        {getGradeLetter(attempt.score, attempt.totalPoints)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={attempt.isCompleted ? "default" : "secondary"}
                    >
                      {attempt.isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog
                        open={viewAttemptOpen}
                        onOpenChange={setViewAttemptOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAttempt(attempt)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Quiz Attempt Details</DialogTitle>
                            <DialogDescription>
                              {attempt.student.name} - Attempt #
                              {attempt.attemptNumber}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedAttempt && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Student Score</Label>
                                  <Input
                                    type="number"
                                    value={
                                      grades[attempt.id]?.score ||
                                      attempt.score ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleGradeChange(
                                        attempt.id,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    placeholder="Enter score"
                                  />
                                </div>
                                <div>
                                  <Label>Total Points</Label>
                                  <Input value={attempt.totalPoints} disabled />
                                </div>
                              </div>
                              <div>
                                <Label>Feedback (Optional)</Label>
                                <Textarea
                                  value={grades[attempt.id]?.feedback || ""}
                                  onChange={(e) =>
                                    handleFeedbackChange(
                                      attempt.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Add feedback for the student..."
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-4">
                                <h4 className="font-semibold">Answers</h4>
                                {selectedAttempt.answers.map(
                                  (answer: any, index: number) => (
                                    <Card key={answer.id}>
                                      <CardContent className="pt-4">
                                        <div className="space-y-2">
                                          <p className="font-medium">
                                            Question {index + 1}:{" "}
                                            {answer.question.question}
                                          </p>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">
                                              Student Answer:
                                            </span>
                                            <span className="font-medium">
                                              {answer.answer}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">
                                              Correct Answer:
                                            </span>
                                            <span className="font-medium">
                                              {answer.question.correctAnswer}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm text-muted-foreground">
                                              Points:
                                            </span>
                                            <span
                                              className={`font-medium ${answer.isCorrect ? "text-green-600" : "text-red-600"}`}
                                            >
                                              {answer.pointsEarned} /{" "}
                                              {answer.question.points}
                                            </span>
                                            {answer.isCorrect ? (
                                              <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-red-600" />
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardLayout(LecturerGrading);

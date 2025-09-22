import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Award,
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const StudentQuizzes = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      fetchStudentCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchQuizzesForCourse(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchStudentCourses = async () => {
    try {
      const response = await fetch("/api/student/course-registration");
      if (response.ok) {
        const data = await response.json();
        const enrolledCourses =
          data.currentEnrollments?.map((enrollment: any) => ({
            id: enrollment.course.id,
            title: enrollment.course.title,
            code: enrollment.course.code,
          })) || [];
        setCourses(enrolledCourses);
        if (enrolledCourses.length > 0) {
          setSelectedCourse(enrolledCourses[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzesForCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/quiz?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      } else {
        setQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const getQuizStatus = (quiz: any) => {
    const now = new Date();
    const startDate = new Date(quiz.startDate);
    const endDate = new Date(quiz.endDate);

    if (now < startDate) {
      return { status: "upcoming", color: "blue", icon: Calendar };
    } else if (now > endDate) {
      return { status: "expired", color: "gray", icon: XCircle };
    } else {
      return { status: "available", color: "green", icon: Play };
    }
  };

  const canTakeQuiz = (quiz: any) => {
    const now = new Date();
    const startDate = new Date(quiz.startDate);
    const endDate = new Date(quiz.endDate);
    return (
      now >= startDate &&
      now <= endDate &&
      quiz._count.quizAttempts < quiz.attempts
    );
  };

  const handleTakeQuiz = (quizId: string) => {
    router.push(`/dashboard/student/quiz/${quizId}`);
  };

  if (loading && courses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading quizzes...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Enrolled Courses</h3>
        <p className="text-muted-foreground mb-4">
          You need to be enrolled in courses to see available quizzes.
        </p>
        <Button onClick={() => router.push("/dashboard/courses")}>
          View Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Available Quizzes
          </h2>
          <p className="text-muted-foreground">
            Take quizzes for your enrolled courses
          </p>
        </div>
      </div>

      {/* Course Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="course-select">Select Course:</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose a course" />
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
        </CardContent>
      </Card>

      {/* Quizzes List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading quizzes...
          </p>
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quizzes Available</h3>
            <p className="text-muted-foreground">
              There are no quizzes available for the selected course at this
              time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const statusInfo = getQuizStatus(quiz);
            const StatusIcon = statusInfo.icon;
            const canTake = canTakeQuiz(quiz);

            return (
              <Card key={quiz.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2">
                      {quiz.type}
                    </Badge>
                    <div
                      className={`flex items-center text-${statusInfo.color}-600`}
                    >
                      <StatusIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs capitalize">
                        {statusInfo.status}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  {quiz.description && (
                    <CardDescription>{quiz.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{quiz.totalPoints} points</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{quiz.timeLimit || "No limit"} min</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {new Date(quiz.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">
                        {quiz._count.quizAttempts} / {quiz.attempts} attempts
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {canTake ? (
                      <Button
                        className="w-full"
                        onClick={() => handleTakeQuiz(quiz.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Take Quiz
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        {quiz._count.quizAttempts >= quiz.attempts ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Max Attempts Reached
                          </>
                        ) : statusInfo.status === "upcoming" ? (
                          <>
                            <Calendar className="h-4 w-4 mr-2" />
                            Not Yet Available
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Quiz Expired
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default withDashboardLayout(StudentQuizzes);

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useSWRData";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  BookOpen,
  Calculator,
  CheckCircle,
  Clock,
  Send,
  ArrowLeft,
  GraduationCap,
  Calendar,
  CreditCard,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  code: string;
  creditUnit: number;
  description: string;
  type: string;
  level: number;
  semester: string;
  department: {
    name: string;
    code: string;
  };
  school: {
    name: string;
    code: string;
  };
  recommendationScore: number;
  recommendationReason: string;
  category: string;
  isRecommended: boolean;
  isRequired: boolean;
  adminNotes?: string;
  configuredBy?: string;
}

interface SelectedCourses {
  firstSemester: string[];
  secondSemester: string[];
}

const StudentCourseSelectionNew = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourses>({
    firstSemester: [],
    secondSemester: [],
  });

  // Get available courses
  const {
    courses: availableCourses = [],
    isLoading: coursesLoading,
    error: coursesError,
    mutate: mutateCourses,
  } = useCourses(user?.role || "");

  // Filter courses by semester
  const firstSemesterCourses = availableCourses.filter(
    (course: Course) => course.semester === "FIRST"
  );
  const secondSemesterCourses = availableCourses.filter(
    (course: Course) => course.semester === "SECOND"
  );

  // Calculate credits
  const getTotalCredits = (courseIds: string[], courses: Course[]) => {
    return courseIds.reduce((total, courseId) => {
      const course = courses.find((c) => c.id === courseId);
      return total + (course?.creditUnit || 0);
    }, 0);
  };

  const firstSemesterCredits = getTotalCredits(
    selectedCourses.firstSemester,
    firstSemesterCourses
  );
  const secondSemesterCredits = getTotalCredits(
    selectedCourses.secondSemester,
    secondSemesterCourses
  );
  const totalCredits = firstSemesterCredits + secondSemesterCredits;

  const maxCreditsPerSemester = 18;
  const maxTotalCredits = 36;

  // Handle course selection
  const handleCourseToggle = (
    courseId: string,
    semester: "firstSemester" | "secondSemester"
  ) => {
    const isSelected = selectedCourses[semester].includes(courseId);
    const courses =
      semester === "firstSemester"
        ? firstSemesterCourses
        : secondSemesterCourses;
    const course = courses.find((c) => c.id === courseId);

    if (!course) return;

    if (isSelected) {
      // Remove course
      setSelectedCourses((prev) => ({
        ...prev,
        [semester]: prev[semester].filter((id) => id !== courseId),
      }));
    } else {
      // Check credit limits
      const currentCredits = getTotalCredits(
        selectedCourses[semester],
        courses
      );
      if (currentCredits + course.creditUnit > maxCreditsPerSemester) {
        toast({
          title: "Semester Credit Limit Exceeded",
          description: `Adding this course would exceed the maximum credit limit of ${maxCreditsPerSemester} credits per semester.`,
          variant: "destructive",
        });
        return;
      }

      const newTotalCredits = totalCredits + course.creditUnit;
      if (newTotalCredits > maxTotalCredits) {
        toast({
          title: "Total Credit Limit Exceeded",
          description: `Adding this course would exceed the maximum total credit limit of ${maxTotalCredits} credits.`,
          variant: "destructive",
        });
        return;
      }

      // Add course
      setSelectedCourses((prev) => ({
        ...prev,
        [semester]: [...prev[semester], courseId],
      }));
    }
  };

  // Submit registration
  const handleSubmitRegistration = async () => {
    const allSelectedCourses = [
      ...selectedCourses.firstSemester,
      ...selectedCourses.secondSemester,
    ];

    if (allSelectedCourses.length === 0) {
      toast({
        title: "No Courses Selected",
        description: "Please select at least one course before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/student/course-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedCourseIds: allSelectedCourses,
          academicYear,
          semester: "BOTH", // Indicate both semesters
          firstSemesterCourses: selectedCourses.firstSemester,
          secondSemesterCourses: selectedCourses.secondSemester,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit course selection");
      }

      toast({
        title: "Success",
        description:
          "Course selection submitted successfully! Your registration is now under review.",
      });

      // Refresh data
      mutateCourses();

      // Navigate back to courses page
      router.push("/dashboard/courses");
    } catch (error) {
      console.error("Submit registration error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit course selection",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  // Handle SWR errors
  useEffect(() => {
    if (coursesError) {
      toast({
        title: "Error",
        description: "Failed to load available courses",
        variant: "destructive",
      });
    }
  }, [coursesError, toast]);

  const renderCourseCard = (
    course: Course,
    semester: "firstSemester" | "secondSemester"
  ) => {
    const isSelected = selectedCourses[semester].includes(course.id);
    const isRecommended = course.isRecommended;
    const isRequired = course.isRequired;

    return (
      <Card
        key={course.id}
        className={`relative ${isSelected ? "ring-2 ring-primary" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleCourseToggle(course.id, semester)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline">{course.code}</Badge>
                  <Badge variant="secondary">{course.creditUnit} credits</Badge>
                  {isRequired && <Badge variant="destructive">Required</Badge>}
                  {isRecommended && (
                    <Badge variant="default">Recommended</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="mt-1">
                  {course.department.name} • {course.school.name}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {course.description}
          </p>

          {course.recommendationReason && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span>{course.recommendationReason}</span>
            </div>
          )}

          {course.adminNotes && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              <strong>Admin Note:</strong> {course.adminNotes}
            </div>
          )}

          {course.configuredBy && (
            <div className="text-xs text-muted-foreground mt-2">
              Configured by: {course.configuredBy}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Course Selection</h1>
            <p className="text-muted-foreground">
              Select courses for both semesters
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">
              Loading available courses...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Selection</h1>
          <p className="text-muted-foreground">
            Select courses for both semesters
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/courses")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      {/* Academic Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Academic Year</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024/2025">2024/2025</SelectItem>
              <SelectItem value="2025/2026">2025/2026</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Selection Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {firstSemesterCredits}
              </div>
              <div className="text-sm text-muted-foreground">
                First Semester Credits
              </div>
              <Progress
                value={(firstSemesterCredits / maxCreditsPerSemester) * 100}
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {secondSemesterCredits}
              </div>
              <div className="text-sm text-muted-foreground">
                Second Semester Credits
              </div>
              <Progress
                value={(secondSemesterCredits / maxCreditsPerSemester) * 100}
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {totalCredits}
              </div>
              <div className="text-sm text-muted-foreground">Total Credits</div>
              <Progress
                value={(totalCredits / maxTotalCredits) * 100}
                className="mt-2"
              />
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>• Maximum {maxCreditsPerSemester} credits per semester</p>
            <p>• Maximum {maxTotalCredits} credits total</p>
            <p>
              • Selected{" "}
              {selectedCourses.firstSemester.length +
                selectedCourses.secondSemester.length}{" "}
              courses
            </p>
          </div>
        </CardContent>
      </Card>

      {/* First Semester Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>First Semester Courses</span>
            <Badge variant="outline">
              {firstSemesterCourses.length} available
            </Badge>
          </CardTitle>
          <CardDescription>
            Select courses for the first semester. Maximum{" "}
            {maxCreditsPerSemester} credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {firstSemesterCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No courses available for first semester
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {firstSemesterCourses.map((course: Course) =>
                renderCourseCard(course, "firstSemester")
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Second Semester Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Second Semester Courses</span>
            <Badge variant="outline">
              {secondSemesterCourses.length} available
            </Badge>
          </CardTitle>
          <CardDescription>
            Select courses for the second semester. Maximum{" "}
            {maxCreditsPerSemester} credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {secondSemesterCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No courses available for second semester
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {secondSemesterCourses.map((course: Course) =>
                renderCourseCard(course, "secondSemester")
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => setShowSubmitDialog(true)}
          disabled={
            selectedCourses.firstSemester.length === 0 &&
            selectedCourses.secondSemester.length === 0
          }
          className="px-8"
        >
          <Send className="h-5 w-5 mr-2" />
          Submit Course Selection for Review
        </Button>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Course Selection</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit your course selection for review. This
              will include:
              <br />
              <br />
              <strong>First Semester:</strong>{" "}
              {selectedCourses.firstSemester.length} courses (
              {firstSemesterCredits} credits)
              <br />
              <strong>Second Semester:</strong>{" "}
              {selectedCourses.secondSemester.length} courses (
              {secondSemesterCredits} credits)
              <br />
              <strong>Total:</strong>{" "}
              {selectedCourses.firstSemester.length +
                selectedCourses.secondSemester.length}{" "}
              courses ({totalCredits} credits)
              <br />
              <br />
              Your selection will be reviewed by your department admin before
              approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitRegistration}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withDashboardLayout(StudentCourseSelectionNew);

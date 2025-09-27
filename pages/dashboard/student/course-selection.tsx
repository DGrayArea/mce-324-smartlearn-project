import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseSelection } from "@/hooks/useSWRData";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Award,
  ArrowLeft,
  Save,
  Send,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const StudentCourseSelection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("FIRST");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // SWR hook for course selection data
  const {
    requiredCourses = [],
    electiveCourses = [],
    carryOverCourses = [],
    selectedCourseIds = [],
    existingRegistration,
    currentCredits = 0,
    remainingCredits = 24,
    registrationStatus = "NOT_STARTED",
    isLoading,
    error,
    mutate: mutateCourseSelection
  } = useCourseSelection(academicYear, semester);

  const [maxCredits] = useState(24);

  // Local state for selected courses (for optimistic updates)
  const [localSelectedCourseIds, setLocalSelectedCourseIds] = useState<string[]>([]);
  const [localCurrentCredits, setLocalCurrentCredits] = useState(0);
  const [localRemainingCredits, setLocalRemainingCredits] = useState(24);

  // Sync local state with SWR data
  useEffect(() => {
    if (selectedCourseIds.length > 0) {
      setLocalSelectedCourseIds(selectedCourseIds);
      setLocalCurrentCredits(currentCredits);
      setLocalRemainingCredits(remainingCredits);
    }
  }, [selectedCourseIds, currentCredits, remainingCredits]);

  // Handle SWR errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load course selection",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCourseToggle = (courseId: string, creditUnit: number) => {
    const isSelected = localSelectedCourseIds.includes(courseId);

    if (isSelected) {
      // Remove course
      setLocalSelectedCourseIds((prev) => prev.filter((id) => id !== courseId));
      setLocalCurrentCredits((prev) => prev - creditUnit);
      setLocalRemainingCredits((prev) => prev + creditUnit);
    } else {
      // Add course (check credit limit)
      if (localCurrentCredits + creditUnit > maxCredits) {
        toast({
          title: "Credit Limit Exceeded",
          description: `Adding this course would exceed the maximum credit limit of ${maxCredits} credits. Please remove another course first.`,
          variant: "destructive",
        });
        return;
      }

      setLocalSelectedCourseIds((prev) => [...prev, courseId]);
      setLocalCurrentCredits((prev) => prev + creditUnit);
      setLocalRemainingCredits((prev) => prev - creditUnit);
    }
  };

  const handleSubmitRegistration = async () => {
    if (localSelectedCourseIds.length === 0) {
      toast({
        title: "No Courses Selected",
        description: "Please select at least one course before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = existingRegistration ? "PUT" : "POST";
      const response = await fetch("/api/student/course-selection", {
        method: endpoint,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedCourseIds: localSelectedCourseIds,
          academicYear,
          semester,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        setShowSubmitDialog(false);
        // Revalidate SWR data
        mutateCourseSelection();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit registration");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit course registration",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "DEPARTMENT_APPROVED":
        return "bg-green-100 text-green-800";
      case "DEPARTMENT_REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "DEPARTMENT_APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "DEPARTMENT_REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">
          Loading course selection...
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
            Course Selection
          </h2>
          <p className="text-muted-foreground">
            Select your courses for the {semester.toLowerCase()} semester
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

      {/* Registration Status */}
      {existingRegistration && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(existingRegistration.status)}
                <div>
                  <h3 className="font-semibold">Registration Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted on{" "}
                    {new Date(
                      existingRegistration.submittedAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(existingRegistration.status)}>
                {existingRegistration.status.replace("_", " ")}
              </Badge>
            </div>
            {existingRegistration.comments && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Admin Comments:</strong>{" "}
                  {existingRegistration.comments}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Current Credits</p>
                <p className="text-2xl font-bold">{localCurrentCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Remaining Credits</p>
                <p className="text-2xl font-bold">{localRemainingCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Selected Courses</p>
                <p className="text-2xl font-bold">{localSelectedCourseIds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carry-over Courses */}
      {carryOverCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Carry-over Courses
            </CardTitle>
            <CardDescription>
              Courses you failed in previous attempts that are available this
              semester
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carryOverCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={localSelectedCourseIds.includes(course.id)}
                      onCheckedChange={() =>
                        handleCourseToggle(course.id, course.creditUnit)
                      }
                    />
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.code} • {course.creditUnit} credits
                      </p>
                      <p className="text-xs text-orange-600">
                        Failed in {course.failedIn}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Carry-over
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Required Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Required Courses</CardTitle>
          <CardDescription>
            Courses that are mandatory for your level and department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={localSelectedCourseIds.includes(course.id)}
                    onCheckedChange={() =>
                      handleCourseToggle(course.id, course.creditUnit)
                    }
                  />
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.code} • {course.creditUnit} credits •{" "}
                      {course.level}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="text-xs">
                  Required
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Elective Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Elective Courses</CardTitle>
          <CardDescription>
            Optional courses you can choose from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {electiveCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={localSelectedCourseIds.includes(course.id)}
                    onCheckedChange={() =>
                      handleCourseToggle(course.id, course.creditUnit)
                    }
                  />
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.code} • {course.creditUnit} credits •{" "}
                      {course.level}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Elective
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/courses")}
        >
          Cancel
        </Button>
        <Button
          onClick={() => setShowSubmitDialog(true)}
          disabled={
            localSelectedCourseIds.length === 0 ||
            registrationStatus === "DEPARTMENT_APPROVED"
          }
        >
          <Send className="h-4 w-4 mr-2" />
          {existingRegistration ? "Update Registration" : "Submit Registration"}
        </Button>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Course Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit your course selection for the{" "}
              {academicYear} {semester.toLowerCase()} semester.
              <br />
              <br />
              <strong>Selected Courses:</strong> {localSelectedCourseIds.length}
              <br />
              <strong>Total Credits:</strong> {localCurrentCredits}
              <br />
              <strong>Remaining Credits:</strong> {localRemainingCredits}
              <br />
              <br />
              Your registration will be sent to your department admin for review
              and approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitRegistration}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withDashboardLayout(StudentCourseSelection);

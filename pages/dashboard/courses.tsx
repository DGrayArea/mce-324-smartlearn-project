import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { studentCourses, lecturerCourses, allCourses } from "@/lib/dummyData";
import {
  useCourses,
  useEnrolledCourses,
  useAdminCourses,
  useAdminSchools,
  useAdminDepartments,
  revalidateCourseData,
} from "@/hooks/useSWRData";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
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
  Calendar,
  Clock,
  Bookmark,
  Users,
  Plus,
  UserCheck,
  Settings,
  Database,
  FileText,
  Award,
  Calculator,
  GraduationCap,
} from "lucide-react";
import CourseFeedback from "@/components/dashboard/CourseFeedback";
import CourseForm from "@/components/dashboard/CourseForm";
import DepartmentCourseSelection from "@/components/dashboard/DepartmentCourseSelection";
import DepartmentCourseSelectionInterface from "@/components/dashboard/DepartmentCourseSelectionInterface";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const Courses = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  // SWR hooks for data fetching
  // For students, use enrolled courses; for others, use the regular courses hook
  const {
    courses: swrCourses,
    isLoading: coursesLoading,
    error: coursesError,
    mutate: mutateCourses,
  } = useCourses(user?.role === "STUDENT" ? "LECTURER" : user?.role || ""); // Use lecturer role to avoid student courses

  const {
    enrolledCourses,
    pendingCourses,
    totalEnrolled,
    totalPending,
    isLoading: enrolledLoading,
    error: enrolledError,
    mutate: mutateEnrolled,
  } = useEnrolledCourses();

  // Only fetch admin data if user is an admin
  const { courses: adminCourses, mutate: mutateAdminCourses } =
    useAdminCourses();

  const { schools } = useAdminSchools();
  const { departments } = useAdminDepartments();

  // Local state for UI
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [submittingEnrollment, setSubmittingEnrollment] = useState(false);
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("FIRST");
  
  // New comprehensive course selection states
  const [courseSelectionOpen, setCourseSelectionOpen] = useState(false);
  const [selectedCoursesForRegistration, setSelectedCoursesForRegistration] = useState<{
    firstSemester: string[];
    secondSemester: string[];
  }>({
    firstSemester: [],
    secondSemester: [],
  });
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Course assignment states for department admins
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [assignableCourses, setAssignableCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Course creation states for admins
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [adminLevel, setAdminLevel] = useState<string>("");

  // Department course selection states
  const [departmentCourseOpen, setDepartmentCourseOpen] = useState(false);
  const [departmentCourseSelectionOpen, setDepartmentCourseSelectionOpen] =
    useState(false);

  // Seeding states
  const [seedingOpen, setSeedingOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedingData, setSeedingData] = useState<any>(null);
  const [purgeOnly, setPurgeOnly] = useState(false);

  // Helper function to check admin roles
  const isAdmin = (role: string | undefined) => {
    if (!role) return false;
    const adminRoles = [
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
      "department_admin",
      "school_admin",
      "senate_admin",
      "admin",
    ];
    return adminRoles.includes(role);
  };

  const isDepartmentAdmin = (role: string | undefined) => {
    if (!role) return false;
    return role === "DEPARTMENT_ADMIN" || role === "department_admin";
  };

  const isSchoolAdmin = (role: string | undefined) => {
    if (!role) return false;
    return role === "SCHOOL_ADMIN" || role === "school_admin";
  };

  const isSenateAdmin = (role: string | undefined) => {
    if (!role) return false;
    return role === "SENATE_ADMIN" || role === "senate_admin";
  };

  // Get courses based on user role and SWR data
  const getCourses = () => {
    if (user?.role === "STUDENT") {
      if (enrolledLoading) return [];
      if (enrolledError) return studentCourses; // Fallback to dummy data
      return [...enrolledCourses, ...pendingCourses]; // Combine enrolled and pending courses
    }

    if (coursesLoading) return [];

    if (coursesError) {
      // Fallback to dummy data on error
      switch (user?.role) {
        case "LECTURER":
          return lecturerCourses;
        default:
          return allCourses;
      }
    }

    return swrCourses || [];
  };

  const courses = getCourses();

  const fetchAvailableCourses = useCallback(async () => {
    if (!enrollmentOpen) return;

    try {
      const response = await fetch(
        `/api/course/available?academicYear=${academicYear}&semester=${semester}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      setAvailableCourses(data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load available courses",
        variant: "destructive",
      });
    }
  }, [enrollmentOpen, academicYear, semester, toast]);
  console.log(availableCourses);
  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      const response = await fetch("/api/student/course-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          academicYear,
          semester,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to enroll in course");
      }

      toast({
        title: "Success",
        description:
          data.message || "Course added to registration successfully!",
      });

      // Remove course from available list since it's now in registration
      setAvailableCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      // Refresh course data
      mutateCourses();
    } catch (error) {
      console.error("Enrollment error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setEnrolling(null);
    }
  };

  // Handle course selection with checkboxes
  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  // Handle batch enrollment for selected courses
  const handleBatchEnroll = async () => {
    if (selectedCourses.length === 0) {
      toast({
        title: "No Courses Selected",
        description: "Please select at least one course to enroll.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingEnrollment(true);
    try {
      // Enroll in each selected course
      const enrollmentPromises = selectedCourses.map((courseId) =>
        fetch("/api/student/course-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            academicYear,
            semester,
          }),
        })
      );

      const responses = await Promise.all(enrollmentPromises);
      const results = await Promise.all(responses.map((res) => res.json()));

      // Check for any failures
      const failures = responses.filter((res) => !res.ok);
      if (failures.length > 0) {
        throw new Error(
          `Failed to enroll in ${failures.length} course(s). Please try again.`
        );
      }

      toast({
        title: "Success",
        description: `Successfully enrolled in ${selectedCourses.length} course(s)! Your registration is under review.`,
      });

      // Clear selected courses and close dialog
      setSelectedCourses([]);
      setEnrollmentOpen(false);

      // Refresh course data
      mutateCourses();
      if (user?.role === "STUDENT") {
        mutateEnrolled();
      }
    } catch (error) {
      console.error("Batch enrollment error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to enroll in courses",
        variant: "destructive",
      });
    } finally {
      setSubmittingEnrollment(false);
    }
  };

  // Comprehensive course selection functions
  const fetchAvailableCoursesForSelection = useCallback(async () => {
    if (!courseSelectionOpen) return;

    try {
      const response = await fetch("/api/course/available");
      if (!response.ok) {
        throw new Error("Failed to fetch available courses");
      }
      const data = await response.json();
      setAvailableCourses(data.courses || []);
    } catch (error) {
      console.error("Error fetching available courses:", error);
      toast({
        title: "Error",
        description: "Failed to load available courses",
        variant: "destructive",
      });
    }
  }, [courseSelectionOpen, toast]);

  useEffect(() => {
    fetchAvailableCoursesForSelection();
  }, [fetchAvailableCoursesForSelection]);

  // Get courses by semester
  const firstSemesterCourses = availableCourses.filter(
    (course) => course.semester === "FIRST"
  );
  const secondSemesterCourses = availableCourses.filter(
    (course) => course.semester === "SECOND"
  );

  // Calculate total credits
  const getTotalCredits = (courseIds: string[], courses: any[]) => {
    return courseIds.reduce((total, courseId) => {
      const course = courses.find((c) => c.id === courseId);
      return total + (course?.creditUnit || 0);
    }, 0);
  };

  const firstSemesterCredits = getTotalCredits(
    selectedCoursesForRegistration.firstSemester,
    firstSemesterCourses
  );
  const secondSemesterCredits = getTotalCredits(
    selectedCoursesForRegistration.secondSemester,
    secondSemesterCourses
  );
  const totalCredits = firstSemesterCredits + secondSemesterCredits;

  // Credit limits
  const maxCreditsPerSemester = 24;
  const maxTotalCredits = 48;

  // Handle course selection
  const handleCourseToggleForRegistration = (
    courseId: string,
    semester: "firstSemester" | "secondSemester"
  ) => {
    const isSelected = selectedCoursesForRegistration[semester].includes(courseId);
    const courses = semester === "firstSemester" ? firstSemesterCourses : secondSemesterCourses;
    const course = courses.find((c) => c.id === courseId);

    if (!course) return;

    if (isSelected) {
      // Remove course
      setSelectedCoursesForRegistration((prev) => ({
        ...prev,
        [semester]: prev[semester].filter((id) => id !== courseId),
      }));
    } else {
      // Check credit limits
      const currentCredits = getTotalCredits(
        selectedCoursesForRegistration[semester],
        courses
      );
      if (currentCredits + course.creditUnit > maxCreditsPerSemester) {
        toast({
          title: "Credit Limit Exceeded",
          description: `Maximum ${maxCreditsPerSemester} credits allowed per semester`,
          variant: "destructive",
        });
        return;
      }

      // Add course
      setSelectedCoursesForRegistration((prev) => ({
        ...prev,
        [semester]: [...prev[semester], courseId],
      }));
    }
  };

  // Submit course registration
  const handleSubmitCourseRegistration = async () => {
    const allSelectedCourses = [
      ...selectedCoursesForRegistration.firstSemester,
      ...selectedCoursesForRegistration.secondSemester,
    ];

    if (allSelectedCourses.length === 0) {
      toast({
        title: "No Courses Selected",
        description: "Please select at least one course to register.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingRegistration(true);
    try {
      const response = await fetch("/api/student/course-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academicYear,
          firstSemesterCourses: selectedCoursesForRegistration.firstSemester,
          secondSemesterCourses: selectedCoursesForRegistration.secondSemester,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit course registration");
      }

      toast({
        title: "Success",
        description: "Course registration submitted successfully! Your registration is now under review.",
      });

      // Clear selection and close dialog
      setSelectedCoursesForRegistration({
        firstSemester: [],
        secondSemester: [],
      });
      setCourseSelectionOpen(false);
      setShowSubmitDialog(false);

      // Refresh data
      mutateCourses();
      if (user?.role === "STUDENT") {
        mutateEnrolled();
      }
    } catch (error) {
      console.error("Course registration error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit course registration",
        variant: "destructive",
      });
    } finally {
      setSubmittingRegistration(false);
    }
  };

  const handleDropCourse = useCallback(
    async (enrollmentId: string) => {
      if (!confirm("Are you sure you want to drop this course?")) {
        return;
      }

      try {
        const response = await fetch(
          `/api/student/course-registration?enrollmentId=${enrollmentId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to drop course");
        }

        toast({
          title: "Success",
          description: "Successfully dropped course!",
        });

        mutateCourses();
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to drop course",
          variant: "destructive",
        });
      }
    },
    [toast, mutateCourses]
  );

  useEffect(() => {
    fetchAvailableCourses();
  }, [fetchAvailableCourses]);

  // Course assignment functions for department admins
  const fetchCourseAssignments = useCallback(async () => {
    if (!assignmentOpen) return;

    try {
      const response = await fetch(
        `/api/admin/course-assignments?academicYear=${academicYear}&semester=${semester}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch course assignments");
      }

      const data = await response.json();
      setLecturers(data.lecturers || []);
      setAssignableCourses(data.courses || []);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching course assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load course assignments",
        variant: "destructive",
      });
    }
  }, [assignmentOpen, academicYear, semester, toast]);

  const handleAssignCourse = async (courseId: string, lecturerId: string) => {
    const assignmentKey = `${courseId}-${lecturerId}`;
    setAssigning(assignmentKey);

    try {
      const response = await fetch("/api/admin/course-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          lecturerId,
          academicYear,
          semester,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign course");
      }

      toast({
        title: "Success",
        description: "Course assigned successfully!",
      });

      // Refresh assignments
      fetchCourseAssignments();
    } catch (error) {
      console.error("Assignment error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to assign course",
        variant: "destructive",
      });
    } finally {
      setAssigning(null);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(
        `/api/admin/course-assignments?assignmentId=${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to remove assignment");
      }

      toast({
        title: "Success",
        description: "Course assignment removed successfully!",
      });

      // Refresh assignments
      fetchCourseAssignments();
    } catch (error) {
      console.error("Remove assignment error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove assignment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCourseAssignments();
  }, [fetchCourseAssignments]);

  // Course management functions for admins
  // Set admin level when admin courses data is available
  useEffect(() => {
    if (adminCourses.length > 0) {
      // Determine admin level based on user role
      if (isDepartmentAdmin(user?.role)) {
        setAdminLevel("department");
      } else if (isSchoolAdmin(user?.role)) {
        setAdminLevel("school");
      } else if (isSenateAdmin(user?.role)) {
        setAdminLevel("senate");
      }
    }
  }, [adminCourses, user?.role]);

  const handleCourseSuccess = () => {
    // Revalidate all course-related SWR data
    mutateCourses();
    mutateAdminCourses();
    revalidateCourseData();
  };

  const handleEditCourse = (course: any) => {
    setEditCourse(course);
    setCreateCourseOpen(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses?courseId=${courseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete course");
      }

      toast({
        title: "Success",
        description: "Course deleted successfully!",
      });

      // Revalidate all course-related SWR data
      mutateAdminCourses();
      revalidateCourseData();
    } catch (error) {
      console.error("Delete course error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  // Admin level is set automatically when adminCourses data is available

  // Seeding functions
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const endpoint = purgeOnly
        ? "/api/purge-database"
        : "/api/seed-organized";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Operation failed");
      }

      setSeedingData(data.data || data.purgedData);

      if (purgeOnly) {
        toast({
          title: "Database Purged Successfully!",
          description: "All existing data has been cleared from the database",
        });
      } else {
        toast({
          title: "Database Seeded Successfully!",
          description:
            "Organized database has been populated with schools, departments, courses, and users",
        });
        // Refresh the courses list only if we seeded new data
        mutateCourses();
      }
    } catch (error) {
      console.error("Operation error:", error);
      toast({
        title: purgeOnly ? "Purge Failed" : "Seeding Failed",
        description:
          error instanceof Error
            ? error.message
            : `An error occurred during ${purgeOnly ? "purging" : "seeding"}`,
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            {user?.role === "LECTURER"
              ? "My Teaching Courses"
              : isAdmin(user?.role)
                ? "All Courses"
                : "My Enrolled Courses"}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {user?.role === "LECTURER"
              ? "Manage your teaching courses and student progress."
              : isAdmin(user?.role)
                ? "Manage all courses across departments."
                : "View and access your enrolled courses."}
          </p>
        </div>
        {user?.role === "STUDENT" ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setCourseSelectionOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Course Selection</span>
              <span className="sm:hidden">Select Courses</span>
            </Button>
            <Dialog
              open={enrollmentOpen}
              onOpenChange={(open) => {
                setEnrollmentOpen(open);
                if (!open) {
                  setSelectedCourses([]); // Clear selection when dialog closes
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Quick Enroll</span>
                  <span className="sm:hidden">Enroll</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Register for Courses</DialogTitle>
                  <DialogDescription>
                    Browse and register for available courses. Your registration
                    will be reviewed by your department admin.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Academic Period Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year</Label>
                      <Select
                        value={academicYear}
                        onValueChange={setAcademicYear}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024/2025">2024/2025</SelectItem>
                          <SelectItem value="2023/2024">2023/2024</SelectItem>
                          <SelectItem value="2025/2026">2025/2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIRST">First Semester</SelectItem>
                          <SelectItem value="SECOND">
                            Second Semester
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Available Courses */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Available Courses ({availableCourses.length})
                    </h3>

                    {availableCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No available courses found
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableCourses.map((course) => (
                          <Card
                            key={course.id}
                            className={`relative ${selectedCourses.includes(course.id) ? "ring-2 ring-primary" : ""}`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <Checkbox
                                    checked={selectedCourses.includes(
                                      course.id
                                    )}
                                    onCheckedChange={() =>
                                      handleCourseToggle(course.id)
                                    }
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                      <Badge variant="outline">
                                        {course.code}
                                      </Badge>
                                      <Badge variant="secondary">
                                        {course.creditUnit} Credits
                                      </Badge>
                                    </div>
                                    <CardTitle className="text-lg">
                                      {course.title}
                                    </CardTitle>
                                    <CardDescription>
                                      {course.department?.name} • {course.type}
                                    </CardDescription>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.description}
                              </p>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  <span>{course.enrolledCount} enrolled</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{course.semester}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selection Summary and Submit Button */}
                  {availableCourses.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                          {selectedCourses.length} of {availableCourses.length}{" "}
                          courses selected
                        </div>
                        <div className="text-sm font-medium">
                          Total Credits:{" "}
                          {selectedCourses.reduce((total, courseId) => {
                            const course = availableCourses.find(
                              (c) => c.id === courseId
                            );
                            return total + (course?.creditUnit || 0);
                          }, 0)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedCourses([])}
                          disabled={selectedCourses.length === 0}
                          className="flex-1"
                        >
                          Clear Selection
                        </Button>
                        <Button
                          onClick={handleBatchEnroll}
                          disabled={
                            selectedCourses.length === 0 || submittingEnrollment
                          }
                          className="flex-1"
                        >
                          {submittingEnrollment ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Enroll Selected ({selectedCourses.length})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Comprehensive Course Selection Dialog */}
            <Dialog
              open={courseSelectionOpen}
              onOpenChange={(open) => {
                setCourseSelectionOpen(open);
                if (!open) {
                  setSelectedCoursesForRegistration({
                    firstSemester: [],
                    secondSemester: [],
                  });
                }
              }}
            >
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Course Selection for Both Semesters
                  </DialogTitle>
                  <DialogDescription>
                    Select courses for both first and second semesters. Your selection will be submitted for department admin review.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Academic Year Selection */}
                  <div className="flex items-center gap-4">
                    <Label htmlFor="academicYear">Academic Year:</Label>
                    <Select value={academicYear} onValueChange={setAcademicYear}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Progress Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Selection Summary
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
                          {selectedCoursesForRegistration.firstSemester.length +
                            selectedCoursesForRegistration.secondSemester.length}{" "}
                          courses
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* First Semester Courses */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
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
                          {firstSemesterCourses.map((course) => (
                            <Card
                              key={course.id}
                              className={`relative ${
                                selectedCoursesForRegistration.firstSemester.includes(course.id)
                                  ? "ring-2 ring-primary"
                                  : ""
                              }`}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <Checkbox
                                      checked={selectedCoursesForRegistration.firstSemester.includes(
                                        course.id
                                      )}
                                      onCheckedChange={() =>
                                        handleCourseToggleForRegistration(
                                          course.id,
                                          "firstSemester"
                                        )
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline">
                                          {course.code}
                                        </Badge>
                                        <Badge variant="secondary">
                                          {course.creditUnit} Credits
                                        </Badge>
                                      </div>
                                      <CardTitle className="text-lg">
                                        {course.title}
                                      </CardTitle>
                                      <CardDescription>
                                        {course.department?.name} • {course.type}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {course.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span>{course.enrolledCount} enrolled</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{course.semester}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Second Semester Courses */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
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
                          {secondSemesterCourses.map((course) => (
                            <Card
                              key={course.id}
                              className={`relative ${
                                selectedCoursesForRegistration.secondSemester.includes(course.id)
                                  ? "ring-2 ring-primary"
                                  : ""
                              }`}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <Checkbox
                                      checked={selectedCoursesForRegistration.secondSemester.includes(
                                        course.id
                                      )}
                                      onCheckedChange={() =>
                                        handleCourseToggleForRegistration(
                                          course.id,
                                          "secondSemester"
                                        )
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline">
                                          {course.code}
                                        </Badge>
                                        <Badge variant="secondary">
                                          {course.creditUnit} Credits
                                        </Badge>
                                      </div>
                                      <CardTitle className="text-lg">
                                        {course.title}
                                      </CardTitle>
                                      <CardDescription>
                                        {course.department?.name} • {course.type}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {course.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    <span>{course.enrolledCount} enrolled</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{course.semester}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
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
                        selectedCoursesForRegistration.firstSemester.length === 0 &&
                        selectedCoursesForRegistration.secondSemester.length === 0
                      }
                      className="px-8"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Submit Course Selection
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
                    {selectedCoursesForRegistration.firstSemester.length} courses (
                    {firstSemesterCredits} credits)
                    <br />
                    <strong>Second Semester:</strong>{" "}
                    {selectedCoursesForRegistration.secondSemester.length} courses (
                    {secondSemesterCredits} credits)
                    <br />
                    <strong>Total:</strong>{" "}
                    {selectedCoursesForRegistration.firstSemester.length +
                      selectedCoursesForRegistration.secondSemester.length}{" "}
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
                    onClick={handleSubmitCourseRegistration}
                    disabled={submittingRegistration}
                  >
                    {submittingRegistration ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit Selection"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : isDepartmentAdmin(user?.role) ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Assign Courses</span>
                  <span className="sm:hidden">Assign</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Course Assignment Management</DialogTitle>
                  <DialogDescription>
                    Assign courses to lecturers in your department for the
                    selected academic period.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Academic Period Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year</Label>
                      <Select
                        value={academicYear}
                        onValueChange={setAcademicYear}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024/2025">2024/2025</SelectItem>
                          <SelectItem value="2023/2024">2023/2024</SelectItem>
                          <SelectItem value="2025/2026">2025/2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIRST">First Semester</SelectItem>
                          <SelectItem value="SECOND">
                            Second Semester
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Current Assignments */}
                  {assignments.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Current Assignments ({assignments.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignments.map((assignment) => (
                          <Card
                            key={assignment.id}
                            className="border-blue-200 bg-blue-50/50"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <Badge variant="outline" className="mb-2">
                                  {assignment.course.code}
                                </Badge>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveAssignment(assignment.id)
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                              <CardTitle className="text-lg">
                                {assignment.course.title}
                              </CardTitle>
                              <CardDescription>
                                Assigned to:{" "}
                                <strong>{assignment.lecturer.name}</strong>
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignment Matrix */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Assign Courses to Lecturers
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-2 text-left">
                              Course
                            </th>
                            {lecturers.map((lecturer) => (
                              <th
                                key={lecturer.id}
                                className="border border-gray-300 p-2 text-center min-w-[120px]"
                              >
                                {lecturer.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {assignableCourses.map((course) => {
                            const courseAssignments = assignments.filter(
                              (a) => a.courseId === course.id
                            );
                            return (
                              <tr key={course.id}>
                                <td className="border border-gray-300 p-2">
                                  <div>
                                    <div className="font-medium">
                                      {course.code}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {course.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {course.creditUnit} Credits
                                    </div>
                                  </div>
                                </td>
                                {lecturers.map((lecturer) => {
                                  const isAssigned = courseAssignments.some(
                                    (a) => a.lecturerId === lecturer.id
                                  );
                                  const assignmentKey = `${course.id}-${lecturer.id}`;
                                  return (
                                    <td
                                      key={lecturer.id}
                                      className="border border-gray-300 p-2 text-center"
                                    >
                                      {isAssigned ? (
                                        <Badge
                                          variant="default"
                                          className="bg-green-100 text-green-800"
                                        >
                                          Assigned
                                        </Badge>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleAssignCourse(
                                              course.id,
                                              lecturer.id
                                            )
                                          }
                                          disabled={assigning === assignmentKey}
                                        >
                                          {assigning === assignmentKey ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                          ) : (
                                            "Assign"
                                          )}
                                        </Button>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => setDepartmentCourseOpen(true)}
              className="w-full sm:w-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                Manage Department Courses
              </span>
              <span className="sm:hidden">Manage Courses</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setDepartmentCourseSelectionOpen(true)}
              className="w-full sm:w-auto"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                Select Courses for Department
              </span>
              <span className="sm:hidden">Select Courses</span>
            </Button>
          </div>
        ) : isSchoolAdmin(user?.role) || isSenateAdmin(user?.role) ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setCreateCourseOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Course</span>
              <span className="sm:hidden">Create</span>
            </Button>
            {/* <Button variant="outline" onClick={() => setCreateCourseOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
            {isSenateAdmin(user?.role) && (
              <Button variant="outline" onClick={() => setSeedingOpen(true)}>
                <Database className="mr-2 h-4 w-4" />
                Seed Database
              </Button>
            )} */}
          </div>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {user?.role === "LECTURER"
              ? "Create Course"
              : isAdmin(user?.role)
                ? "Add Course"
                : "Enroll Course"}
          </Button>
        )}
      </div>

      {coursesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading courses...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden h-full flex flex-col"
            >
              <CardHeader className="border-b bg-muted/40 p-3 md:p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-xs">
                      {course.code}
                    </Badge>
                    <Badge
                      variant={
                        course.status === "ENROLLED"
                          ? "default"
                          : course.status === "PENDING"
                            ? "secondary"
                            : course.status === "active"
                              ? "default"
                              : course.status === "completed"
                                ? "outline"
                                : "secondary"
                      }
                      className="text-xs"
                    >
                      {course.status === "ENROLLED" ? "Enrolled" : 
                       course.status === "PENDING" ? "Pending" : 
                       course.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm md:text-base leading-tight">
                    {course.title || course.name}
                  </CardTitle>
                  {user?.role === "STUDENT" && (
                    <div className="flex flex-wrap gap-1">
                      {course.status === "ENROLLED" && (
                        <Badge variant="default" className="text-xs">
                          Enrolled
                        </Badge>
                      )}
                      {course.status === "PENDING" && (
                        <Badge variant="secondary" className="text-xs">
                          Pending Approval
                        </Badge>
                      )}
                      {course.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {course.type && (
                        <Badge variant="outline" className="text-xs">
                          {course.type}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <CardDescription>
                  {course.creditUnit || course.credits} Credits • {course.semester}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 md:p-4 space-y-3 flex-1">
                <div className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{course.schedule}</span>
                </div>

                {!isAdmin(user?.role) && course.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1" />
                  </div>
                )}

                {(user?.role === "LECTURER" || isAdmin(user?.role)) &&
                  course.students && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                      <span>{course.students} Students</span>
                    </div>
                  )}
              </CardContent>

              <CardFooter className="border-t p-3 md:p-4 flex flex-col space-y-2">
                <div className="flex flex-wrap gap-2">
                  {user?.role === "STUDENT" ? (
                    course.isEnrolled ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-0"
                          onClick={() =>
                            router.push(
                              `/dashboard/student/materials/${course.id}`
                            )
                          }
                        >
                          <BookOpen className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="hidden sm:inline">
                            View Materials
                          </span>
                          <span className="sm:hidden">Materials</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 min-w-0"
                          onClick={() => handleDropCourse(course.enrollmentId)}
                        >
                          Drop
                        </Button>
                        <CourseFeedback course={course} />
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id}
                      >
                        {enrolling === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-1 md:mr-2"></div>
                            <span className="hidden sm:inline">
                              Enrolling...
                            </span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Enroll
                          </>
                        )}
                      </Button>
                    )
                  ) : user?.role === "LECTURER" ? (
                    <div className="w-full space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          router.push(`/dashboard/lecturer/course/${course.id}`)
                        }
                      >
                        <BookOpen className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Manage Course</span>
                        <span className="sm:hidden">Manage</span>
                      </Button>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            router.push(
                              `/dashboard/lecturer/course/${course.id}?tab=materials`
                            )
                          }
                        >
                          <FileText className="h-3 w-3" />
                          <span className="hidden sm:inline ml-1">
                            Materials
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            router.push(
                              `/dashboard/lecturer/course/${course.id}?tab=students`
                            )
                          }
                        >
                          <Users className="h-3 w-3" />
                          <span className="hidden sm:inline ml-1">
                            Students
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            router.push(
                              `/dashboard/lecturer/course/${course.id}?tab=quizzes`
                            )
                          }
                        >
                          <Award className="h-3 w-3" />
                          <span className="hidden sm:inline ml-1">Quizzes</span>
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {isAdmin(user?.role) && (
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                {!isAdmin(user?.role) && (
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Bookmark className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Course Creation/Edit Form */}
      <CourseForm
        open={createCourseOpen}
        onOpenChange={(open) => {
          setCreateCourseOpen(open);
          if (!open) {
            setEditCourse(null);
          }
        }}
        onSuccess={handleCourseSuccess}
        editCourse={editCourse}
        departments={departments}
        schools={schools}
        adminLevel={adminLevel}
      />

      {/* Department Course Selection */}
      <DepartmentCourseSelection
        open={departmentCourseOpen}
        onOpenChange={setDepartmentCourseOpen}
        onSuccess={() => {
          mutateCourses();
        }}
      />

      {/* Database Seeding Dialog */}
      <Dialog open={seedingOpen} onOpenChange={setSeedingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </DialogTitle>
            <DialogDescription>
              {purgeOnly
                ? "Clear all existing data from the database (Senate Admin only)."
                : "Populate the database with organized schools, departments, courses, lecturers, and students. This will first purge all existing data."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="seed-mode"
                  name="mode"
                  checked={!purgeOnly}
                  onChange={() => setPurgeOnly(false)}
                  className="h-4 w-4"
                />
                <label htmlFor="seed-mode" className="text-sm font-medium">
                  Seed Database (Purge + Create New Data)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="purge-mode"
                  name="mode"
                  checked={purgeOnly}
                  onChange={() => setPurgeOnly(true)}
                  className="h-4 w-4"
                />
                <label htmlFor="purge-mode" className="text-sm font-medium">
                  Purge Only (Clear All Data)
                </label>
              </div>
            </div>

            {!purgeOnly && (
              <div>
                {/* What gets created */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Schools & Departments</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          SEET
                        </Badge>
                        <span>Electrical & Technology</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          SIPET
                        </Badge>
                        <span>Infrastructure & Processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800">
                          SPS
                        </Badge>
                        <span>Physical Sciences</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800">
                          SLS
                        </Badge>
                        <span>Life Sciences</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Test Accounts</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Senate Admin:</span>
                        <br />
                        <span className="text-muted-foreground">
                          senate.admin@university.edu
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">MCE Admin:</span>
                        <br />
                        <span className="text-muted-foreground">
                          mce.admin@university.edu
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">MCE Student:</span>
                        <br />
                        <span className="text-muted-foreground">
                          mce.student1@university.edu
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Password: password123
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course structure */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Course Structure</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      • <strong>MCE Courses:</strong> MCE101, MCE201, MCE301,
                      MCE401, MCE501 (100L-500L)
                    </p>
                    <p>
                      • <strong>EEE Courses:</strong> EEE101, EEE201, EEE301
                    </p>
                    <p>
                      • <strong>CPE Courses:</strong> CPE101, CPE201, CPE301
                    </p>
                    <p>
                      • <strong>General Courses:</strong> MTH101, MTH201,
                      MTH301, ENG101, ENG201
                    </p>
                    <p>
                      • <strong>Department Course Selections:</strong> Each
                      department selects relevant courses
                    </p>
                    <p>
                      • <strong>Lecturer Assignments:</strong> Department admins
                      assign lecturers to courses
                    </p>
                  </div>
                </div>
              </div>
            )}

            {purgeOnly && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  ⚠️ Purge Warning
                </h4>
                <div className="text-sm text-red-700 space-y-2">
                  <p>
                    This will permanently delete ALL data from the database:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>All users (students, lecturers, admins)</li>
                    <li>All schools and departments</li>
                    <li>All courses and course assignments</li>
                    <li>All enrollments and registrations</li>
                    <li>All assessments, results, and feedback</li>
                    <li>All content, announcements, and chat rooms</li>
                  </ul>
                  <p className="font-medium">This action cannot be undone!</p>
                </div>
              </div>
            )}

            {/* Results */}
            {seedingData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  {purgeOnly ? "Purge Complete!" : "Seeding Complete!"}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Schools:</span>{" "}
                    {seedingData.schools}
                  </div>
                  <div>
                    <span className="font-medium">Departments:</span>{" "}
                    {seedingData.departments}
                  </div>
                  <div>
                    <span className="font-medium">Lecturers:</span>{" "}
                    {seedingData.lecturers}
                  </div>
                  <div>
                    <span className="font-medium">Students:</span>{" "}
                    {seedingData.students}
                  </div>
                  <div>
                    <span className="font-medium">Courses:</span>{" "}
                    {seedingData.courses}
                  </div>
                  <div>
                    <span className="font-medium">Department Courses:</span>{" "}
                    {seedingData.departmentCourses}
                  </div>
                  <div>
                    <span className="font-medium">Course Assignments:</span>{" "}
                    {seedingData.courseAssignments}
                  </div>
                  <div>
                    <span className="font-medium">Admins:</span>{" "}
                    {seedingData.departmentAdmins +
                      seedingData.schoolAdmins +
                      seedingData.senateAdmins}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSeedingOpen(false)}
                disabled={seeding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSeedDatabase}
                disabled={seeding}
                className={
                  purgeOnly
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              >
                {seeding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {purgeOnly ? "Purging..." : "Seeding..."}
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    {purgeOnly ? "Purge Database" : "Seed Database"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Course Selection Interface */}
      <DepartmentCourseSelectionInterface
        open={departmentCourseSelectionOpen}
        onOpenChange={setDepartmentCourseSelectionOpen}
        onSuccess={() => {
          mutateCourses();
        }}
      />
    </div>
  );
};

export default withDashboardLayout(Courses);

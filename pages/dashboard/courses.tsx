import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { studentCourses, lecturerCourses, allCourses } from "@/lib/dummyData";
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
  const [courses, setCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("FIRST");

  // Course assignment states for department admins
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [assignableCourses, setAssignableCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Course creation states for admins
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
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

  // Fetch real courses for students, lecturers, and admins
  const fetchStudentCourses = async () => {
    if (user?.role === "LECTURER") {
      try {
        const response = await fetch("/api/lecturer/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        } else {
          // Fallback to dummy data
          setCourses(getCourses());
        }
      } catch (error) {
        console.error("Error fetching lecturer courses:", error);
        setCourses(getCourses());
      }
      setLoading(false);
      return;
    }

    try {
      let response;
      if (user?.role === "STUDENT") {
        // For students, fetch available courses for registration
        response = await fetch("/api/student/course-registration");
      } else if (isAdmin(user?.role)) {
        response = await fetch("/api/dashboard/admin");
      } else {
        setCourses(getCourses());
        setLoading(false);
        return;
      }

      if (response && response.ok) {
        const data = await response.json();
        if (user?.role === "STUDENT") {
          // For students, combine available courses and current enrollments
          const allStudentCourses = [
            ...(data.availableCourses || []),
            ...(data.currentEnrollments || []).map((enrollment: any) => ({
              ...enrollment.course,
              isEnrolled: true,
              enrollmentId: enrollment.id,
              enrollmentStatus: enrollment.status,
            })),
          ];
          setCourses(allStudentCourses);
        } else {
          setCourses(data.courses || []);
        }
      } else {
        // Fallback to dummy data
        if (user?.role === "STUDENT") {
          setCourses(studentCourses);
        } else {
          setCourses(getCourses());
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      if (user?.role === "STUDENT") {
        setCourses(studentCourses);
      } else {
        setCourses(getCourses());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentCourses();
  }, [user]);

  // Select courses based on user role (for non-students)
  const getCourses = () => {
    switch (user?.role) {
      case "LECTURER":
        return lecturerCourses;
      case "DEPARTMENT_ADMIN":
      case "SCHOOL_ADMIN":
      case "SENATE_ADMIN":
        return allCourses;
      default:
        return [];
    }
  };

  const fetchAvailableCourses = async () => {
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
  };

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
        description: "Successfully enrolled in course!",
      });

      // Remove enrolled course from available list
      setAvailableCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      // Refresh enrolled courses
      fetchStudentCourses();
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

  const handleDropCourse = async (enrollmentId: string) => {
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

      fetchStudentCourses();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to drop course",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAvailableCourses();
  }, [enrollmentOpen, academicYear, semester]);

  // Course assignment functions for department admins
  const fetchCourseAssignments = async () => {
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
  };

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
  }, [assignmentOpen, academicYear, semester]);

  // Course management functions for admins
  const fetchAdminCourses = async () => {
    if (!createCourseOpen && !editCourse) return;

    try {
      const response = await fetch("/api/admin/courses");

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      setAdminCourses(data.courses || []);
      setDepartments(data.departments || []);
      setSchools(data.schools || []);
      setAdminLevel(data.adminLevel || "");
    } catch (error) {
      console.error("Error fetching admin courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  };

  const handleCourseSuccess = () => {
    fetchAdminCourses();
    // Also refresh the main courses list if it's an admin view
    if (isAdmin(user?.role)) {
      fetchStudentCourses();
    }
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

      fetchAdminCourses();
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

  useEffect(() => {
    fetchAdminCourses();
  }, [createCourseOpen, editCourse]);

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
        fetchStudentCourses();
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === "LECTURER"
              ? "My Teaching Courses"
              : isAdmin(user?.role)
                ? "All Courses"
                : "My Enrolled Courses"}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "LECTURER"
              ? "Manage your teaching courses and student progress."
              : isAdmin(user?.role)
                ? "Manage all courses across departments."
                : "View and access your enrolled courses."}
          </p>
        </div>
        {user?.role === "STUDENT" ? (
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/dashboard/student/course-selection")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Course Selection
            </Button>
            <Dialog open={enrollmentOpen} onOpenChange={setEnrollmentOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Quick Enroll
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Enroll in Courses</DialogTitle>
                  <DialogDescription>
                    Browse and enroll in available courses for the selected
                    academic period.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Academic Period Selection */}
                  <div className="grid grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableCourses.map((course) => (
                          <Card key={course.id} className="relative">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <Badge variant="outline" className="mb-2">
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

                              <Button
                                onClick={() => handleEnroll(course.id)}
                                disabled={enrolling === course.id}
                                className="w-full"
                                size="sm"
                              >
                                {enrolling === course.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Enrolling...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Enroll
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : isDepartmentAdmin(user?.role) ? (
          <div className="flex gap-2">
            <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Assign Courses
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Course Assignment Management</DialogTitle>
                  <DialogDescription>
                    Assign courses to lecturers in your department for the
                    selected academic period.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Academic Period Selection */}
                  <div className="grid grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Department Courses
            </Button>
            <Button
              variant="outline"
              onClick={() => setDepartmentCourseSelectionOpen(true)}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Select Courses for Department
            </Button>
          </div>
        ) : isSchoolAdmin(user?.role) || isSenateAdmin(user?.role) ? (
          <div className="flex gap-2">
            <Button onClick={() => setCreateCourseOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
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

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading courses...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/40 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="mb-2">
                      {course.code}
                    </Badge>
                    {user?.role === "STUDENT" && (
                      <div className="flex space-x-1">
                        {course.isEnrolled && (
                          <Badge variant="default" className="text-xs">
                            Enrolled
                          </Badge>
                        )}
                        {course.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {course.category && (
                          <Badge variant="secondary" className="text-xs">
                            {course.category}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={
                      course.status === "active"
                        ? "default"
                        : course.status === "completed"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {course.status}
                  </Badge>
                </div>
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>
                  {course.credits} Credits • {course.semester}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="text-sm">{course.description}</div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{course.schedule}</span>
                </div>

                {!isAdmin(user?.role) && course.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Course Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1" />
                  </div>
                )}

                {(user?.role === "LECTURER" || isAdmin(user?.role)) &&
                  course.students && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{course.students} Students Enrolled</span>
                    </div>
                  )}
              </CardContent>

              <CardFooter className="border-t p-4 flex justify-between">
                <div className="flex space-x-2">
                  {user?.role === "STUDENT" ? (
                    course.isEnrolled ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/student/materials/${course.id}`
                            )
                          }
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Materials
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDropCourse(course.enrollmentId)}
                        >
                          Drop Course
                        </Button>
                        <CourseFeedback course={course} />
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id}
                      >
                        {enrolling === course.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Enroll
                          </>
                        )}
                      </Button>
                    )
                  ) : user?.role === "LECTURER" ? (
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          router.push(`/dashboard/lecturer/course/${course.id}`)
                        }
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Manage Course
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            router.push(
                              `/dashboard/lecturer/course/${course.id}?tab=materials`
                            )
                          }
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Materials
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            router.push(
                              `/dashboard/lecturer/course/${course.id}?tab=students`
                            )
                          }
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Students
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            router.push(
                              `/dashboard/lecturer/course/${course.id}?tab=quizzes`
                            )
                          }
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Quizzes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  )}
                  {isAdmin(user?.role) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
                {!isAdmin(user?.role) && (
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </Button>
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
          fetchStudentCourses();
        }}
      />

      {/* Database Seeding Dialog */}
      <Dialog open={seedingOpen} onOpenChange={setSeedingOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          fetchStudentCourses();
        }}
      />
    </div>
  );
};

export default withDashboardLayout(Courses);

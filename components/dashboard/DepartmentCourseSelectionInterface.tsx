import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  UserCheck,
  Users,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface DepartmentCourseSelectionInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DepartmentCourseSelectionInterface: React.FC<
  DepartmentCourseSelectionInterfaceProps
> = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();

  // SWR hooks for data fetching
  const {
    data: coursesData,
    error: coursesError,
    isLoading: coursesLoading,
  } = useSWR(open ? "/api/admin/department-course-selection" : null, fetcher);

  const {
    data: assignmentsData,
    error: assignmentsError,
    isLoading: assignmentsLoading,
  } = useSWR(open ? "/api/admin/lecturer-assignment" : null, fetcher);

  // Extract data from SWR responses
  const allCourses = coursesData?.allCourses || [];
  const selectedCourses = coursesData?.selectedCourses || [];
  const department = coursesData?.department;
  const lecturers = assignmentsData?.lecturers || [];
  const courseAssignments = assignmentsData?.courseAssignments || [];

  // UI states
  const [assigningLecturer, setAssigningLecturer] = useState<string | null>(
    null
  );

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  // Handle errors from SWR
  if (coursesError) {
    toast({
      title: "Error",
      description: "Failed to fetch department courses",
      variant: "destructive",
    });
  }

  if (assignmentsError) {
    toast({
      title: "Error",
      description: "Failed to fetch lecturer assignments",
      variant: "destructive",
    });
  }

  const handleSelectCourse = async (
    course: any,
    isRequired: boolean = false
  ) => {
    const courseId = course.id;
    const key = "/api/admin/department-course-selection";

    // Optimistic update using SWR mutate
    const optimisticSelectedCourse = {
      id: `temp-${courseId}`,
      courseId: courseId,
      course: course,
      isRequired,
      selectedAt: new Date().toISOString(),
    };

    // Optimistically update the cache
    mutate(
      key,
      (currentData: any) => {
        if (!currentData) return currentData;

        return {
          ...currentData,
          selectedCourses: [
            ...currentData.selectedCourses,
            optimisticSelectedCourse,
          ],
          allCourses: currentData.allCourses.map((c: any) =>
            c.id === courseId ? { ...c, isSelected: true } : c
          ),
        };
      },
      false
    ); // false = don't revalidate immediately

    try {
      const response = await fetch("/api/admin/department-course-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          isRequired,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to select course");
      }

      toast({
        title: "Success",
        description: "Course added to department successfully",
      });

      // Revalidate to get fresh data from server
      mutate(key);
    } catch (error) {
      // Revert optimistic update on error
      mutate(key); // This will restore the original data

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to select course",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    const course = selectedCourses.find((sc) => sc.courseId === courseId);
    const courseTitle = course?.course?.title || "this course";

    setConfirmDialog({
      open: true,
      title: "Remove Course",
      description: `Are you sure you want to remove "${courseTitle}" from your department? This action cannot be undone.`,
      action: () => performRemoveCourse(courseId),
    });
  };

  const performRemoveCourse = async (courseId: string) => {
    const key = "/api/admin/department-course-selection";

    // Optimistically update the cache
    mutate(
      key,
      (currentData: any) => {
        if (!currentData) return currentData;

        return {
          ...currentData,
          selectedCourses: currentData.selectedCourses.filter(
            (sc: any) => sc.courseId !== courseId
          ),
          allCourses: currentData.allCourses.map((c: any) =>
            c.id === courseId ? { ...c, isSelected: false } : c
          ),
        };
      },
      false
    ); // false = don't revalidate immediately

    try {
      const response = await fetch(
        `/api/admin/department-course-selection?courseId=${courseId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove course");
      }

      toast({
        title: "Success",
        description: "Course removed from department successfully",
      });

      // Revalidate to get fresh data from server
      mutate(key);
    } catch (error) {
      // Revert optimistic update on error
      mutate(key); // This will restore the original data

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove course",
        variant: "destructive",
      });
    }
  };

  const handleAssignLecturer = async (courseId: string, lecturerId: string) => {
    setAssigningLecturer(`${courseId}-${lecturerId}`);
    const key = "/api/admin/lecturer-assignment";

    try {
      const response = await fetch("/api/admin/lecturer-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          lecturerId,
          academicYear: "2024/2025",
          semester: "FIRST",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign lecturer");
      }

      toast({
        title: "Success",
        description: "Lecturer assigned to course successfully",
      });

      // Revalidate to get fresh data from server
      mutate(key);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to assign lecturer",
        variant: "destructive",
      });
    } finally {
      setAssigningLecturer(null);
    }
  };

  const handleRemoveLecturerAssignment = (assignmentId: string) => {
    const assignment = courseAssignments.find((a) => a.id === assignmentId);
    const courseTitle = assignment?.course?.title || "this course";
    const lecturerName = assignment?.lecturer?.user?.name || "this lecturer";

    setConfirmDialog({
      open: true,
      title: "Remove Lecturer Assignment",
      description: `Are you sure you want to remove ${lecturerName} from "${courseTitle}"? This action cannot be undone.`,
      action: () => performRemoveLecturerAssignment(assignmentId),
    });
  };

  const performRemoveLecturerAssignment = async (assignmentId: string) => {
    const key = "/api/admin/lecturer-assignment";

    try {
      const response = await fetch(
        `/api/admin/lecturer-assignment?assignmentId=${assignmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to remove lecturer assignment"
        );
      }

      toast({
        title: "Success",
        description: "Lecturer assignment removed successfully",
      });

      // Revalidate to get fresh data from server
      mutate(key);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove lecturer assignment",
        variant: "destructive",
      });
    }
  };

  // Filter courses
  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel =
      !levelFilter || levelFilter === "all" || course.level === levelFilter;
    const matchesType =
      !typeFilter || typeFilter === "all" || course.type === typeFilter;
    const matchesSemester =
      !semesterFilter ||
      semesterFilter === "all" ||
      course.semester === semesterFilter;
    const notSelected = !course.isSelected;

    return (
      matchesSearch &&
      matchesLevel &&
      matchesType &&
      matchesSemester &&
      notSelected
    );
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "LEVEL_100":
        return "bg-blue-100 text-blue-800";
      case "LEVEL_200":
        return "bg-green-100 text-green-800";
      case "LEVEL_300":
        return "bg-yellow-100 text-yellow-800";
      case "LEVEL_400":
        return "bg-orange-100 text-orange-800";
      case "LEVEL_500":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "DEPARTMENTAL":
        return "bg-purple-100 text-purple-800";
      case "FACULTY":
        return "bg-indigo-100 text-indigo-800";
      case "GENERAL":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Select Courses for Department</DialogTitle>
          <DialogDescription>
            Select courses (100L-500L) that will be available for students in
            your department to register for.
            {department && (
              <span className="block mt-2 text-sm font-medium">
                Department: {department.name} ({department.code})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="courses"
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Course Selection</span>
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="flex items-center space-x-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Lecturer Assignment</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="LEVEL_100">100 Level</SelectItem>
                    <SelectItem value="LEVEL_200">200 Level</SelectItem>
                    <SelectItem value="LEVEL_300">300 Level</SelectItem>
                    <SelectItem value="LEVEL_400">400 Level</SelectItem>
                    <SelectItem value="LEVEL_500">500 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="DEPARTMENTAL">Departmental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={semesterFilter}
                  onValueChange={setSemesterFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All semesters</SelectItem>
                    <SelectItem value="FIRST">First Semester</SelectItem>
                    <SelectItem value="SECOND">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected Courses */}
            {selectedCourses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Selected Courses ({selectedCourses.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {selectedCourses.map((sc) => (
                    <Card
                      key={sc.id}
                      className="border-green-200 bg-green-50/50"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveCourse(sc.courseId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardTitle className="text-lg">
                          {sc.course.title}
                        </CardTitle>
                        <CardDescription>
                          {sc.course.code} • {sc.course.creditUnit} Credits
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={sc.isRequired ? "default" : "secondary"}
                          >
                            {sc.isRequired ? "Required" : "Elective"}
                          </Badge>
                          <Badge className={getLevelColor(sc.course.level)}>
                            {sc.course.level.replace("LEVEL_", "")}L
                          </Badge>
                          <Badge className={getTypeColor(sc.course.type)}>
                            {sc.course.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sc.course.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Selected:{" "}
                          {new Date(sc.selectedAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Courses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Available Courses ({filteredCourses.length})
              </h3>
              {coursesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading courses...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                          {course.title}
                        </CardTitle>
                        <CardDescription>
                          {course.code} • {course.creditUnit} Credits
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={getLevelColor(course.level)}>
                            {course.level.replace("LEVEL_", "")}L
                          </Badge>
                          <Badge className={getTypeColor(course.type)}>
                            {course.type}
                          </Badge>
                          <Badge variant="outline">{course.semester}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {course.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Department: {course.department?.name || "N/A"}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectCourse(course, false)}
                            className="flex-1"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add as Elective
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSelectCourse(course, true)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Add as Required
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            {/* Lecturer Assignment Interface */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Assign Lecturers to Courses
              </h3>
              <p className="text-sm text-muted-foreground">
                Assign lecturers from your department to the courses you&apos;ve
                selected.
              </p>
            </div>

            {/* Current Assignments */}
            {courseAssignments.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold">
                  Current Assignments ({courseAssignments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courseAssignments.map((assignment) => (
                    <Card
                      key={assignment.id}
                      className="border-blue-200 bg-blue-50/50"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRemoveLecturerAssignment(assignment.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardTitle className="text-lg">
                          {assignment.course.title}
                        </CardTitle>
                        <CardDescription>
                          {assignment.course.code} •{" "}
                          {assignment.course.creditUnit} Credits
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            {assignment.course.level.replace("LEVEL_", "")}L
                          </Badge>
                          <Badge variant="secondary">
                            {assignment.course.type}
                          </Badge>
                          <Badge variant="outline">{assignment.semester}</Badge>
                        </div>
                        <div className="text-sm">
                          <strong>Assigned to:</strong>{" "}
                          {assignment.lecturer.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Academic Year: {assignment.academicYear}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment Matrix */}
            {selectedCourses.length > 0 && lecturers.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Assignment Matrix</h4>
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
                            {lecturer.user.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCourses.map((sc: any) => {
                        const currentCourseAssignments: any[] =
                          courseAssignments.filter(
                            (a: any) => a.courseId === sc.courseId
                          );
                        return (
                          <tr key={sc.courseId}>
                            <td className="border border-gray-300 p-2">
                              <div>
                                <div className="font-medium">
                                  {sc.course.code}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {sc.course.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {sc.course.creditUnit} Credits
                                </div>
                              </div>
                            </td>
                            {lecturers.map((lecturer) => {
                              const isAssigned = currentCourseAssignments.some(
                                (a) => a.lecturerId === lecturer.id
                              );
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
                                        handleAssignLecturer(
                                          sc.courseId,
                                          lecturer.id
                                        )
                                      }
                                      disabled={
                                        assigningLecturer ===
                                        `${sc.courseId}-${lecturer.id}`
                                      }
                                    >
                                      {assigningLecturer ===
                                      `${sc.courseId}-${lecturer.id}` ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                      ) : (
                                        <>
                                          <UserCheck className="h-4 w-4 mr-1" />
                                          Assign
                                        </>
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
            )}

            {selectedCourses.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No courses selected yet. Please select courses first in the
                  Course Selection tab.
                </p>
              </div>
            )}

            {lecturers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No lecturers found in your department.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) =>
            setConfirmDialog((prev) => ({ ...prev, open }))
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDialog.action}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentCourseSelectionInterface;

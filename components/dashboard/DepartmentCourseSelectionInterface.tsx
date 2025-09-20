import React, { useState, useEffect } from "react";
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
  BookOpen,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  UserCheck,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface DepartmentCourseSelectionInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DepartmentCourseSelectionInterface: React.FC<
  DepartmentCourseSelectionInterfaceProps
> = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
  const [department, setDepartment] = useState<any>(null);

  // Lecturer assignment states
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [assigningLecturer, setAssigningLecturer] = useState<string | null>(
    null
  );

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  useEffect(() => {
    if (open) {
      fetchDepartmentCourses();
      fetchLecturerAssignments();
    }
  }, [open]);

  const fetchDepartmentCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/department-course-selection");

      if (!response.ok) {
        throw new Error("Failed to fetch department courses");
      }

      const data = await response.json();
      setAllCourses(data.allCourses || []);
      setSelectedCourses(data.selectedCourses || []);
      setDepartment(data.department);
    } catch (error) {
      console.error("Error fetching department courses:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturerAssignments = async () => {
    try {
      const response = await fetch("/api/admin/lecturer-assignment");

      if (!response.ok) {
        throw new Error("Failed to fetch lecturer assignments");
      }

      const data = await response.json();
      setLecturers(data.lecturers || []);
      setCourseAssignments(data.courseAssignments || []);
    } catch (error) {
      console.error("Error fetching lecturer assignments:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch lecturer assignments",
        variant: "destructive",
      });
    }
  };

  const handleSelectCourse = async (
    course: any,
    isRequired: boolean = false
  ) => {
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

      // Refresh the data
      fetchDepartmentCourses();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to select course",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this course from your department?"
      )
    ) {
      return;
    }

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

      // Refresh the data
      fetchDepartmentCourses();
    } catch (error) {
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

      // Refresh the data
      fetchLecturerAssignments();
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

  const handleRemoveLecturerAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to remove this lecturer assignment?")) {
      return;
    }

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

      // Refresh the data
      fetchLecturerAssignments();
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <SelectItem value="FACULTY">Faculty</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading courses...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentCourseSelectionInterface;

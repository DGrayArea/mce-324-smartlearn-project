import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, UserCheck, BookOpen, Users } from "lucide-react";

interface DepartmentCourseSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DepartmentCourseSelection: React.FC<DepartmentCourseSelectionProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("selection");

  // Data states
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/department-courses");

      if (!response.ok) {
        throw new Error("Failed to fetch department courses");
      }

      const data = await response.json();
      setAllCourses(data.allCourses || []);
      setSelectedCourses(data.selectedCourses || []);
      setLecturers(data.lecturers || []);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load department courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleSelectCourse = async (
    course: any,
    isRequired: boolean = false
  ) => {
    try {
      const response = await fetch("/api/admin/department-courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          isRequired,
          level: course.level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to select course");
      }

      toast({
        title: "Success",
        description: "Course added to department successfully!",
      });

      fetchData();
    } catch (error) {
      console.error("Select course error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to select course",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCourse = async (
    courseId: string,
    isOwnCourse: boolean = false
  ) => {
    if (isOwnCourse) {
      toast({
        title: "Cannot Remove",
        description:
          "This course belongs to your department by default and cannot be removed.",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        "Are you sure you want to remove this course from your department?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/department-courses?courseId=${courseId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to remove course");
      }

      toast({
        title: "Success",
        description: "Course removed from department successfully!",
      });

      fetchData();
    } catch (error) {
      console.error("Remove course error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove course",
        variant: "destructive",
      });
    }
  };

  const handleAssignLecturer = async (courseId: string, lecturerId: string) => {
    try {
      const response = await fetch("/api/admin/course-assignments", {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign lecturer");
      }

      toast({
        title: "Success",
        description: "Lecturer assigned to course successfully!",
      });

      fetchData();
    } catch (error) {
      console.error("Assign lecturer error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to assign lecturer",
        variant: "destructive",
      });
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
        description: "Assignment removed successfully!",
      });

      fetchData();
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
    const notSelected = !course.isSelected; // This will filter out courses that are already selected

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Department Course Management</DialogTitle>
          <DialogDescription>
            Select courses for your department (100L-500L) and assign lecturers
            to them.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection">Course Selection</TabsTrigger>
            <TabsTrigger value="assignments">Lecturer Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="search">Search Courses</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
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
                  {selectedCourses.map((dc) => {
                    const isOwnCourse = dc.id.startsWith("own-");
                    return (
                      <Card
                        key={dc.id}
                        className={`${isOwnCourse ? "border-blue-200 bg-blue-50/50" : "border-green-200 bg-green-50/50"}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex space-x-2">
                              <Badge className={getLevelColor(dc.course.level)}>
                                {dc.course.level.replace("LEVEL_", "")}L
                              </Badge>
                              {isOwnCourse && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  Department Course
                                </Badge>
                              )}
                            </div>
                            {!isOwnCourse && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleRemoveCourse(dc.courseId, isOwnCourse)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <CardTitle className="text-lg">
                            {dc.course.title}
                          </CardTitle>
                          <CardDescription>
                            {dc.course.code} • {dc.course.creditUnit} Credits
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  dc.isRequired ? "default" : "secondary"
                                }
                              >
                                {dc.isRequired ? "Required" : "Elective"}
                              </Badge>
                              <Badge variant="outline">{dc.course.type}</Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="h-4 w-4 mr-1" />
                              {dc.course.studentCount} students
                            </div>
                            {isOwnCourse && (
                              <div className="text-xs text-blue-600 font-medium">
                                This course belongs to your department by
                                default
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Courses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Available Courses ({filteredCourses.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge className={getLevelColor(course.level)}>
                          {course.level.replace("LEVEL_", "")}L
                        </Badge>
                        {course.isSelected && (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            Selected
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>
                        {course.code} • {course.creditUnit} Credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{course.type}</Badge>
                          <Badge variant="outline">{course.semester}</Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          {course.studentCount} students
                        </div>
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                        )}
                        {!course.isSelected && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleSelectCourse(course, true)}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Required
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectCourse(course, false)}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Elective
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lecturer Assignments</h3>

              {/* Assignment Matrix */}
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
                    {selectedCourses.map((dc) => {
                      const courseAssignments = assignments.filter(
                        (a) => a.courseId === dc.courseId
                      );
                      return (
                        <tr key={dc.courseId}>
                          <td className="border border-gray-300 p-2">
                            <div>
                              <div className="font-medium">
                                {dc.course.code}
                              </div>
                              <div className="text-sm text-gray-600">
                                {dc.course.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {dc.course.creditUnit} Credits
                              </div>
                            </div>
                          </td>
                          {lecturers.map((lecturer) => {
                            const isAssigned = courseAssignments.some(
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
                                        dc.courseId,
                                        lecturer.id
                                      )
                                    }
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Assign
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

              {/* Current Assignments */}
              {assignments.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">Current Assignments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((assignment) => (
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
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentCourseSelection;

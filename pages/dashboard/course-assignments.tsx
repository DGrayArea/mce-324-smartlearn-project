import React, { useEffect, useState } from "react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, UserPlus, Users } from "lucide-react";
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

type Course = {
  id: string;
  code: string;
  title: string;
  creditUnit: number;
  level: string;
  semester: string;
  courseAssignments: Array<{
    id: string;
    lecturer: {
      id: string;
      name: string;
      staffId: string | null;
      user: {
        name: string;
        email: string;
      };
    };
  }>;
};

type Lecturer = {
  id: string;
  name: string;
  staffId: string | null;
  user: {
    name: string;
    email: string;
  };
};

const CourseAssignments = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const currentAcademicYear = "2024/2025";
  const [semester, setSemester] = useState<"FIRST" | "SECOND" | "ALL">("ALL");
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set()
  );
  const [bulkLecturer, setBulkLecturer] = useState<string>("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<
    Map<string, string>
  >(new Map());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [academicYear, semester]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        academicYear,
        ...(semester !== "ALL" && { semester }),
      });

      const res = await fetch(`/api/admin/course-assignments?${params}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Failed to load course assignments");
      }

      setCourses(json.courses || []);
      setLecturers(json.lecturers || []);
    } catch (e: any) {
      setError(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const assignLecturer = async (courseId: string, lecturerId: string) => {
    try {
      setProcessing((prev) => new Set(prev).add(courseId));

      const res = await fetch("/api/admin/course-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lecturerId,
          academicYear,
          semester: semester === "ALL" ? "FIRST" : semester,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to assign lecturer");
      }

      toast({
        title: "Success",
        description: "Lecturer assigned to course successfully",
      });

      // Reload data
      await loadData();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Unable to assign lecturer",
        variant: "destructive",
      });
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  const removeAssignment = async (assignmentId: string, courseId: string) => {
    try {
      setProcessing((prev) => new Set(prev).add(assignmentId));

      const res = await fetch("/api/admin/course-assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to remove assignment");
      }

      toast({
        title: "Success",
        description: "Assignment removed successfully",
      });

      // Reload data
      await loadData();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Unable to remove assignment",
        variant: "destructive",
      });
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (semester === "ALL") return true;
    return course.semester === semester;
  });

  const getLecturerStats = () => {
    const stats: Record<string, number> = {};
    courses.forEach((course) => {
      course.courseAssignments.forEach((assignment) => {
        const lecturerId = assignment.lecturer.id;
        stats[lecturerId] = (stats[lecturerId] || 0) + 1;
      });
    });
    return stats;
  };

  const lecturerStats = getLecturerStats();

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const selectAllCoursesInLevel = (level: string) => {
    const levelCourses = filteredCourses.filter(
      (course) => course.level === level
    );
    const levelCourseIds = levelCourses.map((course) => course.id);
    setSelectedCourses(new Set(levelCourseIds));
  };

  const clearCourseSelections = () => {
    setSelectedCourses(new Set());
  };

  const addPendingAssignment = (courseId: string, lecturerId: string) => {
    setPendingAssignments((prev) => new Map(prev).set(courseId, lecturerId));
  };

  const removePendingAssignment = (courseId: string) => {
    setPendingAssignments((prev) => {
      const next = new Map(prev);
      next.delete(courseId);
      return next;
    });
  };

  const clearPendingAssignments = () => {
    setPendingAssignments(new Map());
  };

  const getPendingLecturerForCourse = (courseId: string) => {
    return pendingAssignments.get(courseId);
  };

  const hasPendingAssignment = (courseId: string) => {
    return pendingAssignments.has(courseId);
  };

  const isCurrentAcademicYear = () => {
    return academicYear === currentAcademicYear;
  };

  const handleBulkAssignment = async () => {
    if (!bulkLecturer || selectedCourses.size === 0) {
      toast({
        title: "Error",
        description: "Please select a lecturer and at least one course",
        variant: "destructive",
      });
      return;
    }

    // Add pending assignments for all selected courses
    selectedCourses.forEach((courseId) => {
      addPendingAssignment(courseId, bulkLecturer);
    });

    setSelectedCourses(new Set());
    setBulkLecturer("");
  };

  const handleConfirmAssignments = async () => {
    if (pendingAssignments.size === 0) {
      toast({
        title: "Error",
        description: "No pending assignments to confirm",
        variant: "destructive",
      });
      return;
    }

    try {
      setBulkProcessing(true);
      setShowConfirmDialog(false);

      const promises = Array.from(pendingAssignments.entries()).map(
        async ([courseId, lecturerId]) => {
          const res = await fetch("/api/admin/course-assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId,
              lecturerId,
              academicYear,
              semester: semester === "ALL" ? "FIRST" : semester,
            }),
          });
          return res.json();
        }
      );

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `${pendingAssignments.size} courses assigned successfully`,
      });

      // Reload data and clear pending assignments
      await loadData();
      clearPendingAssignments();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Unable to process assignments",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const getCoursesByLevel = () => {
    const levels = [
      "LEVEL_100",
      "LEVEL_200",
      "LEVEL_300",
      "LEVEL_400",
      "LEVEL_500",
    ];
    const grouped: Record<string, Course[]> = {};

    levels.forEach((level) => {
      grouped[level] = filteredCourses.filter(
        (course) => course.level === level
      );
    });

    return grouped;
  };

  const coursesByLevel = getCoursesByLevel();

  if (loading) {
    return <div className="p-6">Loading course assignments...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Course Assignments
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Academic Year:
            </span>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2023/2024">2023/2024</SelectItem>
                <SelectItem value="2022/2023">2022/2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Semester:</span>
            <Select
              value={semester}
              onValueChange={(value: any) => setSemester(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="FIRST">First</SelectItem>
                <SelectItem value="SECOND">Second</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses & Assignments</TabsTrigger>
          <TabsTrigger value="lecturers">Lecturer Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {/* Academic Year Notice */}
          {!isCurrentAcademicYear() && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                  <span className="font-medium">Read-only Mode</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  You are viewing course assignments for{" "}
                  <strong>{academicYear}</strong>. Only the current academic
                  year ({currentAcademicYear}) allows modifications.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bulk Assignment Section - Only for current academic year */}
          {filteredCourses.length > 0 && isCurrentAcademicYear() && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg">Bulk Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedCourses.size > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const allCourseIds = filteredCourses.map((c) => c.id);
                          setSelectedCourses(new Set(allCourseIds));
                        } else {
                          clearCourseSelections();
                        }
                      }}
                      aria-label="Select all courses"
                    />
                    <span className="text-sm font-medium">
                      Select All ({selectedCourses.size} selected)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Assign to:
                    </span>
                    <Select
                      value={bulkLecturer}
                      onValueChange={setBulkLecturer}
                      disabled={bulkProcessing}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select lecturer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lecturers.map((lecturer) => (
                          <SelectItem key={lecturer.id} value={lecturer.id}>
                            {lecturer.user.name} (
                            {lecturer.staffId || "No Staff ID"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleBulkAssignment}
                    disabled={
                      !bulkLecturer ||
                      selectedCourses.size === 0 ||
                      bulkProcessing
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {bulkProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      `Add ${selectedCourses.size} to Pending`
                    )}
                  </Button>

                  {selectedCourses.size > 0 && (
                    <Button
                      onClick={clearCourseSelections}
                      variant="outline"
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                  )}

                  {pendingAssignments.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={bulkProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Confirm {pendingAssignments.size} Assignments
                      </Button>
                      <Button
                        onClick={clearPendingAssignments}
                        variant="outline"
                        size="sm"
                        disabled={bulkProcessing}
                      >
                        Clear Pending
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Level Tabs */}
          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No courses found for the selected filters.
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="LEVEL_100" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="LEVEL_100">100L</TabsTrigger>
                <TabsTrigger value="LEVEL_200">200L</TabsTrigger>
                <TabsTrigger value="LEVEL_300">300L</TabsTrigger>
                <TabsTrigger value="LEVEL_400">400L</TabsTrigger>
                <TabsTrigger value="LEVEL_500">500L</TabsTrigger>
              </TabsList>

              {Object.entries(coursesByLevel).map(([level, levelCourses]) => (
                <TabsContent key={level} value={level} className="space-y-4">
                  {levelCourses.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        No courses found for {level.replace("LEVEL_", "")} in
                        the selected filters.
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Level Header with Select All */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {level.replace("LEVEL_", "")} Courses (
                          {levelCourses.length})
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllCoursesInLevel(level)}
                        >
                          Select All in {level.replace("LEVEL_", "")}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {levelCourses.map((course) => (
                          <Card
                            key={course.id}
                            className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <Checkbox
                                    checked={selectedCourses.has(course.id)}
                                    onCheckedChange={() =>
                                      toggleCourseSelection(course.id)
                                    }
                                    disabled={!isCurrentAcademicYear()}
                                    aria-label={`Select ${course.code}`}
                                    className="mt-1 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base leading-tight mb-1">
                                      {course.title}
                                    </h3>
                                    <div className="text-sm text-muted-foreground">
                                      <span className="font-medium">
                                        {course.code}
                                      </span>
                                      <span className="mx-1">•</span>
                                      <span>
                                        {course.creditUnit} Credit Unit
                                        {course.creditUnit !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  <Badge
                                    variant={
                                      course.semester === "FIRST"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={`text-xs px-2 py-1 ${
                                      course.semester === "FIRST"
                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : "bg-green-100 text-green-800 border-green-200"
                                    }`}
                                  >
                                    {course.semester === "FIRST"
                                      ? "1st Semester"
                                      : "2nd Semester"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-2 py-1"
                                  >
                                    {course.level.replace("LEVEL_", "")}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Assigned Lecturers (
                                  {course.courseAssignments.length})
                                </h4>
                                {course.courseAssignments.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No lecturers assigned
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {course.courseAssignments.map(
                                      (assignment) => (
                                        <div
                                          key={assignment.id}
                                          className="flex items-center justify-between p-2 bg-muted rounded"
                                        >
                                          <div>
                                            <div className="text-sm font-medium">
                                              {assignment.lecturer.user.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {assignment.lecturer.staffId ||
                                                "No Staff ID"}
                                            </div>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              removeAssignment(
                                                assignment.id,
                                                course.id
                                              )
                                            }
                                            disabled={
                                              processing.has(assignment.id) ||
                                              !isCurrentAcademicYear()
                                            }
                                            className="relative"
                                          >
                                            {processing.has(assignment.id) ? (
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <UserPlus className="h-4 w-4" />
                                  Assign Lecturer
                                </h4>
                                {course.courseAssignments.length > 0 ? (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-sm text-green-700 font-medium">
                                      ✓ Course already assigned to lecturer
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                      Remove assignment above to reassign
                                    </p>
                                  </div>
                                ) : isCurrentAcademicYear() ? (
                                  <div className="space-y-2">
                                    <Select
                                      value={
                                        getPendingLecturerForCourse(
                                          course.id
                                        ) || ""
                                      }
                                      onValueChange={(lecturerId) =>
                                        addPendingAssignment(
                                          course.id,
                                          lecturerId
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select lecturer..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {lecturers.map((lecturer) => (
                                          <SelectItem
                                            key={lecturer.id}
                                            value={lecturer.id}
                                          >
                                            {lecturer.user.name} (
                                            {lecturer.staffId || "No Staff ID"})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {hasPendingAssignment(course.id) && (
                                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-blue-700">
                                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                          <span className="font-medium">
                                            Pending assignment
                                          </span>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            removePendingAssignment(course.id)
                                          }
                                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">
                                        Read-only:
                                      </span>{" "}
                                      Course assignments for previous academic
                                      years cannot be modified.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="lecturers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lecturers.map((lecturer) => (
              <Card key={lecturer.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="text-lg">{lecturer.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lecturer.staffId || "No Staff ID"}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {lecturerStats[lecturer.id] || 0} courses
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Email: {lecturer.user.email}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Workload:</span>{" "}
                      {lecturerStats[lecturer.id] || 0} assigned courses
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Course Assignments</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to assign {pendingAssignments.size} courses to
              lecturers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {Array.from(pendingAssignments.entries()).map(
              ([courseId, lecturerId]) => {
                const course = filteredCourses.find((c) => c.id === courseId);
                const lecturer = lecturers.find((l) => l.id === lecturerId);
                return (
                  <div
                    key={courseId}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">
                        {course?.code} - {course?.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {course?.level.replace("LEVEL_", "")} •{" "}
                        {course?.semester}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{lecturer?.user.name}</div>
                      <div className="text-sm text-gray-600">
                        {lecturer?.staffId}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAssignments}
              disabled={bulkProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {bulkProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                `Confirm ${pendingAssignments.size} Assignments`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withDashboardLayout(CourseAssignments);

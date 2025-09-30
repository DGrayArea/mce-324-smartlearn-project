import React, { useEffect, useState } from "react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";

// Export function for student lists
const exportStudentsToExcel = (students: any[], courseTitle: string) => {
  if (!students || students.length === 0) {
    toast({
      title: "No Students",
      description: "No students to export",
      variant: "destructive",
    });
    return;
  }

  // Prepare data for Excel
  const excelData = students.map((enrollment: any) => {
    const student = enrollment.student;
    const nameParts = student.name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Try different ways to access department data
    let departmentName = "";
    if (student.department?.name) {
      departmentName = student.department.name;
    } else if (student.department) {
      departmentName = student.department;
    } else if (enrollment.course?.department?.name) {
      departmentName = enrollment.course.department.name;
    }

    return {
      "First Name": firstName,
      "Last Name": lastName,
      "Matric Number": student.matricNumber || "",
      Department: departmentName,
      Level: student.level?.replace("LEVEL_", "") || "",
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 20 }, // Matric Number
    { wch: 25 }, // Department
    { wch: 10 }, // Level
  ];
  ws["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  // Generate filename
  const sanitizedCourseTitle = courseTitle
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_");
  const filename = `${sanitizedCourseTitle}_Students_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);

  toast({
    title: "Export Successful",
    description: `Student list exported as ${filename}`,
  });
};

type Course = {
  id: string;
  code: string;
  title: string;
  creditUnit: number;
  semester: "FIRST" | "SECOND";
  level: string;
};

const StudentCourses = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [reviewComments, setReviewComments] = useState<Record<string, string>>(
    {}
  );
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [batchAction, setBatchAction] = useState<"APPROVE" | "REJECT" | "">("");
  const [processingStudents, setProcessingStudents] = useState<Set<string>>(
    new Set()
  );
  const [batchProcessing, setBatchProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        if (user?.role === "DEPARTMENT_ADMIN") {
          // Load pending registrations for department admin
          const res = await fetch("/api/admin/course-registrations");
          const json = await res.json();
          if (!res.ok)
            throw new Error(json?.message || "Failed to load registrations");
          setPendingRegistrations(json.grouped || []);
        } else if (user?.role === "LECTURER") {
          // Load courses for lecturers
          const res = await fetch("/api/lecturer/courses");
          const json = await res.json();
          if (!res.ok)
            throw new Error(json?.message || "Failed to load courses");
          setData(json);
        } else {
          // Load courses for students
          const res = await fetch("/api/student/courses");
          const json = await res.json();
          if (!res.ok)
            throw new Error(json?.message || "Failed to load courses");
          setData(json);
          const pre = new Set<string>([
            ...(json?.firstSemester?.registeredCourseIds || []),
            ...(json?.secondSemester?.registeredCourseIds || []),
          ]);
          setSelected(pre);
        }
      } catch (e: any) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.role]);

  // Clear selections when level filter changes
  useEffect(() => {
    setSelectedStudents(new Set());
  }, [levelFilter]);

  if (loading) {
    return <div className="p-6">Loading courses…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  // Student view state is computed later after role check

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      const courseIds = Array.from(selected);
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to Submit Registration");
      toast({
        title: "Saved",
        description: "Course registration submitted for approval",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Unable to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (
    studentId: string,
    action: "APPROVE" | "REJECT",
    academicYear?: string
  ) => {
    try {
      setProcessingStudents((prev) => new Set(prev).add(studentId));

      const res = await fetch("/api/admin/course-registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          academicYear,
          action,
          comments: reviewComments[studentId] || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to review registration");

      toast({
        title: "Success",
        description: `Registration ${action.toLowerCase()}d successfully`,
      });

      // Refresh the list
      const refreshRes = await fetch("/api/admin/course-registrations");
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok) {
        setPendingRegistrations(refreshJson.grouped || []);
      }

      // Clear comment
      setReviewComments((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Unable to review registration",
        variant: "destructive",
      });
    } finally {
      setProcessingStudents((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  const handleBatchAction = async () => {
    if (!batchAction || selectedStudents.size === 0) {
      toast({
        title: "Error",
        description: "Please select an action and at least one student",
        variant: "destructive",
      });
      return;
    }

    try {
      setBatchProcessing(true);
      setProcessingStudents(new Set(selectedStudents));

      const promises = Array.from(selectedStudents).map(async (studentId) => {
        const student = pendingRegistrations.find(
          (grp: any) => grp?.student?.id === studentId
        );
        if (!student) return;

        const res = await fetch("/api/admin/course-registrations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            academicYear: student.academicYear,
            action: batchAction,
            comments: reviewComments[studentId] || undefined,
          }),
        });
        return res.json();
      });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `${selectedStudents.size} registrations ${batchAction.toLowerCase()}d successfully`,
      });

      // Refresh the list
      const refreshRes = await fetch("/api/admin/course-registrations");
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok) {
        setPendingRegistrations(refreshJson.grouped || []);
      }

      // Clear selections and comments
      setSelectedStudents(new Set());
      setBatchAction("");
      setReviewComments({});
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Unable to process batch action",
        variant: "destructive",
      });
    } finally {
      setBatchProcessing(false);
      setProcessingStudents(new Set());
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const selectAllStudents = () => {
    const filteredStudents = pendingRegistrations
      .filter(
        (grp: any) =>
          levelFilter === "ALL" || grp?.student?.level === levelFilter
      )
      .map((grp: any) => grp?.student?.id);
    setSelectedStudents(new Set(filteredStudents));
  };

  const clearAllSelections = () => {
    setSelectedStudents(new Set());
  };

  const renderList = (list: Course[], disabled: boolean = false) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((c: Course) => (
        <Card
          key={c.id}
          className={`border ${selected.has(c.id) ? "ring-2 ring-primary" : ""} ${disabled ? "opacity-60" : ""}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selected.has(c.id)}
                  onCheckedChange={() => {
                    if (!disabled) toggle(c.id);
                  }}
                  disabled={disabled}
                  aria-label={`Select ${c.code}`}
                />
                <span>{c.title}</span>
              </div>
              <Badge variant="outline">{c.code}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Credit Unit: {c.creditUnit}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Course Registration Reviews
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Level:</span>
            <Tabs value={levelFilter} onValueChange={setLevelFilter}>
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="LEVEL_100">100L</TabsTrigger>
                <TabsTrigger value="LEVEL_200">200L</TabsTrigger>
                <TabsTrigger value="LEVEL_300">300L</TabsTrigger>
                <TabsTrigger value="LEVEL_400">400L</TabsTrigger>
                <TabsTrigger value="LEVEL_500">500L</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Badge variant="outline">{pendingRegistrations.length} Pending</Badge>
        </div>
      </div>

      {/* Batch Approval Section */}
      {pendingRegistrations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Batch Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedStudents.size > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllStudents();
                    } else {
                      clearAllSelections();
                    }
                  }}
                  aria-label="Select all students"
                />
                <span className="text-sm font-medium">
                  Select All ({selectedStudents.size} selected)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Action:</span>
                <select
                  value={batchAction}
                  onChange={(e) =>
                    setBatchAction(e.target.value as "APPROVE" | "REJECT" | "")
                  }
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="">Select Action</option>
                  <option value="APPROVE">Approve</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>

              <Button
                onClick={handleBatchAction}
                disabled={
                  !batchAction || selectedStudents.size === 0 || batchProcessing
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {batchProcessing
                  ? "Processing..."
                  : `Apply to ${selectedStudents.size} Students`}
              </Button>

              {selectedStudents.size > 0 && (
                <Button
                  onClick={clearAllSelections}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingRegistrations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No pending course registrations to review.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRegistrations
            .filter(
              (grp: any) =>
                levelFilter === "ALL" || grp?.student?.level === levelFilter
            )
            .map((grp: any) => (
              <Card
                key={grp?.student?.id}
                className="border-l-4 border-l-yellow-500"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStudents.has(grp?.student?.id)}
                        onCheckedChange={() =>
                          toggleStudentSelection(grp?.student?.id)
                        }
                        aria-label={`Select ${grp?.student?.name}`}
                      />
                      <div>
                        <span className="text-lg">{grp?.student?.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {grp?.student?.matricNumber}
                        </Badge>
                        <Badge variant="secondary" className="ml-2">
                          {grp?.student?.level?.replace?.("LEVEL_", "")}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline">{grp?.academicYear}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Selected Courses:</h4>
                      <Tabs defaultValue="first">
                        <TabsList>
                          <TabsTrigger value="first">
                            First Semester
                          </TabsTrigger>
                          <TabsTrigger value="second">
                            Second Semester
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="first">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(grp?.first?.courses || []).map((course: any) => (
                              <div
                                key={course.id}
                                className="flex items-center justify-between p-2 bg-muted rounded"
                              >
                                <span className="text-sm">{course.title}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {course.code}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {course.creditUnit} CU
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="second">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(grp?.second?.courses || []).map((course: any) => (
                              <div
                                key={course.id}
                                className="flex items-center justify-between p-2 bg-muted rounded"
                              >
                                <span className="text-sm">{course.title}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {course.code}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {course.creditUnit} CU
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Review Comments (Optional):
                      </label>
                      <Textarea
                        placeholder="Add comments for approval/rejection..."
                        value={reviewComments[grp?.student?.id] || ""}
                        onChange={(e) =>
                          setReviewComments((prev) => ({
                            ...prev,
                            [grp?.student?.id]: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={processingStudents.has(grp?.student?.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingStudents.has(grp?.student?.id)
                              ? "Processing..."
                              : "Approve"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Approve both semesters?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will approve the student&apos;s first and
                              second semester course registrations for{" "}
                              {grp?.academicYear}. You can add an optional
                              comment before confirming.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={processingStudents.has(
                                grp?.student?.id
                              )}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleReview(
                                  grp?.student?.id,
                                  "APPROVE",
                                  grp?.academicYear
                                )
                              }
                              disabled={processingStudents.has(
                                grp?.student?.id
                              )}
                            >
                              Confirm Approve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={processingStudents.has(grp?.student?.id)}
                            variant="destructive"
                          >
                            {processingStudents.has(grp?.student?.id)
                              ? "Processing..."
                              : "Reject"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Reject both semesters?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reject the student&apos;s first and
                              second semester course registrations for{" "}
                              {grp?.academicYear}. Consider adding a comment to
                              explain the decision.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              disabled={processingStudents.has(
                                grp?.student?.id
                              )}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleReview(
                                  grp?.student?.id,
                                  "REJECT",
                                  grp?.academicYear
                                )
                              }
                              disabled={processingStudents.has(
                                grp?.student?.id
                              )}
                            >
                              Confirm Reject
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <span className="text-xs text-muted-foreground">
                        Submitted:{" "}
                        {new Date(
                          grp?.first?.submittedAt ||
                            grp?.second?.submittedAt ||
                            Date.now()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );

  const renderLecturerView = () => {
    const courses = data?.courses || [];
    const lecturer = data?.lecturer;

    // Group courses by level and then by semester
    const groupedCourses = courses.reduce((acc: any, course: any) => {
      const level = course.level;
      const semester = course.semester;

      if (!acc[level]) {
        acc[level] = {};
      }
      if (!acc[level][semester]) {
        acc[level][semester] = [];
      }
      acc[level][semester].push(course);
      return acc;
    }, {});

    // Sort levels (100L, 200L, 300L, 400L, 500L)
    const sortedLevels = Object.keys(groupedCourses).sort((a, b) => {
      const levelA = parseInt(a.replace("LEVEL_", ""));
      const levelB = parseInt(b.replace("LEVEL_", ""));
      return levelA - levelB;
    });

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Courses</h1>
            <p className="text-gray-600">
              Manage your assigned courses, content, and students
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-2xl font-bold text-blue-600">
              {data?.totalCourses || 0}
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No courses assigned yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Contact your department admin to get assigned to courses.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="ALL" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="ALL">All</TabsTrigger>
                {sortedLevels.map((level) => (
                  <TabsTrigger key={level} value={level}>
                    {level.replace("LEVEL_", "")}L
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="ALL" className="space-y-6">
                <Tabs defaultValue="FIRST" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="FIRST">First Semester</TabsTrigger>
                    <TabsTrigger value="SECOND">Second Semester</TabsTrigger>
                  </TabsList>

                  {["FIRST", "SECOND"].map((semester) => {
                    // Get all courses for this semester across all levels
                    const allSemesterCourses = sortedLevels.flatMap(
                      (level) => groupedCourses[level][semester] || []
                    );

                    return (
                      <TabsContent
                        key={semester}
                        value={semester}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-700 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {semester} Semester
                            <span className="ml-2 text-sm text-gray-500">
                              ({allSemesterCourses.length} course
                              {allSemesterCourses.length !== 1 ? "s" : ""})
                            </span>
                          </h3>
                        </div>

                        {allSemesterCourses.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">
                              No courses in {semester.toLowerCase()} semester.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {allSemesterCourses.map((course: any) => (
                              <Card key={course.id} className="overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-lg">
                                        {course.title}
                                      </CardTitle>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {course.code} • {course.creditUnit}{" "}
                                        Credit Units • {course.level}
                                      </p>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {course.department?.name} •{" "}
                                        {course.semester} Semester
                                      </p>
                                    </div>
                                    <Badge variant="secondary" className="ml-4">
                                      {course.studentCount} Students
                                    </Badge>
                                  </div>
                                </CardHeader>

                                <CardContent className="p-6">
                                  <Tabs
                                    defaultValue="overview"
                                    className="w-full"
                                  >
                                    <TabsList className="grid w-full grid-cols-2">
                                      <TabsTrigger value="overview">
                                        Overview
                                      </TabsTrigger>
                                      <TabsTrigger value="students">
                                        Students
                                      </TabsTrigger>
                                    </TabsList>

                                    <TabsContent
                                      value="overview"
                                      className="space-y-4"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                          <h4 className="font-semibold text-blue-800">
                                            Students Enrolled
                                          </h4>
                                          <p className="text-2xl font-bold text-blue-600">
                                            {course.studentCount}
                                          </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                          <h4 className="font-semibold text-green-800">
                                            Content Items
                                          </h4>
                                          <p className="text-2xl font-bold text-green-600">
                                            {course.content.length}
                                          </p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                          <h4 className="font-semibold text-purple-800">
                                            Virtual Meetings
                                          </h4>
                                          <p className="text-2xl font-bold text-purple-600">
                                            {course.meetings.length}
                                          </p>
                                        </div>
                                      </div>

                                      {course.description && (
                                        <div>
                                          <h4 className="font-semibold mb-2">
                                            Course Description
                                          </h4>
                                          <p className="text-gray-600">
                                            {course.description}
                                          </p>
                                        </div>
                                      )}

                                      {/* Quick Actions */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                        <Button
                                          variant="outline"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            (window.location.href = `/dashboard/content-library?course=${course.id}`)
                                          }
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                            />
                                          </svg>
                                          Content Library
                                        </Button>
                                        <Button
                                          variant="outline"
                                          className="flex items-center gap-2"
                                          onClick={() =>
                                            (window.location.href = `/dashboard/virtual-meetings?course=${course.id}`)
                                          }
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                          </svg>
                                          Virtual Meetings
                                        </Button>
                                      </div>
                                    </TabsContent>

                                    <TabsContent
                                      value="students"
                                      className="space-y-4"
                                    >
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">
                                          Enrolled Students (
                                          {course.studentCount})
                                        </h4>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            exportStudentsToExcel(
                                              course.students,
                                              course.title
                                            )
                                          }
                                        >
                                          Export List
                                        </Button>
                                      </div>

                                      {course.students.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">
                                          No students enrolled yet.
                                        </p>
                                      ) : (
                                        <div className="space-y-2">
                                          {course.students.map(
                                            (enrollment: any) => (
                                              <div
                                                key={enrollment.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                              >
                                                <div>
                                                  <p className="font-medium">
                                                    {enrollment.student.name}
                                                  </p>
                                                  <p className="text-sm text-gray-500">
                                                    {
                                                      enrollment.student
                                                        .matricNumber
                                                    }
                                                  </p>
                                                </div>
                                                <Badge variant="outline">
                                                  {enrollment.student.level}
                                                </Badge>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </TabsContent>
                                  </Tabs>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </TabsContent>

              {sortedLevels.map((level) => (
                <TabsContent key={level} value={level} className="space-y-6">
                  <Tabs defaultValue="FIRST" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="FIRST">First Semester</TabsTrigger>
                      <TabsTrigger value="SECOND">Second Semester</TabsTrigger>
                    </TabsList>

                    {["FIRST", "SECOND"].map((semester) => {
                      const semesterCourses =
                        groupedCourses[level][semester] || [];

                      return (
                        <TabsContent
                          key={semester}
                          value={semester}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-700 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              {semester} Semester
                              <span className="ml-2 text-sm text-gray-500">
                                ({semesterCourses.length} course
                                {semesterCourses.length !== 1 ? "s" : ""})
                              </span>
                            </h3>
                          </div>

                          {semesterCourses.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-gray-500">
                                No courses in {semester.toLowerCase()} semester
                                for {level.replace("LEVEL_", "")}L.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {semesterCourses.map((course: any) => (
                                <Card
                                  key={course.id}
                                  className="overflow-hidden"
                                >
                                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-lg">
                                          {course.title}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                          {course.code} • {course.creditUnit}{" "}
                                          Credit Units • {course.level}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {course.department?.name} •{" "}
                                          {course.semester} Semester
                                        </p>
                                      </div>
                                      <Badge
                                        variant="secondary"
                                        className="ml-4"
                                      >
                                        {course.studentCount} Students
                                      </Badge>
                                    </div>
                                  </CardHeader>

                                  <CardContent className="p-6">
                                    <Tabs
                                      defaultValue="overview"
                                      className="w-full"
                                    >
                                      <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="overview">
                                          Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="students">
                                          Students
                                        </TabsTrigger>
                                      </TabsList>

                                      <TabsContent
                                        value="overview"
                                        className="space-y-4"
                                      >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-blue-800">
                                              Students Enrolled
                                            </h4>
                                            <p className="text-2xl font-bold text-blue-600">
                                              {course.studentCount}
                                            </p>
                                          </div>
                                          <div className="bg-green-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-green-800">
                                              Content Items
                                            </h4>
                                            <p className="text-2xl font-bold text-green-600">
                                              {course.content.length}
                                            </p>
                                          </div>
                                          <div className="bg-purple-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-purple-800">
                                              Virtual Meetings
                                            </h4>
                                            <p className="text-2xl font-bold text-purple-600">
                                              {course.meetings.length}
                                            </p>
                                          </div>
                                        </div>

                                        {course.description && (
                                          <div>
                                            <h4 className="font-semibold mb-2">
                                              Course Description
                                            </h4>
                                            <p className="text-gray-600">
                                              {course.description}
                                            </p>
                                          </div>
                                        )}

                                        {/* Quick Actions */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                          <Button
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            onClick={() =>
                                              (window.location.href = `/dashboard/content-library?course=${course.id}`)
                                            }
                                          >
                                            <svg
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                              />
                                            </svg>
                                            Content Library
                                          </Button>
                                          <Button
                                            variant="outline"
                                            className="flex items-center gap-2"
                                            onClick={() =>
                                              (window.location.href = `/dashboard/virtual-meetings?course=${course.id}`)
                                            }
                                          >
                                            <svg
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                              />
                                            </svg>
                                            Virtual Meetings
                                          </Button>
                                        </div>
                                      </TabsContent>

                                      <TabsContent
                                        value="students"
                                        className="space-y-4"
                                      >
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-semibold">
                                            Enrolled Students (
                                            {course.studentCount})
                                          </h4>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              exportStudentsToExcel(
                                                course.students,
                                                course.title
                                              )
                                            }
                                          >
                                            Export List
                                          </Button>
                                        </div>

                                        {course.students.length === 0 ? (
                                          <p className="text-gray-500 text-center py-4">
                                            No students enrolled yet.
                                          </p>
                                        ) : (
                                          <div className="space-y-2">
                                            {course.students.map(
                                              (enrollment: any) => (
                                                <div
                                                  key={enrollment.id}
                                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                  <div>
                                                    <p className="font-medium">
                                                      {enrollment.student.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                      {
                                                        enrollment.student
                                                          .matricNumber
                                                      }
                                                    </p>
                                                  </div>
                                                  <Badge variant="outline">
                                                    {enrollment.student.level}
                                                  </Badge>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </TabsContent>
                                    </Tabs>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    );
  };

  // Show admin view for department admins
  if (user?.role === "DEPARTMENT_ADMIN") {
    return renderAdminView();
  }

  // Show lecturer view for lecturers
  if (user?.role === "LECTURER") {
    return renderLecturerView();
  }

  // Show student view for students
  const firstSemester: Course[] = data?.firstSemester?.courses || [];
  const secondSemester: Course[] = data?.secondSemester?.courses || [];
  const allCourseIds = [...firstSemester, ...secondSemester].map((c) => c.id);
  const allSelected = allCourseIds.every((id) => selected.has(id));

  const firstStatus = data?.firstSemester?.status as string | null;
  const secondStatus = data?.secondSemester?.status as string | null;
  const disableFirst = !!(
    firstStatus &&
    firstStatus !== "DECLINED" &&
    firstStatus !== "DEPARTMENT_REJECTED"
  );
  const disableSecond = !!(
    secondStatus &&
    secondStatus !== "DECLINED" &&
    secondStatus !== "DEPARTMENT_REJECTED"
  );
  const isLocked = disableFirst || disableSecond;

  const statusColor = (s?: string | null) => {
    switch (s) {
      case "APPROVED":
      case "DEPARTMENT_APPROVED":
        return "text-green-600";
      case "PENDING":
        return "text-amber-600";
      case "DECLINED":
      case "DEPARTMENT_REJECTED":
        return "text-red-600";
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Register Courses</h2>
        <div className="text-sm text-muted-foreground">
          Level: {data?.level?.replace("LEVEL_", "")} • Credits (1st):{" "}
          {data?.firstSemester?.totalCredits} • Credits (2nd):{" "}
          {data?.secondSemester?.totalCredits}
        </div>
      </div>

      <div className="space-y-1">
        <div className={`text-lg font-semibold ${statusColor(firstStatus)}`}>
          First Semester: {firstStatus || "NONE"}
        </div>
        <div className={`text-lg font-semibold ${statusColor(secondStatus)}`}>
          Second Semester: {secondStatus || "NONE"}
        </div>
      </div>

      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">First Semester</TabsTrigger>
          <TabsTrigger value="second">Second Semester</TabsTrigger>
        </TabsList>
        <TabsContent value="first">
          {renderList(firstSemester, disableFirst)}
        </TabsContent>
        <TabsContent value="second">
          {renderList(secondSemester, disableSecond)}
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Selected {selected.size}/{allCourseIds.length}. You must select all
          courses in both semesters before submitting.
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => {
                setSelected((prev) => {
                  const next = new Set<string>();
                  if (!allSelected) {
                    allCourseIds.forEach((id) => next.add(id));
                  }
                  return next;
                });
              }}
              aria-label="Select all courses"
            />
            <span>Select all</span>
          </div>
          <Button onClick={save} disabled={!allSelected || saving || isLocked}>
            {saving ? "Submitting..." : "Submit Registration"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(StudentCourses);

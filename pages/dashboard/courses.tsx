import React, { useEffect, useState } from "react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>(
    {}
  );

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
          setPendingRegistrations(json.registrations || []);
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

  if (loading) {
    return <div className="p-6">Loading courses…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  const first: Course[] = data?.firstSemester?.courses || [];
  const second: Course[] = data?.secondSemester?.courses || [];
  const allCourseIds = [...first, ...second].map((c) => c.id);
  const allSelected = allCourseIds.every((id) => selected.has(id));

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
    }
  };

  const handleReview = async (
    registrationId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    try {
      const res = await fetch("/api/admin/course-registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          action,
          comments: reviewComments[registrationId] || undefined,
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
        setPendingRegistrations(refreshJson.registrations || []);
      }

      // Clear comment
      setReviewComments((prev) => {
        const next = { ...prev };
        delete next[registrationId];
        return next;
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Unable to review registration",
        variant: "destructive",
      });
    }
  };

  const renderList = (list: Course[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((c: Course) => (
        <Card
          key={c.id}
          className={`border ${selected.has(c.id) ? "ring-2 ring-primary" : ""}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selected.has(c.id)}
                  onCheckedChange={() => toggle(c.id)}
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
        <Badge variant="outline">{pendingRegistrations.length} Pending</Badge>
      </div>

      {pendingRegistrations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No pending course registrations to review.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRegistrations.map((registration) => (
            <Card
              key={registration.id}
              className="border-l-4 border-l-yellow-500"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <span className="text-lg">{registration.student.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {registration.student.matricNumber}
                    </Badge>
                    <Badge variant="secondary" className="ml-2">
                      {registration.student.level.replace("LEVEL_", "")}
                    </Badge>
                  </div>
                  <Badge variant="outline">
                    {registration.semester} {registration.academicYear}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Selected Courses:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {registration.selectedCourses.map((selection: any) => (
                        <div
                          key={selection.course.id}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm">
                            {selection.course.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {selection.course.code}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {selection.course.creditUnit} CU
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Review Comments (Optional):
                    </label>
                    <Textarea
                      placeholder="Add comments for approval/rejection..."
                      value={reviewComments[registration.id] || ""}
                      onChange={(e) =>
                        setReviewComments((prev) => ({
                          ...prev,
                          [registration.id]: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleReview(registration.id, "APPROVE")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(registration.id, "REJECT")}
                      variant="destructive"
                    >
                      Reject
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Submitted:{" "}
                      {new Date(registration.submittedAt).toLocaleDateString()}
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

  // Show admin view for department admins
  if (user?.role === "DEPARTMENT_ADMIN") {
    return renderAdminView();
  }

  // Show student view for students
  const firstSemester: Course[] = data?.firstSemester?.courses || [];
  const secondSemester: Course[] = data?.secondSemester?.courses || [];
  const allCourseIds = [...firstSemester, ...secondSemester].map((c) => c.id);
  const allSelected = allCourseIds.every((id) => selected.has(id));

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

      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">First Semester</TabsTrigger>
          <TabsTrigger value="second">Second Semester</TabsTrigger>
        </TabsList>
        <TabsContent value="first">{renderList(firstSemester)}</TabsContent>
        <TabsContent value="second">{renderList(secondSemester)}</TabsContent>
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
          <Button onClick={save} disabled={!allSelected}>
            Submit Registration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(StudentCourses);

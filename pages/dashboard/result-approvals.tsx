import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  MessageSquare,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { Download, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

interface ResultApproval {
  id: string;
  level: string;
  status: string;
  comments?: string;
  createdAt: string;
  result: {
    id: string;
    academicYear: string;
    semester: string;
    totalScore: number;
    grade: string;
    student: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
      department: {
        name: string;
      };
    };
    course: {
      id: string;
      title: string;
      code: string;
      department: {
        name: string;
      };
    };
  };
  departmentAdmin?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  schoolAdmin?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  senateAdmin?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

const ResultApprovals = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [approvals, setApprovals] = useState<ResultApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAcademicYear, setFilterAcademicYear] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [selectedApproval, setSelectedApproval] =
    useState<ResultApproval | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [comments, setComments] = useState("");
  const [processing, setProcessing] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [excludeUserId, setExcludeUserId] = useState("");

  // Fetch result approvals
  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterAcademicYear !== "all")
        params.append("academicYear", filterAcademicYear);
      if (filterSemester !== "all") params.append("semester", filterSemester);

      const res = await fetch(
        `/api/admin/result-approvals?${params.toString()}`
      );
      const data = await res.json();

      if (res.ok) {
        setApprovals(data.approvals || []);
      } else {
        throw new Error(data.message || "Failed to fetch approvals");
      }
    } catch (error) {
      console.error("Error fetching approvals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch result approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      user?.role &&
      ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role)
    ) {
      fetchApprovals();
    }
  }, [user?.role, filterStatus, filterAcademicYear, filterSemester]);

  const handleAction = async () => {
    if (!selectedApproval) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/result-approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultId: selectedApproval.result.id,
          action,
          comments: comments.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: `Result ${action}d successfully`,
        });

        // Refresh the approvals list
        await fetchApprovals();

        // Close dialog and reset
        setIsActionDialogOpen(false);
        setSelectedApproval(null);
        setComments("");
      } else {
        throw new Error(data.message || "Failed to process approval");
      }
    } catch (error) {
      console.error("Error processing approval:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process approval",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "DEPARTMENT_APPROVED":
        return (
          <Badge variant="default" className="bg-blue-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Dept Approved
          </Badge>
        );
      case "FACULTY_APPROVED":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Faculty Approved
          </Badge>
        );
      case "SENATE_APPROVED":
        return (
          <Badge variant="default" className="bg-emerald-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Senate Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGradeBadge = (grade: string) => {
    const gradeColors: { [key: string]: string } = {
      A: "bg-green-100 text-green-800",
      B: "bg-blue-100 text-blue-800",
      C: "bg-yellow-100 text-yellow-800",
      D: "bg-orange-100 text-orange-800",
      F: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={gradeColors[grade] || "bg-gray-100 text-gray-800"}>
        {grade}
      </Badge>
    );
  };

  const exportToExcel = () => {
    const rows = approvals.map((a) => ({
      FirstName: a.result.student.user.firstName,
      LastName: a.result.student.user.lastName,
      Email: a.result.student.user.email,
      Department: a.result.student.department.name,
      Course: a.result.course.title,
      Code: a.result.course.code,
      AcademicYear: a.result.academicYear,
      Semester: a.result.semester,
      Total: a.result.totalScore,
      Grade: a.result.grade,
      Status: a.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Approvals");
    XLSX.writeFile(wb, "result-approvals.xlsx");
  };

  const runAutoBackfill = async () => {
    setAutoBusy(true);
    try {
      const res = await fetch("/api/admin/auto-register-and-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeUserId: excludeUserId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Auto backfill failed");
      toast({
        title: "Done",
        description: `Backfilled ${data.students} students for ${data.session}`,
      });
      fetchApprovals();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAutoBusy(false);
    }
  };

  const canTakeAction = (approval: ResultApproval) => {
    if (user?.role === "DEPARTMENT_ADMIN") {
      return (
        approval.level === "DEPARTMENT_ADMIN" && approval.status === "PENDING"
      );
    } else if (user?.role === "SCHOOL_ADMIN") {
      return approval.level === "SCHOOL_ADMIN" && approval.status === "PENDING";
    } else if (user?.role === "SENATE_ADMIN") {
      return approval.level === "SENATE_ADMIN" && approval.status === "PENDING";
    }
    return false;
  };

  if (
    !user?.role ||
    !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role)
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access result approvals.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Result Approvals
          </h2>
          <p className="text-muted-foreground">
            Review and approve student results at{" "}
            {user.role.replace("_", " ").toLowerCase()} level
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Exclude userId (optional)"
            value={excludeUserId}
            onChange={(e) => setExcludeUserId(e.target.value)}
            className="hidden md:block w-64"
          />
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" /> Export Excel
          </Button>
          <Button onClick={runAutoBackfill} disabled={autoBusy}>
            <Wand2
              className={`h-4 w-4 mr-2 ${autoBusy ? "animate-spin" : ""}`}
            />
            Auto Backfill
          </Button>
          <Button onClick={fetchApprovals} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DEPARTMENT_APPROVED">
                    Department Approved
                  </SelectItem>
                  <SelectItem value="FACULTY_APPROVED">
                    Faculty Approved
                  </SelectItem>
                  <SelectItem value="SENATE_APPROVED">
                    Senate Approved
                  </SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-filter">Academic Year</Label>
              <Select
                value={filterAcademicYear}
                onValueChange={setFilterAcademicYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                  <SelectItem value="2022/2023">2022/2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester-filter">Semester</Label>
              <Select value={filterSemester} onValueChange={setFilterSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="FIRST">First Semester</SelectItem>
                  <SelectItem value="SECOND">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Result Approvals</CardTitle>
          <CardDescription>
            {approvals.length} result{approvals.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading approvals...</p>
            </div>
          ) : approvals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>CA</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {approval.result.student.user.firstName}{" "}
                              {approval.result.student.user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {approval.result.student.department.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {approval.result.course.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {approval.result.course.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {approval.result.academicYear}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {approval.result.semester}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {(approval.result as any).caScore ?? "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {(approval.result as any).examScore ?? "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {approval.result.totalScore.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {getGradeBadge(approval.result.grade)}
                      </TableCell>
                      <TableCell>{getStatusBadge(approval.status)}</TableCell>
                      <TableCell>
                        {canTakeAction(approval) ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedApproval(approval);
                                setAction("approve");
                                setIsActionDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedApproval(approval);
                                setAction("reject");
                                setIsActionDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {approval.status === "PENDING"
                              ? "Waiting for action"
                              : "Processed"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Approvals Found</h3>
              <p className="text-muted-foreground">
                No result approvals match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve Result" : "Reject Result"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "Are you sure you want to approve this result?"
                : "Are you sure you want to reject this result?"}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Result Details</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Student:</strong>{" "}
                    {selectedApproval.result.student.user.firstName}{" "}
                    {selectedApproval.result.student.user.lastName}
                  </div>
                  <div>
                    <strong>Course:</strong>{" "}
                    {selectedApproval.result.course.title} (
                    {selectedApproval.result.course.code})
                  </div>
                  <div>
                    <strong>Score:</strong>{" "}
                    {selectedApproval.result.totalScore.toFixed(1)}%
                  </div>
                  <div>
                    <strong>Grade:</strong> {selectedApproval.result.grade}
                  </div>
                  <div>
                    <strong>Academic Year:</strong>{" "}
                    {selectedApproval.result.academicYear}
                  </div>
                  <div>
                    <strong>Semester:</strong>{" "}
                    {selectedApproval.result.semester}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">
                  Comments {action === "reject" && "(Required for rejection)"}
                </Label>
                <Textarea
                  id="comments"
                  placeholder={
                    action === "approve"
                      ? "Optional comments for approval..."
                      : "Please provide reason for rejection..."
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsActionDialogOpen(false);
                    setSelectedApproval(null);
                    setComments("");
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={
                    processing || (action === "reject" && !comments.trim())
                  }
                  variant={action === "approve" ? "default" : "destructive"}
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {action === "approve" ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {action === "approve" ? "Approve" : "Reject"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withDashboardLayout(ResultApprovals);

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCourseRegistrations } from "@/hooks/useSWRData";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calculator,
  Eye,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";

const CourseRegistrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [semester, setSemester] = useState("FIRST");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reviewing, setReviewing] = useState(false);

  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [reviewComments, setReviewComments] = useState("");

  // SWR hook for course registrations data
  const {
    registrations = [],
    statistics = null,
    isLoading,
    error,
    mutate: mutateRegistrations
  } = useAdminCourseRegistrations(academicYear, semester, statusFilter);

  // Handle SWR errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load course registrations",
        variant: "destructive",
      });
    }
  }, [error, toast]);


  const handleReview = (registration: any, action: "approve" | "reject") => {
    setSelectedRegistration(registration);
    setReviewAction(action);
    setReviewComments("");
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedRegistration || !reviewAction) return;

    setReviewing(true);
    try {
      const response = await fetch("/api/admin/course-registrations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId: selectedRegistration.id,
          action: reviewAction,
          comments: reviewComments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        setReviewDialogOpen(false);
        // Revalidate registrations
        mutateRegistrations();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to review registration");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to review registration",
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
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
          Loading course registrations...
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
            Course Registrations
          </h2>
          <p className="text-muted-foreground">
            Review and approve student course registrations
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
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
            <div className="flex items-center space-x-2">
              <Label htmlFor="status">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DEPARTMENT_APPROVED">Approved</SelectItem>
                  <SelectItem value="DEPARTMENT_REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">{statistics.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold">{statistics.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold">{statistics.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Registrations</CardTitle>
          <CardDescription>
            Review and approve student course registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric Number</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.student.name}
                    </TableCell>
                    <TableCell>{registration.student.matricNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {registration.student.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{registration.courseCount}</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Selected Courses</DialogTitle>
                              <DialogDescription>
                                {registration.student.name} -{" "}
                                {registration.student.matricNumber}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                              {registration.selectedCourses.map(
                                (selection: any) => (
                                  <div
                                    key={selection.id}
                                    className="flex justify-between items-center p-2 border rounded"
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {selection.course.title}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {selection.course.code} •{" "}
                                        {selection.course.level}
                                      </p>
                                    </div>
                                    <Badge variant="outline">
                                      {selection.course.creditUnit} credits
                                    </Badge>
                                  </div>
                                )
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-4 w-4" />
                        <span>{registration.totalCredits}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(registration.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(registration.status)}>
                        {getStatusIcon(registration.status)}
                        <span className="ml-1">
                          {registration.status.replace("_", " ")}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {registration.status === "PENDING" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleReview(registration, "approve")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleReview(registration, "reject")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {registration.status !== "PENDING" && (
                          <div className="text-sm text-muted-foreground">
                            Reviewed by {registration.reviewedBy?.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <AlertDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Course
              Registration?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {reviewAction} the course registration for{" "}
              {selectedRegistration?.student.name} (
              {selectedRegistration?.student.matricNumber}).
              <br />
              <br />
              <strong>Selected Courses:</strong>{" "}
              {selectedRegistration?.courseCount}
              <br />
              <strong>Total Credits:</strong>{" "}
              {selectedRegistration?.totalCredits}
              <br />
              <br />
              {reviewAction === "reject" && (
                <span className="text-red-600">
                  The student will need to register again if rejected.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Add any comments for the student..."
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitReview}
              disabled={reviewing}
              className={
                reviewAction === "reject" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {reviewing
                ? "Processing..."
                : `${reviewAction === "approve" ? "Approve" : "Reject"} Registration`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withDashboardLayout(CourseRegistrations);

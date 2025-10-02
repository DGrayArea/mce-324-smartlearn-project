import React from "react";
import { useAuth } from "@/contexts/AuthContext";
// Removed dummy data import; this page will fetch from APIs when available
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Calendar,
  Clock,
  Download,
  Upload,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { withDashboardLayout } from "@/lib/layoutWrappers";

const Assignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const assignments: any[] = [];

  const handleCreateAssignment = () => {
    toast({
      title: "Create Assignment",
      description: "Assignment creation form opened (demo mode)",
    });
  };

  const handleSubmit = (assignmentId: string) => {
    toast({
      title: "Assignment Submitted",
      description:
        "Your assignment has been submitted successfully (demo mode)",
    });
  };

  const handleDownload = (assignmentTitle: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${assignmentTitle} (demo mode)`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "outline";
      case "graded":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === "LECTURER"
              ? "Course Assignments"
              : "My Assignments"}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "LECTURER"
              ? "Manage assignments and review student submissions."
              : "View and submit your course assignments."}
          </p>
        </div>
        {user?.role === "LECTURER" && (
          <Button onClick={handleCreateAssignment}>
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.length === 0 && (
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>No Assignments</CardTitle>
              <CardDescription>
                {user?.role === "LECTURER"
                  ? "No assignments found. Create assignments from your course tools."
                  : "No assignments are available at the moment."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="overflow-hidden">
            <CardHeader className="border-b p-4">
              <div className="flex justify-between items-start">
                <Badge variant={getStatusColor(assignment.status)}>
                  {assignment.status}
                </Badge>
                <div className="text-right text-xs text-muted-foreground">
                  {assignment.grade !== undefined
                    ? `${assignment.grade}/${assignment.maxGrade}`
                    : `Max: ${assignment.maxGrade}`}
                </div>
              </div>
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <CardDescription>{assignment.course}</CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                {assignment.description}
              </div>

              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  Due: {format(new Date(assignment.dueDate), "MMM dd, yyyy")}
                </span>
              </div>

              {assignment.submissionDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    Submitted:{" "}
                    {format(
                      new Date(assignment.submissionDate),
                      "MMM dd, yyyy"
                    )}
                  </span>
                </div>
              )}

              {assignment.grade !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Grade</span>
                    <span>
                      {assignment.grade}/{assignment.maxGrade} (
                      {Math.round(
                        (assignment.grade / assignment.maxGrade) * 100
                      )}
                      %)
                    </span>
                  </div>
                  <Progress
                    value={(assignment.grade / assignment.maxGrade) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>

            <div className="border-t p-4 flex justify-between">
              <Button variant="outline" size="sm" disabled>
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default withDashboardLayout(Assignments);

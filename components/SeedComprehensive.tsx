import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function SeedComprehensive() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const seedComprehensiveData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seed-comprehensive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Created comprehensive academic data: ${data.summary.faculties} faculties, ${data.summary.departments} departments, ${data.summary.courses} courses, and more!`,
        });

        // Log credentials for easy access
        console.log("=== COMPREHENSIVE ACADEMIC DATA CREATED ===");
        console.log("Senate Admin:", data.credentials.senateAdmin);
        console.log("Faculty Admins:", data.credentials.facultyAdmins);
        console.log("Department Admins:", data.credentials.departmentAdmins);
        console.log("Lecturers:", data.credentials.lecturers);
        console.log("Students:", data.credentials.students);
        console.log("==========================================");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create comprehensive data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create comprehensive data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Seed Comprehensive Academic Data</CardTitle>
        <CardDescription>
          Create a complete academic structure with faculties, departments,
          courses, and all user roles with proper hierarchy and relationships.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>This will create:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>4 Faculties (Engineering, Science, Arts, Social Sciences)</li>
            <li>10 Departments across all faculties</li>
            <li>1 Senate Admin (highest authority)</li>
            <li>4 Faculty Admins (one per faculty)</li>
            <li>3 Department Admins (sample departments)</li>
            <li>4 Lecturers (assigned to departments)</li>
            <li>4 Students (different levels and departments)</li>
            <li>9 Courses (with credit units and proper assignments)</li>
            <li>Course assignments (lecturers assigned to courses)</li>
            <li>Student enrollments and sample results</li>
          </ul>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Role Hierarchy:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>Senate Admin:</strong> Creates all courses, manages entire
              system
            </li>
            <li>
              <strong>Faculty Admin:</strong> Manages faculty, creates
              department admins
            </li>
            <li>
              <strong>Department Admin:</strong> Assigns lecturers to courses in
              their department
            </li>
            <li>
              <strong>Lecturer:</strong> Teaches assigned courses, manages
              content
            </li>
            <li>
              <strong>Student:</strong> Enrolls in courses, views results
            </li>
          </ul>
        </div>

        <Button
          onClick={seedComprehensiveData}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading
            ? "Creating Academic Data..."
            : "Create Comprehensive Academic Data"}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> This will clear existing data and create a
            fresh academic structure. Check the browser console for login
            credentials after creation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

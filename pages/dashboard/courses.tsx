import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { studentCourses, lecturerCourses, allCourses } from "@/lib/dummyData";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, Clock, Bookmark, Users, Plus } from "lucide-react";
import CourseFeedback from "@/components/dashboard/CourseFeedback";
import { withDashboardLayout } from "@/lib/layoutWrappers";

const Courses = () => {
  const { user } = useAuth();

  // Select courses based on user role
  const getCourses = () => {
    switch (user?.role) {
      case "student":
        return studentCourses;
      case "lecturer":
        return lecturerCourses;
      case "admin":
        return allCourses;
      default:
        return [];
    }
  };

  const courses = getCourses();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {user?.role === "lecturer"
              ? "My Teaching Courses"
              : user?.role === "admin"
                ? "All Courses"
                : "My Enrolled Courses"}
          </h2>
          <p className="text-muted-foreground">
            {user?.role === "lecturer"
              ? "Manage your teaching courses and student progress."
              : user?.role === "admin"
                ? "Manage all courses across departments."
                : "View and access your enrolled courses."}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {user?.role === "lecturer"
            ? "Create Course"
            : user?.role === "admin"
              ? "Add Course"
              : "Enroll Course"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/40 p-4">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="mb-2">
                  {course.code}
                </Badge>
                <Badge
                  variant={
                    course.status === "active"
                      ? "default"
                      : course.status === "completed"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {course.status}
                </Badge>
              </div>
              <CardTitle>{course.name}</CardTitle>
              <CardDescription>
                {course.credits} Credits • {course.semester}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="text-sm">{course.description}</div>

              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{course.schedule}</span>
              </div>

              {user?.role !== "admin" && course.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Course Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-1" />
                </div>
              )}

              {(user?.role === "lecturer" || user?.role === "admin") &&
                course.students && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{course.students} Students Enrolled</span>
                  </div>
                )}
            </CardContent>

            <CardFooter className="border-t p-4 flex justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {user?.role === "student" ? "View Content" : "Manage"}
                </Button>
                {user?.role === "student" && <CourseFeedback course={course} />}
              </div>
              {user?.role !== "admin" && (
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default withDashboardLayout(Courses);

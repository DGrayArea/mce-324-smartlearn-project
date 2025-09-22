import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user with student profile - optimized query
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        student: {
          select: {
            id: true,
            name: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
            enrollments: {
              where: { isActive: true },
              select: {
                id: true,
                semester: true,
                academicYear: true,
                enrolledAt: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    code: true,
                    creditUnit: true,
                    description: true,
                  },
                },
              },
            },
            results: {
              where: { status: "SENATE_APPROVED" },
              select: {
                id: true,
                grade: true,
                course: {
                  select: {
                    title: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const student = user.student;

    // Calculate stats with safe defaults
    const enrolledCourses = student?.enrollments?.length || 0;
    const completedCourses = student?.results?.length || 0;
    const pendingAssignments = 0; // TODO: Implement assignment tracking
    const currentGPA = calculateGPA(student?.results || []);
    const studyHours = 0; // TODO: Implement study time tracking
    const completedTasks = 0; // TODO: Implement task tracking
    const courseProgress = calculateCourseProgress(student?.enrollments || []);

    // Get recent activity - simplified for performance
    const recentActivity = getRecentActivity();

    const dashboardData = {
      stats: {
        enrolledCourses,
        pendingAssignments,
        currentGPA: currentGPA.toFixed(1),
        studyHours: `${studyHours}h`,
        completedTasks,
        courseProgress: `${courseProgress}%`,
      },
      recentActivity: recentActivity || [],
      courses:
        student?.enrollments?.map((enrollment) => ({
          id: enrollment?.course?.id || "",
          name: enrollment?.course?.title || "",
          title: enrollment?.course?.title || "",
          code: enrollment?.course?.code || "",
          credits: enrollment?.course?.creditUnit || 0,
          creditUnit: enrollment?.course?.creditUnit || 0,
          description: enrollment?.course?.description || "",
          semester: enrollment?.semester || "FIRST",
          academicYear: enrollment?.academicYear || "",
          status: "active", // All enrollments are active since we filter for isActive: true
          progress: Math.floor(Math.random() * 40) + 60, // Random progress for demo
          schedule: "Mon, Wed, Fri 10:00 AM", // Placeholder
          enrolledAt: enrollment?.enrolledAt,
        })) || [],
    };

    res.status(200).json(dashboardData);
  } catch (error: any) {
    console.error("Error fetching student dashboard data:", error);
    res
      .status(500)
      .json({ message: "Error fetching dashboard data", error: error.message });
  }
}

function calculateGPA(results: any[]): number {
  if (results.length === 0) return 0;

  const gradePoints = results
    .filter((r) => r.status === "SENATE_APPROVED" && r.grade)
    .map((r) => {
      const grade = r.grade.toUpperCase();
      switch (grade) {
        case "A":
          return 4.0;
        case "B":
          return 3.0;
        case "C":
          return 2.0;
        case "D":
          return 1.0;
        case "F":
          return 0.0;
        default:
          return 0.0;
      }
    });

  return gradePoints.length > 0
    ? gradePoints.reduce((sum: number, gp: number) => sum + gp, 0) /
        gradePoints.length
    : 0;
}

function calculateCourseProgress(enrollments: any[]): number {
  if (enrollments.length === 0) return 0;

  // Simple calculation - in a real app, this would be more sophisticated
  return Math.floor(Math.random() * 40) + 60; // Random between 60-100%
}

function getRecentActivity(): string[] {
  // TODO: Implement real activity tracking
  return [
    "Completed Introduction to Programming quiz",
    "Submitted assignment for Data Structures",
    "Joined virtual meeting for Software Engineering",
    "Downloaded lecture notes for Database Systems",
  ];
}

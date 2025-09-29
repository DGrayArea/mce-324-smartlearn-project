/**
 * Lecturer Dashboard Overview API
 * Provides comprehensive view of lecturer's courses, students, and management capabilities
 */

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

    // Get lecturer with comprehensive course information
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        department: {
          select: { name: true, code: true },
        },
        courseAssignments: {
          where: { isActive: true },
          select: {
            id: true,
            academicYear: true,
            semester: true,
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                creditUnit: true,
                description: true,
                type: true,
                level: true,
                semester: true,
                department: {
                  select: { name: true, code: true },
                },
                school: {
                  select: { name: true, code: true },
                },
                _count: {
                  select: {
                    enrollments: {
                      where: { isActive: true },
                    },
                    contents: {
                      where: { isActive: true },
                    },
                    results: {
                      where: { status: { not: "REJECTED" } },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            course: { code: "asc" },
          },
        },
      },
    });

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer profile not found" });
    }

    // Calculate comprehensive statistics
    const totalCourses = lecturer.courseAssignments.length;
    const totalStudents = lecturer.courseAssignments.reduce(
      (sum, assignment) => sum + assignment.course._count.enrollments,
      0
    );
    const totalDocuments = lecturer.courseAssignments.reduce(
      (sum, assignment) => sum + assignment.course._count.contents,
      0
    );
    const totalResults = lecturer.courseAssignments.reduce(
      (sum, assignment) => sum + assignment.course._count.results,
      0
    );

    // Get document download statistics
    const courseIds = lecturer.courseAssignments.map((ca) => ca.course.id);
    const totalDownloads = await prisma.content.aggregate({
      where: {
        courseId: { in: courseIds },
        isActive: true,
      },
      _sum: {
        downloadCount: true,
      },
    });

    // Get pending results for review
    const pendingResults = await prisma.result.count({
      where: {
        courseId: { in: courseIds },
        status: "PENDING",
      },
    });

    // Get approved results
    const approvedResults = await prisma.result.count({
      where: {
        courseId: { in: courseIds },
        status: "SENATE_APPROVED",
      },
    });

    // Get results by approval status
    const resultsByStatus = await prisma.result.groupBy({
      by: ["status"],
      where: {
        courseId: { in: courseIds },
      },
      _count: {
        status: true,
      },
    });

    // Transform course assignments with detailed information
    const coursesWithDetails = lecturer.courseAssignments.map((assignment) => {
      const course = assignment.course;
      return {
        id: course.id,
        title: course.title,
        code: course.code,
        creditUnit: course.creditUnit,
        description: course.description,
        type: course.type,
        level: course.level,
        semester: assignment.semester,
        academicYear: assignment.academicYear,
        department: course.department,
        school: course.school,
        studentCount: course._count.enrollments,
        documentCount: course._count.contents,
        resultCount: course._count.results,
        assignmentId: assignment.id,
        // Management capabilities
        canManageGrades: true,
        canManageDocuments: true,
        canViewStudents: true,
        canCreateQuizzes: true,
      };
    });

    // Group courses by academic year and semester
    const coursesBySession = coursesWithDetails.reduce(
      (acc, course) => {
        const key = `${course.academicYear}-${course.semester}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(course);
        return acc;
      },
      {} as Record<string, typeof coursesWithDetails>
    );

    // Calculate management statistics
    const managementStats = {
      totalCourses,
      totalStudents,
      totalDocuments,
      totalDownloads: totalDownloads._sum.downloadCount || 0,
      totalResults,
      pendingResults,
      approvedResults,
      resultsByStatus: resultsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivities = await prisma.result.findMany({
      where: {
        courseId: { in: courseIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        course: {
          select: { code: true, title: true },
        },
        student: {
          select: { name: true, matricNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return res.status(200).json({
      lecturer: {
        id: lecturer.id,
        name: lecturer.name || lecturer.user.name,
        email: lecturer.user.email,
        department: lecturer.department,
      },
      courses: coursesWithDetails,
      coursesBySession,
      statistics: managementStats,
      recentActivities,
      capabilities: {
        gradeManagement: true,
        documentManagement: true,
        studentManagement: true,
        quizManagement: true,
        courseOverview: true,
      },
    });
  } catch (error) {
    console.error("Error fetching lecturer dashboard overview:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        lecturer: true,
        departmentAdmin: true,
        schoolAdmin: true,
        senateAdmin: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has access to analytics
    const hasAccess = [
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
    ].includes(currentUser.role);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.method === "GET") {
      const { timeRange = "30d" } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get analytics based on user role and scope
      let analytics: any = {};

      if (currentUser.role === "SENATE_ADMIN") {
        // System-wide analytics
        analytics = await getSystemWideAnalytics(startDate, now);
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // School-level analytics
        analytics = await getSchoolAnalytics(
          currentUser.schoolAdmin.schoolId,
          startDate,
          now
        );
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Department-level analytics
        analytics = await getDepartmentAnalytics(
          currentUser.departmentAdmin.departmentId,
          startDate,
          now
        );
      }

      return res.status(200).json({ analytics });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in analytics API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

async function getSystemWideAnalytics(startDate: Date, endDate: Date) {
  // User statistics
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({
    where: {
      isActive: true,
      updatedAt: { gte: startDate },
    },
  });

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true },
    where: { isActive: true },
  });

  // Course statistics
  const totalCourses = await prisma.course.count();
  const activeCourses = await prisma.course.count({
    where: { isActive: true },
  });

  const totalEnrollments = await prisma.enrollment.count({
    where: { isActive: true },
  });

  // Content statistics
  const totalDocuments = await prisma.content.count();
  const totalQuizzes = await prisma.quiz.count();
  const totalAssignments = await prisma.assignment.count();

  // Forum and Q&A statistics
  const totalForumThreads = await prisma.forumThread.count();
  const totalForumPosts = await prisma.forumPost.count();
  const totalQuestions = await prisma.question.count();
  const totalAnswers = await prisma.answer.count();

  // Recent activity
  const recentLogins = await prisma.loginLog.count({
    where: { loginAt: { gte: startDate } },
  });

  const recentEnrollments = await prisma.enrollment.count({
    where: { enrolledAt: { gte: startDate } },
  });

  const recentContent = await prisma.content.count({
    where: { uploadedAt: { gte: startDate } },
  });

  // Grade distribution
  const gradeDistribution = await prisma.result.groupBy({
    by: ["grade"],
    _count: { grade: true },
  });

  // Engagement metrics
  const avgCourseEnrollments = totalEnrollments / totalCourses;
  const forumEngagement = totalForumPosts / Math.max(totalForumThreads, 1);
  const qaEngagement = totalAnswers / Math.max(totalQuestions, 1);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      byRole: usersByRole.reduce(
        (acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
    courses: {
      total: totalCourses,
      active: activeCourses,
      totalEnrollments,
      avgEnrollments: Math.round(avgCourseEnrollments * 100) / 100,
    },
    content: {
      documents: totalDocuments,
      quizzes: totalQuizzes,
      assignments: totalAssignments,
    },
    engagement: {
      forumThreads: totalForumThreads,
      forumPosts: totalForumPosts,
      questions: totalQuestions,
      answers: totalAnswers,
      forumEngagement: Math.round(forumEngagement * 100) / 100,
      qaEngagement: Math.round(qaEngagement * 100) / 100,
    },
    activity: {
      recentLogins,
      recentEnrollments,
      recentContent,
    },
    grades: {
      distribution: gradeDistribution.reduce(
        (acc, item) => {
          acc[item.grade] = item._count.grade;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };
}

async function getSchoolAnalytics(
  schoolId: string,
  startDate: Date,
  endDate: Date
) {
  // Get departments in this school
  const departments = await prisma.department.findMany({
    where: { schoolId },
    select: { id: true },
  });

  const departmentIds = departments.map((d) => d.id);

  // User statistics for this school
  const totalUsers = await prisma.user.count({
    where: {
      OR: [
        { student: { departmentId: { in: departmentIds } } },
        { lecturer: { departmentId: { in: departmentIds } } },
        { departmentAdmin: { departmentId: { in: departmentIds } } },
        { schoolAdmin: { schoolId } },
      ],
      isActive: true,
    },
  });

  // Course statistics
  const totalCourses = await prisma.course.count({
    where: { schoolId, isActive: true },
  });

  const totalEnrollments = await prisma.enrollment.count({
    where: {
      course: { schoolId },
      isActive: true,
    },
  });

  // Content statistics
  const totalDocuments = await prisma.content.count({
    where: { course: { schoolId } },
  });

  const totalQuizzes = await prisma.quiz.count({
    where: { course: { schoolId } },
  });

  // Recent activity
  const recentEnrollments = await prisma.enrollment.count({
    where: {
      course: { schoolId },
      enrolledAt: { gte: startDate },
    },
  });

  return {
    users: { total: totalUsers },
    courses: { total: totalCourses, totalEnrollments },
    content: { documents: totalDocuments, quizzes: totalQuizzes },
    activity: { recentEnrollments },
  };
}

async function getDepartmentAnalytics(
  departmentId: string,
  startDate: Date,
  endDate: Date
) {
  // User statistics for this department
  const totalUsers = await prisma.user.count({
    where: {
      OR: [
        { student: { departmentId } },
        { lecturer: { departmentId } },
        { departmentAdmin: { departmentId } },
      ],
      isActive: true,
    },
  });

  // Course statistics
  const totalCourses = await prisma.course.count({
    where: { departmentId, isActive: true },
  });

  const totalEnrollments = await prisma.enrollment.count({
    where: {
      course: { departmentId },
      isActive: true,
    },
  });

  // Content statistics
  const totalDocuments = await prisma.content.count({
    where: { course: { departmentId } },
  });

  const totalQuizzes = await prisma.quiz.count({
    where: { course: { departmentId } },
  });

  // Recent activity
  const recentEnrollments = await prisma.enrollment.count({
    where: {
      course: { departmentId },
      enrolledAt: { gte: startDate },
    },
  });

  return {
    users: { total: totalUsers },
    courses: { total: totalCourses, totalEnrollments },
    content: { documents: totalDocuments, quizzes: totalQuizzes },
    activity: { recentEnrollments },
  };
}

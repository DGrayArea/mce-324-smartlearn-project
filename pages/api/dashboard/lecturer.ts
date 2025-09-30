import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    const userId = (session?.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user with lecturer profile - optimized query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        lecturer: {
          select: {
            id: true,
            name: true,
            department: {
              select: {
                name: true,
                code: true,
                school: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
            courseAssignments: {
              where: {
                isActive: true,
                academicYear: "2024/2025",
                semester: "FIRST",
              },
              select: {
                id: true,
                semester: true,
                academicYear: true,
                createdAt: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    code: true,
                    creditUnit: true,
                    description: true,
                    type: true,
                    level: true,
                    department: {
                      select: { name: true, code: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.lecturer) {
      return res.status(404).json({ message: "Lecturer profile not found" });
    }

    const lecturer = user.lecturer;

    // Calculate stats
    const coursesTeaching = lecturer.courseAssignments.length;
    const totalStudents = await calculateTotalStudents(
      lecturer.courseAssignments
    );

    // Calculate document download statistics
    const courseIds = lecturer.courseAssignments
      .map((ca) => ca.course.id)
      .filter(Boolean);

    let totalDownloads = { _sum: { downloadCount: 0 } };
    let totalDocuments = 0;

    if (courseIds.length > 0) {
      totalDownloads = await prisma.content.aggregate({
        where: {
          courseId: { in: courseIds },
          isActive: true,
        },
        _sum: {
          downloadCount: true,
        },
      });

      totalDocuments = await prisma.content.count({
        where: {
          courseId: { in: courseIds },
          isActive: true,
        },
      });
    }

    // Calculate real pending reviews from assignments
    const pendingReviews =
      courseIds.length > 0
        ? await prisma.assignmentSubmission.count({
            where: {
              assignment: {
                courseId: { in: courseIds },
              },
              gradedAt: null, // Not yet graded
            },
          })
        : 0;

    // Calculate average class rating (placeholder - no rating model exists yet)
    const avgClassRating = 4.5; // TODO: Implement course rating system

    // Calculate attendance rate (placeholder - no attendance model exists yet)
    const attendanceRate = 85; // TODO: Implement attendance tracking system

    // Calculate active discussions from course communications
    const activeDiscussions =
      courseIds.length > 0
        ? await prisma.courseCommunication.count({
            where: {
              courseId: { in: courseIds },
              type: "CHAT_MESSAGE",
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          })
        : 0;

    // Get real recent activity
    const recentActivity = await getRealRecentActivity(lecturer.id, courseIds);

    const dashboardData = {
      stats: {
        coursesTeaching,
        totalStudents,
        totalDocuments,
        totalDownloads: totalDownloads._sum.downloadCount || 0,
        pendingReviews,
        avgClassRating: avgClassRating.toFixed(1),
        attendanceRate: `${attendanceRate}%`,
        activeDiscussions,
      },
      recentActivity,
      courses: lecturer.courseAssignments.map((assignment) => ({
        id: assignment.course.id,
        title: assignment.course.title,
        code: assignment.course.code,
        creditUnit: assignment.course.creditUnit,
        description: assignment.course.description,
        type: assignment.course.type,
        level: assignment.course.level,
        semester: assignment.semester,
        academicYear: assignment.academicYear,
        department: assignment.course.department,
        studentCount: 0, // Will be calculated separately if needed
        assignedAt: assignment.createdAt,
        isActive: true,
      })),
    };

    res.status(200).json(dashboardData);
  } catch (error: any) {
    console.error("Error fetching lecturer dashboard data:", error);
    res
      .status(500)
      .json({ message: "Error fetching dashboard data", error: error.message });
  }
}

async function calculateTotalStudents(
  courseAssignments: any[]
): Promise<number> {
  if (courseAssignments.length === 0) return 0;

  const courseIds = courseAssignments.map((ca) => ca.course.id).filter(Boolean);

  if (courseIds.length === 0) return 0;

  const enrollments = await prisma.enrollment.count({
    where: {
      courseId: {
        in: courseIds,
      },
      isActive: true,
    },
  });

  return enrollments;
}

async function getRealRecentActivity(
  lecturerId: string,
  courseIds: string[]
): Promise<string[]> {
  const activities: string[] = [];

  if (courseIds.length === 0) {
    return [
      "Welcome to the platform! You haven't been assigned to any courses yet.",
    ];
  }

  try {
    // Get recent assignment submissions graded
    const recentGradedSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          courseId: { in: courseIds },
        },
        gradedAt: {
          not: null,
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        assignment: {
          include: { course: { select: { title: true } } },
        },
      },
      orderBy: { gradedAt: "desc" },
      take: 2,
    });

    recentGradedSubmissions.forEach((submission) => {
      activities.push(
        `Graded assignment for ${submission.assignment.course.title}`
      );
    });

    // Get recent content uploads (simplified - no uploadedBy field exists)
    const recentContent = await prisma.content.findMany({
      where: {
        courseId: { in: courseIds },
        isActive: true,
        uploadedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        course: { select: { title: true } },
      },
      orderBy: { uploadedAt: "desc" },
      take: 2,
    });

    recentContent.forEach((content) => {
      activities.push(
        `Uploaded ${content.documentType} for ${content.course.title}`
      );
    });

    // Get recent course communications
    const recentMessages = await prisma.courseCommunication.findMany({
      where: {
        courseId: { in: courseIds },
        user: { lecturer: { id: lecturerId } },
      },
      include: {
        course: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    recentMessages.forEach((message) => {
      if (message.type === "CHAT_MESSAGE") {
        activities.push(`Responded in ${message.course.title} chat`);
      } else if (message.type === "QUESTION") {
        activities.push(`Answered question in ${message.course.title}`);
      }
    });

    // If no activities, return default
    if (activities.length === 0) {
      return [
        "Welcome to the teaching platform!",
        "Check your assigned courses",
        "Upload course materials",
        "Engage with students",
      ];
    }

    return activities.slice(0, 4); // Return max 4 activities
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [
      "Welcome to the teaching platform!",
      "Check your assigned courses",
      "Upload course materials",
      "Engage with students",
    ];
  }
}

function getRecentActivity(): string[] {
  // Fallback function - kept for compatibility
  return [
    "Graded 15 assignments for Web Development",
    "Uploaded new lecture for Database Systems",
    "Scheduled virtual meeting for tomorrow",
    "Responded to 8 student questions",
  ];
}

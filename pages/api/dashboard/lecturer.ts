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

    // Get user with lecturer profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        lecturer: {
          include: {
            department: {
              include: {
                school: true,
              },
            },
            courseAssignments: {
              where: {
                isActive: true,
                academicYear: "2024/2025", // Current academic year
                semester: "FIRST", // Current semester
              },
              include: {
                course: {
                  include: {
                    department: {
                      select: { name: true, code: true },
                    },
                    _count: {
                      select: {
                        enrollments: {
                          where: {
                            isActive: true,
                            academicYear: "2024/2025",
                            semester: "FIRST",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            virtualClasses: {
              include: {
                course: true,
              },
            },
            notifications: {
              where: {
                isRead: false,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 5,
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
    const pendingReviews = 0; // TODO: Implement assignment review tracking
    const avgClassRating = 4.8; // TODO: Implement rating system
    const attendanceRate = 94; // TODO: Implement attendance tracking
    const activeDiscussions = 28; // TODO: Implement discussion tracking

    // Get recent activity
    const recentActivity = await getRecentActivity(lecturer.id);

    const dashboardData = {
      stats: {
        coursesTeaching,
        totalStudents,
        pendingReviews,
        avgClassRating: avgClassRating.toFixed(1),
        attendanceRate: `${attendanceRate}%`,
        activeDiscussions,
      },
      recentActivity,
      notifications: lecturer.notifications,
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
        studentCount: assignment.course._count.enrollments,
        assignedAt: assignment.createdAt,
        isActive: assignment.isActive,
      })),
      virtualClasses: lecturer.virtualClasses.map((vc) => ({
        id: vc.id,
        title: vc.title,
        courseTitle: vc.course.title,
        scheduledAt: vc.scheduledAt,
        duration: vc.duration,
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

  const courseIds = courseAssignments.map((ca) => ca.courseId);
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

async function getRecentActivity(lecturerId: string): Promise<string[]> {
  // TODO: Implement real activity tracking
  return [
    "Graded 15 assignments for Web Development",
    "Uploaded new lecture for Database Systems",
    "Scheduled virtual meeting for tomorrow",
    "Responded to 8 student questions",
  ];
}

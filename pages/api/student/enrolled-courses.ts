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

    if (!session?.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get current user with student data
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        student: {
          include: {
            department: {
              include: {
                school: true,
              },
            },
          },
        },
      },
    });

    if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.student) {
      return res.status(403).json({ message: "Forbidden: Student access required" });
    }

    const studentId = currentUser.student.id;

    // Get enrolled courses (approved registrations)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
        isActive: true, // Only active enrollments
      },
      include: {
        course: {
          include: {
            department: {
              select: { name: true, code: true },
            },
            school: {
              select: { name: true, code: true },
            },
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    // Get pending course registrations (not yet approved)
    const pendingRegistrations = await prisma.courseRegistration.findMany({
      where: {
        studentId,
        status: "PENDING",
      },
      include: {
        selectedCourses: {
          include: {
            course: {
              include: {
                department: {
                  select: { name: true, code: true },
                },
                school: {
                  select: { name: true, code: true },
                },
                _count: {
                  select: { enrollments: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format enrolled courses
    const enrolledCourses = enrollments.map((enrollment) => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      code: enrollment.course.code,
      description: enrollment.course.description,
      creditUnit: enrollment.course.creditUnit,
      level: enrollment.course.level,
      semester: enrollment.course.semester,
      type: enrollment.course.type,
      department: enrollment.course.department,
      school: enrollment.course.school,
      enrolledCount: enrollment.course._count.enrollments,
      enrollmentId: enrollment.id,
      enrollmentDate: enrollment.enrolledAt,
      status: "ENROLLED",
    }));

    // Format pending courses
    const pendingCourses = pendingRegistrations.flatMap((registration) =>
      registration.selectedCourses.map((selection) => ({
        id: selection.course.id,
        title: selection.course.title,
        code: selection.course.code,
        description: selection.course.description,
        creditUnit: selection.course.creditUnit,
        level: selection.course.level,
        type: selection.course.type,
        department: selection.course.department,
        school: selection.course.school,
        enrolledCount: selection.course._count.enrollments,
        registrationId: registration.id,
        registrationDate: registration.createdAt,
        status: "PENDING",
        academicYear: registration.academicYear,
        semester: registration.semester,
      }))
    );

    return res.status(200).json({
      enrolledCourses,
      pendingCourses,
      totalEnrolled: enrolledCourses.length,
      totalPending: pendingCourses.length,
      student: {
        id: currentUser.student.id,
        level: currentUser.student.level,
        department: currentUser.student.department,
      },
    });
  } catch (error) {
    console.error("Get enrolled courses error:", error);
    return res.status(500).json({
      message: "Failed to fetch enrolled courses",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

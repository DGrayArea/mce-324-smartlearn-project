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

  // Check if user is department admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      departmentAdmin: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!user || user.role !== "DEPARTMENT_ADMIN" || !user.departmentAdmin) {
    return res.status(403).json({ message: "Access denied" });
  }

  const departmentId = user.departmentAdmin.departmentId;

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res, departmentId);
      case "PUT":
        return handleReview(req, res, departmentId);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Course registrations API error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Get course registrations for review
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    const {
      academicYear = "2024/2025",
      semester = "FIRST",
      status,
    } = req.query;

    const whereClause: any = {
      student: {
        departmentId,
      },
      academicYear: academicYear as string,
      semester: semester as any,
    };

    if (status) {
      whereClause.status = status;
    }

    const registrations = await prisma.courseRegistration.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            level: true,
          },
        },
        selectedCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                creditUnit: true,
                level: true,
                semester: true,
                type: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Calculate statistics
    const totalRegistrations = registrations.length;
    const pendingRegistrations = registrations.filter(
      (r) => r.status === "PENDING"
    ).length;
    const approvedRegistrations = registrations.filter(
      (r) => r.status === "DEPARTMENT_APPROVED"
    ).length;
    const rejectedRegistrations = registrations.filter(
      (r) => r.status === "DEPARTMENT_REJECTED"
    ).length;

    // Calculate total credits for each registration
    const registrationsWithCredits = registrations.map((registration) => {
      const totalCredits = registration.selectedCourses.reduce(
        (sum, selection) => sum + selection.course.creditUnit,
        0
      );

      return {
        ...registration,
        totalCredits,
        courseCount: registration.selectedCourses.length,
      };
    });

    res.status(200).json({
      registrations: registrationsWithCredits,
      statistics: {
        total: totalRegistrations,
        pending: pendingRegistrations,
        approved: approvedRegistrations,
        rejected: rejectedRegistrations,
      },
    });
  } catch (error) {
    console.error("Get course registrations error:", error);
    return res.status(500).json({
      message: "Failed to fetch course registrations",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Review course registration (approve/reject)
async function handleReview(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    const {
      registrationId,
      action, // "approve" or "reject"
      comments,
    } = req.body;

    // Get the department admin from the session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const departmentAdmin = await prisma.departmentAdmin.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!departmentAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!registrationId || !action) {
      return res.status(400).json({
        message: "Registration ID and action are required",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: "Action must be 'approve' or 'reject'",
      });
    }

    // Get the registration
    const registration = await prisma.courseRegistration.findUnique({
      where: { id: registrationId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            level: true,
          },
        },
        selectedCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found",
      });
    }

    // Check if registration belongs to this department
    const student = await prisma.student.findUnique({
      where: { id: registration.studentId },
      select: { departmentId: true },
    });

    if (!student || student.departmentId !== departmentId) {
      return res.status(403).json({
        message: "Access denied to this registration",
      });
    }

    if (registration.status !== "PENDING") {
      return res.status(400).json({
        message: "Registration has already been reviewed",
      });
    }

    // Update registration status
    const newStatus =
      action === "approve" ? "DEPARTMENT_APPROVED" : "DEPARTMENT_REJECTED";

    const updatedRegistration = await prisma.courseRegistration.update({
      where: { id: registrationId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        comments: comments || null,
        reviewedById: departmentAdmin.id,
      },
    });

    // If approved, create enrollments
    if (action === "approve") {
      await prisma.$transaction(
        registration.selectedCourses.map((selection) =>
          prisma.enrollment.create({
            data: {
              studentId: registration.studentId,
              courseId: selection.courseId,
              academicYear: registration.academicYear,
              semester: registration.semester,
              courseRegistrationId: registration.id,
            },
          })
        )
      );
    }

    // Create notification for student
    await prisma.notification.create({
      data: {
        title: `Course Registration ${action === "approve" ? "Approved" : "Rejected"}`,
        message: `Your course registration for ${registration.academicYear} ${registration.semester} semester has been ${action === "approve" ? "approved" : "rejected"}${comments ? `. Comments: ${comments}` : ""}.`,
        type: "COURSE_REGISTRATION",
        priority: action === "approve" ? "normal" : "high",
        actionUrl: "/dashboard/courses",
        studentId: registration.studentId,
      },
    });

    res.status(200).json({
      message: `Course registration ${action === "approve" ? "approved" : "rejected"} successfully`,
      registration: updatedRegistration,
      action,
    });
  } catch (error) {
    console.error("Review course registration error:", error);
    return res.status(500).json({
      message: "Failed to review course registration",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

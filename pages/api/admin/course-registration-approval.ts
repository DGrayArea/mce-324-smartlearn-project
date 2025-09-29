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

  // Get user with department admin profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { departmentAdmin: true },
  });

  if (!user?.departmentAdmin) {
    return res.status(403).json({
      message: "Only department admins can manage course registrations",
    });
  }

  const departmentId = user.departmentAdmin.departmentId;
  const adminId = user.departmentAdmin.id;

  switch (req.method) {
    case "GET":
      return handleGet(req, res, departmentId);
    case "POST":
      return handlePost(req, res, departmentId, adminId);
    case "PUT":
      return handlePut(req, res, departmentId, adminId);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all pending course registrations for the department
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    const { academicYear, semester, status } = req.query;

    // Build where clause
    const whereClause: any = {
      student: {
        departmentId,
      },
    };

    if (academicYear) {
      whereClause.academicYear = academicYear;
    }

    if (semester) {
      whereClause.semester = semester;
    }

    if (status) {
      whereClause.status = status;
    }

    // Get course registrations with student and course details
    const registrations = await prisma.courseRegistration.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        selectedCourses: {
          include: {
            course: {
              include: {
                department: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        reviewedBy: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { submittedAt: "asc" },
      ],
    });

    // Transform the data for easier frontend consumption
    const transformedRegistrations = registrations.map((registration) => {
      // Calculate total credits
      const totalCredits = registration.selectedCourses.reduce(
        (sum, selection) => sum + selection.course.creditUnit,
        0
      );

      // Group courses by semester
      const firstSemesterCourses = registration.selectedCourses.filter(
        (selection) => selection.course.semester === "FIRST"
      );
      const secondSemesterCourses = registration.selectedCourses.filter(
        (selection) => selection.course.semester === "SECOND"
      );

      const firstSemesterCredits = firstSemesterCourses.reduce(
        (sum, selection) => sum + selection.course.creditUnit,
        0
      );
      const secondSemesterCredits = secondSemesterCourses.reduce(
        (sum, selection) => sum + selection.course.creditUnit,
        0
      );

      return {
        id: registration.id,
        studentId: registration.studentId,
        studentName: registration.student.user.name,
        studentEmail: registration.student.user.email,
        studentLevel: registration.student.level,
        department: registration.student.department,
        academicYear: registration.academicYear,
        semester: registration.semester,
        status: registration.status,
        submittedAt: registration.submittedAt,
        reviewedAt: registration.reviewedAt,
        comments: registration.comments,
        reviewedBy: registration.reviewedBy?.user,
        totalCredits,
        firstSemesterCredits,
        secondSemesterCredits,
        courses: registration.selectedCourses.map((selection) => ({
          id: selection.course.id,
          code: selection.course.code,
          title: selection.course.title,
          creditUnit: selection.course.creditUnit,
          semester: selection.course.semester,
          department: selection.course.department,
        })),
        firstSemesterCourses: firstSemesterCourses.map((selection) => ({
          id: selection.course.id,
          code: selection.course.code,
          title: selection.course.title,
          creditUnit: selection.course.creditUnit,
          department: selection.course.department,
        })),
        secondSemesterCourses: secondSemesterCourses.map((selection) => ({
          id: selection.course.id,
          code: selection.course.code,
          title: selection.course.title,
          creditUnit: selection.course.creditUnit,
          department: selection.course.department,
        })),
      };
    });

    return res.status(200).json({
      registrations: transformedRegistrations,
      summary: {
        total: registrations.length,
        pending: registrations.filter((r) => r.status === "PENDING").length,
        approved: registrations.filter((r) => r.status === "DEPARTMENT_APPROVED").length,
        rejected: registrations.filter((r) => r.status === "DEPARTMENT_REJECTED").length,
      },
    });
  } catch (error) {
    console.error("Error fetching course registrations:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Approve or reject individual course registration
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { registrationId, action, comments } = req.body;

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
    const registration = await prisma.courseRegistration.findFirst({
      where: {
        id: registrationId,
        student: {
          departmentId,
        },
      },
      include: {
        selectedCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({
        message: "Course registration not found",
      });
    }

    if (registration.status !== "PENDING") {
      return res.status(400).json({
        message: "Registration has already been reviewed",
      });
    }

    const newStatus = action === "approve" ? "DEPARTMENT_APPROVED" : "DEPARTMENT_REJECTED";

    // Update the registration
    const updatedRegistration = await prisma.courseRegistration.update({
      where: { id: registrationId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedById: adminId,
        comments: comments || null,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        selectedCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    // If approved, create enrollments
    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        // Create enrollments for each selected course
        await Promise.all(
          registration.selectedCourses.map((selection) =>
            tx.enrollment.create({
              data: {
                studentId: registration.studentId,
                courseId: selection.courseId,
                academicYear: registration.academicYear,
                semester: registration.semester,
                courseRegistrationId: registration.id,
                isActive: true,
              },
            })
          )
        );
      });
    }

    return res.status(200).json({
      message: `Course registration ${action}d successfully`,
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error("Error updating course registration:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Batch approve or reject multiple course registrations
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { registrationIds, action, comments } = req.body;

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({
        message: "Registration IDs array is required",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: "Action must be 'approve' or 'reject'",
      });
    }

    // Get the registrations
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        id: { in: registrationIds },
        student: {
          departmentId,
        },
        status: "PENDING",
      },
      include: {
        selectedCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    if (registrations.length === 0) {
      return res.status(404).json({
        message: "No pending registrations found",
      });
    }

    const newStatus = action === "approve" ? "DEPARTMENT_APPROVED" : "DEPARTMENT_REJECTED";

    // Update all registrations in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const updatedRegistrations = [];

      for (const registration of registrations) {
        // Update the registration
        const updatedRegistration = await tx.courseRegistration.update({
          where: { id: registration.id },
          data: {
            status: newStatus,
            reviewedAt: new Date(),
            reviewedById: adminId,
            comments: comments || null,
          },
        });

        // If approved, create enrollments
        if (action === "approve") {
          await Promise.all(
            registration.selectedCourses.map((selection) =>
              tx.enrollment.create({
                data: {
                  studentId: registration.studentId,
                  courseId: selection.courseId,
                  academicYear: registration.academicYear,
                  semester: registration.semester,
                  courseRegistrationId: registration.id,
                  isActive: true,
                },
              })
            )
          );
        }

        updatedRegistrations.push(updatedRegistration);
      }

      return updatedRegistrations;
    });

    return res.status(200).json({
      message: `${registrations.length} course registrations ${action}d successfully`,
      updatedCount: results.length,
      action,
    });
  } catch (error) {
    console.error("Error batch updating course registrations:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

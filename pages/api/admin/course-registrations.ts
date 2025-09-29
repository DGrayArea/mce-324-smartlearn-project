import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = (await getServerSession(req, res, authOptions as any)) as any;
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = session.user.id as string;

    // Check if user is a department admin
    const departmentAdmin = await prisma.departmentAdmin.findFirst({
      where: { userId },
      include: { department: true },
    });

    if (!departmentAdmin) {
      return res
        .status(403)
        .json({ message: "Only department admins can access this" });
    }

    if (req.method === "GET") {
      // Get pending course registrations for the department
      const pendingRegistrations = await prisma.courseRegistration.findMany({
        where: {
          status: "PENDING",
          student: {
            departmentId: departmentAdmin.departmentId,
          },
        },
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
                  code: true,
                  title: true,
                  creditUnit: true,
                },
              },
            },
          },
        },
        orderBy: [{ submittedAt: "asc" }, { student: { matricNumber: "asc" } }],
      });

      return res.status(200).json({
        registrations: pendingRegistrations,
        department: departmentAdmin.department.name,
      });
    }

    if (req.method === "PUT") {
      // Approve or reject a course registration
      const { registrationId, action, comments } = req.body as {
        registrationId: string;
        action: "APPROVE" | "REJECT";
        comments?: string;
      };

      if (
        !registrationId ||
        !action ||
        !["APPROVE", "REJECT"].includes(action)
      ) {
        return res.status(400).json({
          message:
            "Invalid request. Required: registrationId, action (APPROVE/REJECT)",
        });
      }

      // Verify the registration belongs to this department
      const registration = await prisma.courseRegistration.findFirst({
        where: {
          id: registrationId,
          student: {
            departmentId: departmentAdmin.departmentId,
          },
        },
        include: {
          selectedCourses: {
            include: { course: true },
          },
        },
      });

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      if (registration.status !== "PENDING") {
        return res.status(400).json({ message: "Registration is not pending" });
      }

      // Update registration status
      const updatedRegistration = await prisma.courseRegistration.update({
        where: { id: registrationId },
        data: {
          status: action,
          reviewedAt: new Date(),
          reviewedById: departmentAdmin.id,
          comments: comments || null,
        },
      });

      // If approved, create enrollments
      if (action === "APPROVE") {
        const enrollments = registration.selectedCourses.map((selection) => ({
          studentId: registration.studentId,
          courseId: selection.courseId,
          academicYear: registration.academicYear,
          semester: registration.semester,
          courseRegistrationId: registrationId,
          isActive: true,
        }));

        await prisma.enrollment.createMany({
          data: enrollments,
          skipDuplicates: true,
        });

        console.log(
          `[admin] Approved registration ${registrationId}, created ${enrollments.length} enrollments`
        );
      } else {
        console.log(
          `[admin] Rejected registration ${registrationId}: ${comments || "No reason provided"}`
        );
      }

      return res.status(200).json({
        message: `Registration ${action.toLowerCase()}d successfully`,
        registration: updatedRegistration,
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error: any) {
    console.error("Course registration admin error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error?.message,
    });
  }
}

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
      const academicYear = (req.query.academicYear as string) || "2024/2025";
      const semester = req.query.semester as string;

      // Get all courses for this department
      const courses = await prisma.course.findMany({
        where: {
          departmentId: departmentAdmin.departmentId,
          isActive: true,
        },
        include: {
          courseAssignments: {
            where: {
              academicYear,
              isActive: true,
              ...(semester && { semester: semester as any }),
            },
            include: {
              lecturer: {
                include: {
                  user: {
                    select: { name: true, email: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ level: "asc" }, { semester: "asc" }, { code: "asc" }],
      });

      // Get all lecturers in this department
      const lecturers = await prisma.lecturer.findMany({
        where: {
          departmentId: departmentAdmin.departmentId,
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return res.status(200).json({
        courses,
        lecturers,
        academicYear,
        department: departmentAdmin.department.name,
      });
    }

    if (req.method === "POST") {
      const { courseId, lecturerId, academicYear, semester } = req.body as {
        courseId: string;
        lecturerId: string;
        academicYear: string;
        semester: "FIRST" | "SECOND";
      };

      if (!courseId || !lecturerId || !academicYear || !semester) {
        return res.status(400).json({
          message:
            "Missing required fields: courseId, lecturerId, academicYear, semester",
        });
      }

      // Verify course belongs to this department
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          departmentId: departmentAdmin.departmentId,
        },
      });

      if (!course) {
        return res
          .status(404)
          .json({ message: "Course not found in your department" });
      }

      // Verify lecturer belongs to this department
      const lecturer = await prisma.lecturer.findFirst({
        where: {
          id: lecturerId,
          departmentId: departmentAdmin.departmentId,
        },
      });

      if (!lecturer) {
        return res
          .status(404)
          .json({ message: "Lecturer not found in your department" });
      }

      // Check if there's an inactive assignment for the same course/lecturer/year/semester first
      const existingInactiveAssignment =
        await prisma.courseAssignment.findFirst({
          where: {
            courseId,
            lecturerId,
            academicYear,
            semester,
            isActive: false,
          },
        });

      // If there's an inactive assignment for the same lecturer, reactivate it
      if (existingInactiveAssignment) {
        const assignment = await prisma.courseAssignment.update({
          where: { id: existingInactiveAssignment.id },
          data: {
            isActive: true,
            departmentAdminId: departmentAdmin.id,
            updatedAt: new Date(),
          },
          include: {
            lecturer: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            course: true,
          },
        });

        return res.status(200).json({
          message: "Course assignment reactivated successfully",
          assignment,
        });
      }

      // Check if course already has an active lecturer assigned for this academic year/semester
      const existingActiveAssignment = await prisma.courseAssignment.findFirst({
        where: {
          courseId,
          academicYear,
          semester,
          isActive: true,
        },
      });

      if (existingActiveAssignment) {
        return res.status(400).json({
          message:
            "Course already has a lecturer assigned for this academic year/semester. Remove the existing assignment first.",
        });
      }

      // Create new assignment (no inactive assignment found)
      const assignment = await prisma.courseAssignment.create({
        data: {
          courseId,
          lecturerId,
          departmentAdminId: departmentAdmin.id,
          academicYear,
          semester,
          isActive: true,
        },
        include: {
          lecturer: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          course: true,
        },
      });

      return res.status(200).json({
        message: "Course assignment created successfully",
        assignment,
      });
    }

    if (req.method === "DELETE") {
      const { assignmentId } = req.body as { assignmentId: string };

      if (!assignmentId) {
        return res.status(400).json({ message: "Missing assignmentId" });
      }

      // Verify assignment belongs to this department admin
      const assignment = await prisma.courseAssignment.findFirst({
        where: {
          id: assignmentId,
          departmentAdminId: departmentAdmin.id,
        },
      });

      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Soft delete by setting isActive to false
      await prisma.courseAssignment.update({
        where: { id: assignmentId },
        data: { isActive: false },
      });

      return res.status(200).json({
        message: "Course assignment removed successfully",
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error: any) {
    console.error("Course assignment admin error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error?.message,
    });
  }
}

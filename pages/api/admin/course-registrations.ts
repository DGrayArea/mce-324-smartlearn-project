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
      const year = (req.query.academicYear as string) || "2024/2025";
      const regs = await prisma.courseRegistration.findMany({
        where: {
          academicYear: year,
          status: "PENDING",
          student: { departmentId: departmentAdmin.departmentId },
        },
        include: {
          student: {
            select: { id: true, name: true, matricNumber: true, level: true },
          },
          selectedCourses: { include: { course: true } },
        },
      });

      const levelOrder: Record<string, number> = {
        LEVEL_100: 0,
        LEVEL_200: 1,
        LEVEL_300: 2,
        LEVEL_400: 3,
        LEVEL_500: 4,
      };
      const byStudent: Record<string, any> = {};
      for (const r of regs) {
        const key = r.student.id;
        if (!byStudent[key]) {
          byStudent[key] = {
            student: r.student,
            academicYear: r.academicYear,
            first: null as any,
            second: null as any,
          };
        }
        const pack = {
          id: r.id,
          semester: r.semester,
          status: r.status,
          submittedAt: r.submittedAt,
          courses: r.selectedCourses.map((s) => s.course),
        };
        if (r.semester === "FIRST") byStudent[key].first = pack;
        else byStudent[key].second = pack;
      }
      const grouped = Object.values(byStudent).sort((a: any, b: any) => {
        const la = levelOrder[a.student.level] ?? 9;
        const lb = levelOrder[b.student.level] ?? 9;
        if (la !== lb) return la - lb;
        return (a.student.matricNumber || "").localeCompare(
          b.student.matricNumber || ""
        );
      });

      return res.status(200).json({
        grouped,
        department: departmentAdmin.department.name,
        academicYear: year,
      });
    }

    if (req.method === "PUT") {
      const { studentId, academicYear, action, comments } = req.body as {
        studentId: string;
        academicYear?: string;
        action: "APPROVE" | "REJECT";
        comments?: string;
      };

      const year = academicYear || "2024/2025";
      if (!studentId || !action || !["APPROVE", "REJECT"].includes(action)) {
        return res.status(400).json({
          message:
            "Invalid request. Required: studentId, action (APPROVE/REJECT)",
        });
      }

      // Convert frontend action to database enum
      const dbStatus =
        action === "APPROVE" ? "DEPARTMENT_APPROVED" : "DEPARTMENT_REJECTED";

      const regs = await prisma.courseRegistration.findMany({
        where: {
          studentId,
          academicYear: year,
          status: "PENDING",
          student: { departmentId: departmentAdmin.departmentId },
        },
        include: { selectedCourses: true },
      });
      if (!regs.length) {
        return res
          .status(404)
          .json({ message: "No pending registrations for this student" });
      }

      await prisma.courseRegistration.updateMany({
        where: { id: { in: regs.map((r) => r.id) } },
        data: {
          status: dbStatus,
          reviewedAt: new Date(),
          reviewedById: departmentAdmin.id,
          comments: comments || null,
        },
      });

      if (action === "APPROVE") {
        const enrollments = regs.flatMap((r) =>
          r.selectedCourses.map((s) => ({
            studentId: r.studentId,
            courseId: s.courseId,
            academicYear: r.academicYear,
            semester: r.semester,
            courseRegistrationId: r.id,
            isActive: true,
          }))
        );
        if (enrollments.length)
          await prisma.enrollment.createMany({
            data: enrollments,
            skipDuplicates: true,
          });
      }

      return res.status(200).json({
        message: `Student registrations ${action.toLowerCase()}d`,
        count: regs.length,
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

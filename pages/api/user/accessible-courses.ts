import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const userId = session.user.id;
      const userRole = session.user.role;

      let courses: any[] = [];

      if (userRole === "STUDENT") {
        // Get courses the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
          where: {
            student: { userId },
            isActive: true,
          },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                level: true,
                semester: true,
                creditUnit: true,
              },
            },
          },
        });
        courses = enrollments.map((e) => e.course);
      } else if (userRole === "LECTURER") {
        // Get courses the lecturer is assigned to
        const assignments = await prisma.courseAssignment.findMany({
          where: {
            lecturer: { userId },
            isActive: true,
          },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                level: true,
                semester: true,
                creditUnit: true,
              },
            },
          },
        });
        courses = assignments.map((a) => a.course);
      } else if (userRole === "DEPARTMENT_ADMIN") {
        // Get all courses in the department admin's department
        const departmentAdmin = await prisma.departmentAdmin.findUnique({
          where: { userId },
          include: { department: true },
        });

        if (departmentAdmin) {
          courses = await prisma.course.findMany({
            where: {
              departmentId: departmentAdmin.departmentId,
              isActive: true,
            },
            select: {
              id: true,
              code: true,
              title: true,
              level: true,
              semester: true,
            },
          });
        }
      }

      return res.status(200).json({ courses });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error: any) {
    console.error("Error fetching accessible courses:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

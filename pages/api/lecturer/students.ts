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

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({ message: "Course ID is required" });
    }

    // Verify lecturer has access to the course
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        courseAssignments: {
          where: {
            courseId,
            isActive: true,
          },
        },
      },
    });

    if (!lecturer || lecturer.courseAssignments.length === 0) {
      return res.status(403).json({ message: "Access denied to this course" });
    }

    // Get enrolled students for this course
    const students = await prisma.enrollment.findMany({
      where: {
        courseId,
        isActive: true,
        academicYear: "2024/2025",
        semester: "FIRST",
      },
      select: {
        id: true,
        enrolledAt: true,
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            level: true,
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    // Transform the data
    const enrolledStudents = students.map((enrollment) => ({
      id: enrollment.student.id,
      name: enrollment.student.name,
      matricNumber: enrollment.student.matricNumber,
      level: enrollment.student.level,
      enrolledAt: enrollment.enrolledAt,
    }));

    res.status(200).json({ students: enrolledStudents });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

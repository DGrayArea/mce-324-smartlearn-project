import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { StudentLevel } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (
    !user ||
    !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
      user.role || ""
    )
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    if (req.method === "GET") {
      // Get students ready for level progression
      const { departmentId, currentLevel } = req.query;

      const whereClause: any = {};
      if (departmentId) whereClause.departmentId = departmentId;
      if (currentLevel) whereClause.level = currentLevel;

      const students = await prisma.student.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          matricNumber: true,
          level: true,
          department: {
            select: {
              name: true,
              code: true,
            },
          },
          results: {
            where: {
              academicYear: "2024/2025",
              status: "SENATE_APPROVED",
            },
            select: {
              grade: true,
              totalScore: true,
            },
          },
        },
        orderBy: {
          matricNumber: "asc",
        },
      });

      // Calculate progression eligibility
      const studentsWithEligibility = students.map((student) => {
        const results = student.results;
        const totalCourses = results.length;
        const passedCourses = results.filter((r) => r.grade !== "F").length;
        const averageScore =
          results.length > 0
            ? results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
            : 0;

        const isEligibleForProgression =
          totalCourses > 0 && passedCourses >= totalCourses * 0.6; // 60% pass rate

        let nextLevel: StudentLevel | "GRADUATED" = student.level;
        if (isEligibleForProgression) {
          switch (student.level) {
            case "LEVEL_100":
              nextLevel = "LEVEL_200";
              break;
            case "LEVEL_200":
              nextLevel = "LEVEL_300";
              break;
            case "LEVEL_300":
              nextLevel = "LEVEL_400";
              break;
            case "LEVEL_400":
              nextLevel = "LEVEL_500";
              break;
            case "LEVEL_500":
              nextLevel = "GRADUATED";
              break;
          }
        }

        return {
          ...student,
          totalCourses,
          passedCourses,
          averageScore: Math.round(averageScore),
          isEligibleForProgression,
          nextLevel,
        };
      });

      res.status(200).json({ students: studentsWithEligibility });
    } else if (req.method === "POST") {
      // Process level progression for students
      const { studentIds, newLevel, academicYear } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || !newLevel) {
        return res.status(400).json({
          message: "Student IDs and new level are required",
        });
      }

      // Update student levels
      const updatedStudents = await prisma.student.updateMany({
        where: {
          id: { in: studentIds },
        },
        data: {
          level: newLevel,
        },
      });

      // Create progression records (you might want to add a Progressions table)
      res.status(200).json({
        message: "Student progression processed successfully",
        updatedCount: updatedStudents.count,
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in student progression API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

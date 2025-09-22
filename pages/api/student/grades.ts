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

  // Only allow students
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      student: true,
    },
  });

  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.student) {
    return res
      .status(403)
      .json({ message: "Forbidden: Student access required" });
  }

  const studentId = currentUser.student.id;

  if (req.method === "GET") {
    try {
      const { academicYear = "2024/2025", semester } = req.query;

      const whereClause: any = {
        studentId,
        status: "SENATE_APPROVED", // Only show approved grades
      };

      if (academicYear) {
        whereClause.academicYear = academicYear;
      }

      if (semester && semester !== "ALL") {
        whereClause.semester = semester;
      }

      const results = await prisma.result.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              creditUnit: true,
            },
          },
        },
        orderBy: [
          { academicYear: "desc" },
          { semester: "desc" },
          { course: { code: "asc" } },
        ],
      });

      // Calculate GPA and CGPA
      let totalGradePoints = 0;
      let totalCredits = 0;
      let currentSemesterGradePoints = 0;
      let currentSemesterCredits = 0;

      const gradePointMap: Record<string, number> = {
        A: 5.0,
        B: 4.0,
        C: 3.0,
        D: 2.0,
        F: 0.0,
      };

      results.forEach((result) => {
        const gradePoint = gradePointMap[result.grade] || 0;
        const credits = result.course.creditUnit;

        totalGradePoints += gradePoint * credits;
        totalCredits += credits;

        // Calculate current semester GPA if filtering by semester
        if (
          semester &&
          semester !== "ALL" &&
          result.academicYear === academicYear &&
          result.semester === semester
        ) {
          currentSemesterGradePoints += gradePoint * credits;
          currentSemesterCredits += credits;
        }
      });

      const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
      const gpa =
        semester && semester !== "ALL" && currentSemesterCredits > 0
          ? currentSemesterGradePoints / currentSemesterCredits
          : cgpa;

      // Calculate statistics
      const passed = results.filter((r) => r.grade !== "F").length;
      const failed = results.filter((r) => r.grade === "F").length;
      const passRate =
        results.length > 0 ? Math.round((passed / results.length) * 100) : 0;

      const statistics = {
        total: results.length,
        passed,
        failed,
        totalCredits,
        passRate,
      };

      return res.status(200).json({
        grades: results,
        cgpa: parseFloat(cgpa.toFixed(2)),
        gpa: parseFloat(gpa.toFixed(2)),
        statistics,
      });
    } catch (error) {
      console.error("Error fetching student grades:", error);
      return res.status(500).json({
        message: "Failed to fetch grades",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

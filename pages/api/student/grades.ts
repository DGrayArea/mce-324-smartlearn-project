import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { calculateGPA, calculateCGPA, getGradeStatistics } from "@/lib/grading";
import {
  calculateComprehensiveGPA,
  getGPATrend,
  getAcademicStanding,
} from "@/lib/gpa-calculator";

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
        select: {
          id: true,
          caScore: true,
          examScore: true,
          totalScore: true,
          grade: true,
          status: true,
          academicYear: true,
          semester: true,
          createdAt: true,
          updatedAt: true,
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              creditUnit: true,
              level: true,
            },
          },
        },
        orderBy: [
          { academicYear: "desc" },
          { semester: "desc" },
          { course: { code: "asc" } },
        ],
      });

      // Transform results for comprehensive GPA calculation
      const courseResults = results.map((r) => ({
        id: r.id,
        grade: r.grade,
        creditUnit: r.course.creditUnit,
        academicYear: r.academicYear,
        semester: r.semester,
        level: r.course.level,
        courseCode: r.course.code,
        status: r.status,
      }));

      // Calculate comprehensive GPA with session and level breakdown
      const comprehensiveGPA = calculateComprehensiveGPA(courseResults);

      // Calculate current semester GPA if filtering by semester
      let currentSemesterGPA = comprehensiveGPA.cgpa;
      if (semester && semester !== "ALL") {
        const currentSemesterResults = results.filter(
          (r) => r.academicYear === academicYear && r.semester === semester
        );
        currentSemesterGPA = calculateGPA(
          currentSemesterResults.map((r) => ({
            grade: r.grade,
            creditUnit: r.course.creditUnit,
          }))
        );
      }

      // Get GPA trend and academic standing
      const gpaTrend = getGPATrend(comprehensiveGPA.sessionGPAs);
      const academicStanding = getAcademicStanding(comprehensiveGPA.cgpa);

      return res.status(200).json({
        grades: results,
        cgpa: comprehensiveGPA.cgpa,
        gpa: parseFloat(currentSemesterGPA.toFixed(2)),
        totalCredits: comprehensiveGPA.totalCredits,
        totalGradePoints: comprehensiveGPA.totalGradePoints,
        sessionGPAs: comprehensiveGPA.sessionGPAs,
        levelGPAs: comprehensiveGPA.levelGPAs,
        progression: comprehensiveGPA.progression,
        statistics: comprehensiveGPA.statistics,
        gpaTrend,
        academicStanding,
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

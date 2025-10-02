import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;

  if (!session || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user is a student
  const student = await prisma.student.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    return res
      .status(403)
      .json({ message: "Access denied. Student profile required." });
  }

  try {
    const { academicYear, semester, status } = req.query;

    // Build where clause
    let whereClause: any = {
      studentId: student.id,
    };

    if (academicYear && academicYear !== "all") {
      whereClause.academicYear = academicYear;
    }
    if (semester && semester !== "all") {
      whereClause.semester = semester;
    }
    if (status && status !== "all") {
      whereClause.status = status;
    }

    // Get grade history
    const gradeHistory = await prisma.result.findMany({
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
        { createdAt: "desc" },
      ],
    });

    // Group by semester and calculate GPA/CGPA
    const semesterMap = new Map<string, any[]>();

    gradeHistory.forEach((grade) => {
      const key = `${grade.academicYear}-${grade.semester}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, []);
      }
      semesterMap.get(key)!.push(grade);
    });

    const semesterSummaries = Array.from(semesterMap.entries()).map(
      ([key, courses]) => {
        const [academicYear, semester] = key.split("-");

        // Calculate semester GPA
        const totalCredits = courses.reduce(
          (sum, course) => sum + course.course.creditUnit,
          0
        );
        const earnedCredits = courses.reduce((sum, course) => {
          const gradePoints =
            course.grade === "A"
              ? 5
              : course.grade === "B"
                ? 4
                : course.grade === "C"
                  ? 3
                  : course.grade === "D"
                    ? 2
                    : 0;
          return sum + gradePoints * course.course.creditUnit;
        }, 0);
        const gpa = totalCredits > 0 ? earnedCredits / totalCredits : 0;

        return {
          academicYear,
          semester,
          courses,
          totalCredits,
          earnedCredits,
          gpa,
        };
      }
    );

    // Filter out ALL 2024/2025 results until they're approved by Senate
    const currentAcademicYear = "2024/2025"; // You can make this dynamic

    const visibleGradeHistory = gradeHistory.filter((grade) => {
      // Hide all 2024/2025 results until they're SENATE_APPROVED
      if (
        grade.academicYear === currentAcademicYear &&
        grade.status !== "SENATE_APPROVED"
      ) {
        return false;
      }
      return true;
    });

    // For CGPA calculation, only include SENATE_APPROVED courses
    const allApprovedCourses = visibleGradeHistory.filter(
      (grade) => grade.status === "SENATE_APPROVED"
    );

    const totalCredits = allApprovedCourses.reduce(
      (sum, course) => sum + course.course.creditUnit,
      0
    );
    const earnedCredits = allApprovedCourses.reduce((sum, course) => {
      const gradePoints =
        course.grade === "A"
          ? 5
          : course.grade === "B"
            ? 4
            : course.grade === "C"
              ? 3
              : course.grade === "D"
                ? 2
                : 0;
      return sum + gradePoints * course.course.creditUnit;
    }, 0);
    const cgpa = totalCredits > 0 ? earnedCredits / totalCredits : 0;

    // Check if entire visible result set is approved by Senate
    const isEntireResultApproved =
      visibleGradeHistory.length > 0 &&
      visibleGradeHistory.every((grade) => grade.status === "SENATE_APPROVED");

    // Add CGPA to each semester summary
    const semesterSummariesWithCGPA = semesterSummaries.map(
      (summary, index) => {
        // Calculate CGPA up to this semester
        const coursesUpToThisSemester = gradeHistory.filter((grade) => {
          const gradeKey = `${grade.academicYear}-${grade.semester}`;
          const summaryKey = `${summary.academicYear}-${summary.semester}`;
          return gradeKey <= summaryKey && grade.status === "SENATE_APPROVED";
        });

        const totalCreditsUpToThis = coursesUpToThisSemester.reduce(
          (sum, course) => sum + course.course.creditUnit,
          0
        );
        const earnedCreditsUpToThis = coursesUpToThisSemester.reduce(
          (sum, course) => {
            const gradePoints =
              course.grade === "A"
                ? 5
                : course.grade === "B"
                  ? 4
                  : course.grade === "C"
                    ? 3
                    : course.grade === "D"
                      ? 2
                      : 0;
            return sum + gradePoints * course.course.creditUnit;
          },
          0
        );
        const cgpaUpToThis =
          totalCreditsUpToThis > 0
            ? earnedCreditsUpToThis / totalCreditsUpToThis
            : 0;

        return {
          ...summary,
          cgpa: cgpaUpToThis,
        };
      }
    );

    res.status(200).json({
      success: true,
      gradeHistory: visibleGradeHistory, // Return filtered grade history
      semesterSummaries: semesterSummariesWithCGPA,
      overallStats: {
        totalCredits,
        earnedCredits,
        cgpa,
        totalCourses: allApprovedCourses.length,
        isEntireResultApproved,
      },
    });
  } catch (error) {
    console.error("Error fetching grade history:", error);
    res.status(500).json({
      message: "Error fetching grade history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

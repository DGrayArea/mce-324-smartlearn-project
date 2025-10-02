import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;

  if (!session || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Get user role and related data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      departmentAdmin: {
        include: {
          department: true,
        },
      },
      schoolAdmin: {
        include: {
          school: {
            include: {
              departments: true,
            },
          },
        },
      },
    },
  });

  if (
    !user ||
    !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role)
  ) {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }

  if (req.method === "GET") {
    try {
      const { academicYear, semester, level } = req.query;

      // Build where clause based on user role
      let whereClause: any = {
        result: {
          course: {
            department: {},
          },
        },
        level: user.role,
        status: "PENDING",
      };

      // Role-specific filtering
      if (user.role === "DEPARTMENT_ADMIN") {
        whereClause.result.course.departmentId =
          user.departmentAdmin?.departmentId;
      } else if (user.role === "SCHOOL_ADMIN") {
        whereClause.result.course.department.schoolId =
          user.schoolAdmin?.schoolId;
      }
      // SENATE_ADMIN sees all departments

      if (academicYear && academicYear !== "all") {
        whereClause.result.academicYear = academicYear;
      }
      if (semester && semester !== "all") {
        whereClause.result.semester = semester;
      }

      // Get result approvals
      const approvals = await prisma.resultApproval.findMany({
        where: whereClause,
        include: {
          result: {
            include: {
              student: {
                include: {
                  user: true,
                  department: true,
                },
              },
              course: {
                include: {
                  department: {
                    include: {
                      school: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { result: { student: { level: "asc" } } },
          { result: { student: { user: { firstName: "asc" } } } },
        ],
      });

      // Group by level and organize data
      const resultsByLevel: any = {};

      approvals.forEach((approval) => {
        const student = approval.result.student;
        const course = approval.result.course;
        const studentLevel = student.level;

        if (!resultsByLevel[studentLevel]) {
          resultsByLevel[studentLevel] = [];
        }

        // Check if student already exists in this level
        let existingStudent = resultsByLevel[studentLevel].find(
          (s: any) => s.student.id === student.id
        );

        if (!existingStudent) {
          existingStudent = {
            student: {
              id: student.id,
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              name: `${student.user.firstName} ${student.user.lastName}`,
              matricNumber: student.matricNumber,
              level: student.level,
              department: student.department.name,
            },
            courses: [],
            totalCredits: 0,
            earnedCredits: 0,
            gpa: 0,
          };
          resultsByLevel[studentLevel].push(existingStudent);
        }

        const gradePoints =
          approval.result.grade === "A"
            ? 5
            : approval.result.grade === "B"
              ? 4
              : approval.result.grade === "C"
                ? 3
                : approval.result.grade === "D"
                  ? 2
                  : 0;

        existingStudent.courses.push({
          id: approval.result.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          creditUnit: course.creditUnit,
          caScore: approval.result.caScore,
          examScore: approval.result.examScore,
          totalScore: approval.result.totalScore,
          grade: approval.result.grade,
          status: approval.result.status,
          academicYear: approval.result.academicYear,
          semester: approval.result.semester,
        });

        existingStudent.totalCredits += course.creditUnit;
        existingStudent.earnedCredits += gradePoints * course.creditUnit;
      });

      // Calculate GPA for each student
      Object.values(resultsByLevel).forEach((levelStudents: any) => {
        levelStudents.forEach((student: any) => {
          student.gpa =
            student.totalCredits > 0
              ? student.earnedCredits / student.totalCredits
              : 0;
        });
      });

      res.status(200).json({
        success: true,
        resultsByLevel,
        totalStudents: Object.values(resultsByLevel).reduce(
          (total: number, students: any) => total + students.length,
          0
        ),
        totalApprovals: approvals.length,
        userRole: user.role,
      });
    } catch (error) {
      console.error("Error fetching result approvals:", error);
      res.status(500).json({
        message: "Error fetching result approvals",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }

      // Validate and update each result
      const updatePromises = updates.map(async (update: any) => {
        const { resultId, caScore, examScore } = update;

        // Validate scores
        if (caScore < 0 || caScore > 40) {
          throw new Error(
            `CA score must be between 0 and 40 for result ${resultId}`
          );
        }
        if (examScore < 0 || examScore > 60) {
          throw new Error(
            `Exam score must be between 0 and 60 for result ${resultId}`
          );
        }

        const totalScore = caScore + examScore;
        let grade = "F";
        if (totalScore >= 70) grade = "A";
        else if (totalScore >= 60) grade = "B";
        else if (totalScore >= 50) grade = "C";
        else if (totalScore >= 45) grade = "D";

        return prisma.result.update({
          where: { id: resultId },
          data: {
            caScore,
            examScore,
            totalScore,
            grade,
            updatedAt: new Date(),
          },
        });
      });

      await Promise.all(updatePromises);

      res.status(200).json({
        success: true,
        message: `${updates.length} results updated successfully`,
        updatedCount: updates.length,
      });
    } catch (error) {
      console.error("Error updating results:", error);
      res.status(500).json({
        message: "Error updating results",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

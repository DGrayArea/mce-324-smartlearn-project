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

  // Verify lecturer has access to the course
  const verifyLecturerAccess = async (courseId: string) => {
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

    return lecturer;
  };

  try {
    if (req.method === "GET") {
      // Get quiz attempts for a quiz
      const { quizId } = req.query;

      if (!quizId || typeof quizId !== "string") {
        return res.status(400).json({ message: "Quiz ID is required" });
      }

      // Get quiz with course info
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: {
          id: true,
          courseId: true,
          lecturerId: true,
          title: true,
          course: {
            select: {
              title: true,
              code: true,
            },
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const lecturer = await verifyLecturerAccess(quiz.courseId);
      if (!lecturer || lecturer.courseAssignments.length === 0) {
        return res.status(403).json({ message: "Access denied to this course" });
      }

      // Get all attempts for this quiz
      const attempts = await prisma.quizAttempt.findMany({
        where: { quizId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              matricNumber: true,
            },
          },
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  question: true,
                  type: true,
                  points: true,
                  correctAnswer: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      });

      // Calculate statistics
      const totalAttempts = attempts.length;
      const completedAttempts = attempts.filter(a => a.isCompleted).length;
      const averageScore = attempts.length > 0 
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length 
        : 0;

      res.status(200).json({ 
        quiz,
        attempts,
        statistics: {
          totalAttempts,
          completedAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
        },
      });
    } else if (req.method === "POST") {
      // Submit grades to department admin for review
      const { quizId, grades } = req.body;

      if (!quizId || !grades || !Array.isArray(grades)) {
        return res.status(400).json({ 
          message: "Quiz ID and grades are required" 
        });
      }

      // Get quiz with course info
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: {
          id: true,
          courseId: true,
          lecturerId: true,
          title: true,
          course: {
            select: {
              title: true,
              code: true,
              departmentId: true,
            },
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const lecturer = await verifyLecturerAccess(quiz.courseId);
      if (!lecturer || lecturer.courseAssignments.length === 0) {
        return res.status(403).json({ message: "Access denied to this course" });
      }

      // Update quiz attempts with grades
      const updatedAttempts = await Promise.all(
        grades.map(async (grade: any) => {
          const { attemptId, score, feedback } = grade;
          
          return await prisma.quizAttempt.update({
            where: { id: attemptId },
            data: {
              score,
            },
          });
        })
      );

      // Create result entries for department admin review
      const currentAcademicYear = "2024/2025";
      const currentSemester = "FIRST";

      const results = await Promise.all(
        grades.map(async (grade: any) => {
          const attempt = await prisma.quizAttempt.findUnique({
            where: { id: grade.attemptId },
            select: {
              studentId: true,
              score: true,
              totalPoints: true,
            },
          });

          if (!attempt) return null;

          // Calculate grade letter
          const percentage = (attempt.score || 0) / attempt.totalPoints * 100;
          let gradeLetter = "F";
          if (percentage >= 90) gradeLetter = "A";
          else if (percentage >= 80) gradeLetter = "B";
          else if (percentage >= 70) gradeLetter = "C";
          else if (percentage >= 60) gradeLetter = "D";

          // Create or update result
          return await prisma.result.upsert({
            where: {
              studentId_courseId_academicYear_semester: {
                studentId: attempt.studentId,
                courseId: quiz.courseId,
                academicYear: currentAcademicYear,
                semester: currentSemester,
              },
            },
            update: {
              caScore: attempt.score || 0,
              totalScore: attempt.score || 0,
              grade: gradeLetter,
              status: "PENDING",
            },
            create: {
              studentId: attempt.studentId,
              courseId: quiz.courseId,
              academicYear: currentAcademicYear,
              semester: currentSemester,
              caScore: attempt.score || 0,
              examScore: 0,
              totalScore: attempt.score || 0,
              grade: gradeLetter,
              status: "PENDING",
            },
          });
        })
      );

      // Create notifications for department admin
      const departmentAdmin = await prisma.departmentAdmin.findFirst({
        where: {
          departmentId: quiz.course.departmentId,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (departmentAdmin) {
        await prisma.notification.create({
          data: {
            title: "Quiz Results Ready for Review",
            message: `Quiz "${quiz.title}" results have been submitted for review. ${results.length} students have been graded.`,
            type: "GRADE",
            priority: "normal",
            actionUrl: `/dashboard/result-approval`,
            lecturerId: lecturer.id,
          },
        });
      }

      res.status(200).json({ 
        message: "Grades submitted successfully for department admin review",
        updatedAttempts: updatedAttempts.length,
        resultsCreated: results.filter(r => r !== null).length,
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in quiz attempts API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

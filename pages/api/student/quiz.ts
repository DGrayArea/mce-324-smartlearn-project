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

  // Verify student has access to the course
  const verifyStudentAccess = async (courseId: string) => {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        enrollments: {
          where: {
            courseId,
            isActive: true,
            academicYear: "2024/2025",
            semester: "FIRST",
          },
        },
      },
    });

    return student;
  };

  try {
    if (req.method === "GET") {
      // Get available quizzes for a course
      const { courseId } = req.query;

      if (!courseId || typeof courseId !== "string") {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const student = await verifyStudentAccess(courseId);
      if (!student || student.enrollments.length === 0) {
        return res.status(403).json({ message: "Access denied to this course" });
      }

      const now = new Date();
      const quizzes = await prisma.quiz.findMany({
        where: {
          courseId,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              question: true,
              type: true,
              points: true,
              options: true,
              order: true,
              // Don't include correctAnswer for students
            },
          },
          _count: {
            select: {
              quizAttempts: {
                where: {
                  studentId: student.id,
                },
              },
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
      });

      // Filter quizzes based on attempt limits
      const availableQuizzes = quizzes.filter(quiz => {
        const attemptsUsed = quiz._count.quizAttempts;
        return attemptsUsed < quiz.attempts;
      });

      res.status(200).json({ quizzes: availableQuizzes });
    } else if (req.method === "POST") {
      // Start a quiz attempt
      const { quizId } = req.body;

      if (!quizId) {
        return res.status(400).json({ message: "Quiz ID is required" });
      }

      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      // Check if quiz exists and is available
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: {
          id: true,
          courseId: true,
          title: true,
          timeLimit: true,
          attempts: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      });

      if (!quiz || !quiz.isActive) {
        return res.status(404).json({ message: "Quiz not found or not active" });
      }

      const now = new Date();
      if (now < quiz.startDate || now > quiz.endDate) {
        return res.status(400).json({ message: "Quiz is not available at this time" });
      }

      // Check attempt limit
      const existingAttempts = await prisma.quizAttempt.count({
        where: {
          quizId,
          studentId: student.id,
        },
      });

      if (existingAttempts >= quiz.attempts) {
        return res.status(400).json({ message: "Maximum attempts reached for this quiz" });
      }

      // Create new attempt
      const attemptNumber = existingAttempts + 1;
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId,
          studentId: student.id,
          attemptNumber,
          totalPoints: 0, // Will be calculated when submitted
        },
      });

      // Get quiz questions (without correct answers)
      const questions = await prisma.quizQuestion.findMany({
        where: { quizId },
        select: {
          id: true,
          question: true,
          type: true,
          points: true,
          options: true,
          order: true,
        },
        orderBy: { order: "asc" },
      });

      res.status(201).json({ 
        message: "Quiz attempt started",
        attempt,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          timeLimit: quiz.timeLimit,
        },
        questions,
      });
    } else if (req.method === "PUT") {
      // Submit quiz answers
      const { attemptId, answers } = req.body;

      if (!attemptId || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ 
          message: "Attempt ID and answers are required" 
        });
      }

      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      // Verify attempt belongs to student
      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          studentId: true,
          quizId: true,
          isCompleted: true,
        },
      });

      if (!attempt || attempt.studentId !== student.id) {
        return res.status(403).json({ message: "Access denied to this attempt" });
      }

      if (attempt.isCompleted) {
        return res.status(400).json({ message: "Quiz attempt already completed" });
      }

      // Get quiz questions with correct answers for grading
      const questions = await prisma.quizQuestion.findMany({
        where: { quizId: attempt.quizId },
        select: {
          id: true,
          type: true,
          points: true,
          correctAnswer: true,
        },
      });

      // Calculate score
      let totalScore = 0;
      let totalPoints = 0;

      const quizAnswers = await Promise.all(
        answers.map(async (answer: any) => {
          const question = questions.find(q => q.id === answer.questionId);
          if (!question) return null;

          totalPoints += question.points;
          
          let isCorrect = false;
          let pointsEarned = 0;

          // Simple grading logic (can be enhanced)
          if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
            isCorrect = answer.answer === question.correctAnswer;
            pointsEarned = isCorrect ? question.points : 0;
          } else if (question.type === "SHORT_ANSWER") {
            // For short answers, we'll give partial credit for now
            // In a real system, this might need manual grading
            const correctAnswer = question.correctAnswer.toLowerCase().trim();
            const studentAnswer = answer.answer.toLowerCase().trim();
            isCorrect = correctAnswer === studentAnswer;
            pointsEarned = isCorrect ? question.points : question.points * 0.5; // 50% partial credit
          } else {
            // For essay and other types, give full points for now
            // In a real system, these would need manual grading
            pointsEarned = question.points;
            isCorrect = true;
          }

          totalScore += pointsEarned;

          return await prisma.quizAnswer.create({
            data: {
              attemptId,
              questionId: answer.questionId,
              answer: answer.answer,
              isCorrect,
              pointsEarned,
            },
          });
        })
      );

      // Update attempt with final score
      const updatedAttempt = await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          score: totalScore,
          totalPoints,
          isCompleted: true,
        },
      });

      res.status(200).json({ 
        message: "Quiz submitted successfully",
        attempt: updatedAttempt,
        score: totalScore,
        totalPoints,
        percentage: Math.round((totalScore / totalPoints) * 100),
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in student quiz API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

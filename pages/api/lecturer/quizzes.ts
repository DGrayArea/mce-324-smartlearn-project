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
      // Get quizzes for a course
      const { courseId } = req.query;

      if (!courseId || typeof courseId !== "string") {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const lecturer = await verifyLecturerAccess(courseId);
      if (!lecturer || lecturer.courseAssignments.length === 0) {
        return res.status(403).json({ message: "Access denied to this course" });
      }

      const quizzes = await prisma.quiz.findMany({
        where: {
          courseId,
          lecturerId: lecturer.id,
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              quizAttempts: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({ quizzes });
    } else if (req.method === "POST") {
      // Create a new quiz
      const {
        courseId,
        title,
        description,
        type,
        totalPoints,
        timeLimit,
        attempts,
        startDate,
        endDate,
        isRandomized,
        showResults,
        questions,
      } = req.body;

      if (!courseId || !title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ 
          message: "Course ID, title, and questions are required" 
        });
      }

      const lecturer = await verifyLecturerAccess(courseId);
      if (!lecturer || lecturer.courseAssignments.length === 0) {
        return res.status(403).json({ message: "Access denied to this course" });
      }

      // Create quiz with questions in a transaction
      const quiz = await prisma.$transaction(async (tx) => {
        const newQuiz = await tx.quiz.create({
          data: {
            courseId,
            lecturerId: lecturer.id,
            title,
            description: description || null,
            type: type || "PRACTICE",
            totalPoints: totalPoints || 100,
            timeLimit: timeLimit || null,
            attempts: attempts || 1,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isRandomized: isRandomized || false,
            showResults: showResults !== false,
          },
        });

        // Create questions
        const createdQuestions = await Promise.all(
          questions.map((question: any, index: number) =>
            tx.quizQuestion.create({
              data: {
                quizId: newQuiz.id,
                question: question.question,
                type: question.type,
                points: question.points || 1,
                options: question.options || null,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || null,
                order: index + 1,
              },
            })
          )
        );

        return { ...newQuiz, questions: createdQuestions };
      });

      res.status(201).json({ 
        message: "Quiz created successfully",
        quiz 
      });
    } else if (req.method === "PUT") {
      // Update a quiz
      const { quizId, ...updateData } = req.body;

      if (!quizId) {
        return res.status(400).json({ message: "Quiz ID is required" });
      }

      // Verify ownership
      const existingQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { lecturerId: true },
      });

      if (!existingQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!lecturer || existingQuiz.lecturerId !== lecturer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          ...updateData,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        },
      });

      res.status(200).json({ 
        message: "Quiz updated successfully",
        quiz: updatedQuiz 
      });
    } else if (req.method === "DELETE") {
      // Delete a quiz
      const { quizId } = req.query;

      if (!quizId || typeof quizId !== "string") {
        return res.status(400).json({ message: "Quiz ID is required" });
      }

      // Verify ownership
      const existingQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { lecturerId: true },
      });

      if (!existingQuiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const lecturer = await prisma.lecturer.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!lecturer || existingQuiz.lecturerId !== lecturer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete quiz (cascade will handle questions and attempts)
      await prisma.quiz.delete({
        where: { id: quizId },
      });

      res.status(200).json({ message: "Quiz deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in quizzes API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

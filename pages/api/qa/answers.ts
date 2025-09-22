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

  try {
    if (req.method === "GET") {
      // Get answers for a question
      const { questionId, page = "1", limit = "20" } = req.query;

      if (!questionId || typeof questionId !== "string") {
        return res.status(400).json({ message: "Question ID is required" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          student: true,
          lecturer: true,
          departmentAdmin: true,
          schoolAdmin: true,
          senateAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has access to this question
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          course: true,
        },
      });

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check access permissions (same logic as questions)
      let hasAccess = false;

      if (currentUser.role === "STUDENT" && currentUser.student) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: currentUser.student.id,
            courseId: question.courseId,
            isActive: true,
          },
        });
        hasAccess = !!enrollment;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        const assignment = await prisma.courseAssignment.findFirst({
          where: {
            lecturerId: currentUser.lecturer.id,
            courseId: question.courseId,
            isActive: true,
          },
        });
        hasAccess = !!assignment;
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        hasAccess =
          question.course.departmentId ===
          currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        hasAccess =
          question.course.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this question" });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const answers = await prisma.answer.findMany({
        where: { questionId },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: [
          { isAccepted: "desc" },
          { upvotes: "desc" },
          { createdAt: "asc" },
        ],
        skip,
        take: limitNum,
      });

      const totalAnswers = await prisma.answer.count({
        where: { questionId },
      });

      return res.status(200).json({
        answers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalAnswers,
          pages: Math.ceil(totalAnswers / limitNum),
        },
      });
    } else if (req.method === "POST") {
      // Create a new answer
      const { questionId, content } = req.body;

      if (!questionId || !content) {
        return res
          .status(400)
          .json({ message: "Question ID and content are required" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          student: true,
          lecturer: true,
          departmentAdmin: true,
          schoolAdmin: true,
          senateAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has access to this question (same logic as GET)
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          course: true,
        },
      });

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      let hasAccess = false;

      if (currentUser.role === "STUDENT" && currentUser.student) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: currentUser.student.id,
            courseId: question.courseId,
            isActive: true,
          },
        });
        hasAccess = !!enrollment;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        const assignment = await prisma.courseAssignment.findFirst({
          where: {
            lecturerId: currentUser.lecturer.id,
            courseId: question.courseId,
            isActive: true,
          },
        });
        hasAccess = !!assignment;
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        hasAccess =
          question.course.departmentId ===
          currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        hasAccess =
          question.course.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this question" });
      }

      const answer = await prisma.answer.create({
        data: {
          questionId,
          content,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // Update question's answered status
      await prisma.question.update({
        where: { id: questionId },
        data: { isAnswered: true },
      });

      return res.status(201).json({ answer });
    } else if (req.method === "PUT") {
      // Update an answer
      const { answerId, content, isAccepted } = req.body;

      if (!answerId) {
        return res.status(400).json({ message: "Answer ID is required" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          student: true,
          lecturer: true,
          departmentAdmin: true,
          schoolAdmin: true,
          senateAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const answer = await prisma.answer.findUnique({
        where: { id: answerId },
        include: {
          question: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }

      // Check permissions
      let canModify = false;
      let canAccept = false;

      // Author can always modify their own answer
      if (answer.authorId === session.user.id) {
        canModify = true;
      }

      // Only lecturers and admins can accept answers
      if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        const assignment = await prisma.courseAssignment.findFirst({
          where: {
            lecturerId: currentUser.lecturer.id,
            courseId: answer.question.courseId,
            isActive: true,
          },
        });
        if (assignment) {
          canModify = true;
          canAccept = true;
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        if (
          answer.question.course.departmentId ===
          currentUser.departmentAdmin.departmentId
        ) {
          canModify = true;
          canAccept = true;
        }
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        if (
          answer.question.course.schoolId === currentUser.schoolAdmin.schoolId
        ) {
          canModify = true;
          canAccept = true;
        }
      } else if (currentUser.role === "SENATE_ADMIN") {
        canModify = true;
        canAccept = true;
      }

      if (!canModify) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (isAccepted !== undefined && !canAccept) {
        return res
          .status(403)
          .json({ message: "Only lecturers and admins can accept answers" });
      }

      const updateData: any = {};
      if (content !== undefined) updateData.content = content;
      if (isAccepted !== undefined) updateData.isAccepted = isAccepted;

      const updatedAnswer = await prisma.answer.update({
        where: { id: answerId },
        data: updateData,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // If accepting an answer, unaccept all other answers for this question
      if (isAccepted === true) {
        await prisma.answer.updateMany({
          where: {
            questionId: answer.questionId,
            id: { not: answerId },
          },
          data: { isAccepted: false },
        });

        // Mark question as resolved
        await prisma.question.update({
          where: { id: answer.questionId },
          data: { isResolved: true },
        });
      }

      return res.status(200).json({ answer: updatedAnswer });
    } else if (req.method === "DELETE") {
      // Delete an answer
      const { answerId } = req.query;

      if (!answerId || typeof answerId !== "string") {
        return res.status(400).json({ message: "Answer ID is required" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          student: true,
          lecturer: true,
          departmentAdmin: true,
          schoolAdmin: true,
          senateAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const answer = await prisma.answer.findUnique({
        where: { id: answerId },
        include: {
          question: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }

      // Check permissions (same logic as PUT)
      let canDelete = false;

      if (answer.authorId === session.user.id) {
        canDelete = true;
      } else {
        if (currentUser.role === "LECTURER" && currentUser.lecturer) {
          const assignment = await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId: answer.question.courseId,
              isActive: true,
            },
          });
          canDelete = !!assignment;
        } else if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          canDelete =
            answer.question.course.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          canDelete =
            answer.question.course.schoolId ===
            currentUser.schoolAdmin.schoolId;
        } else if (currentUser.role === "SENATE_ADMIN") {
          canDelete = true;
        }
      }

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.answer.delete({
        where: { id: answerId },
      });

      // Check if question still has answers
      const remainingAnswers = await prisma.answer.count({
        where: { questionId: answer.questionId },
      });

      if (remainingAnswers === 0) {
        await prisma.question.update({
          where: { id: answer.questionId },
          data: { isAnswered: false, isResolved: false },
        });
      }

      return res.status(200).json({ message: "Answer deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in Q&A answers API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

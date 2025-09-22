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
      // Get questions for a course
      const {
        courseId,
        page = "1",
        limit = "20",
        sortBy = "newest",
      } = req.query;

      if (!courseId || typeof courseId !== "string") {
        return res.status(400).json({ message: "Course ID is required" });
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

      // Check if user has access to this course
      let hasAccess = false;

      if (currentUser.role === "STUDENT" && currentUser.student) {
        // Check if student is enrolled in this course
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: currentUser.student.id,
            courseId,
            isActive: true,
          },
        });
        hasAccess = !!enrollment;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        // Check if lecturer is assigned to this course
        const assignment = await prisma.courseAssignment.findFirst({
          where: {
            lecturerId: currentUser.lecturer.id,
            courseId,
            isActive: true,
          },
        });
        hasAccess = !!assignment;
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Check if course belongs to their department
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { departmentId: true },
        });
        hasAccess =
          course?.departmentId === currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // Check if course belongs to their school
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { schoolId: true },
        });
        hasAccess = course?.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this course" });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let orderBy: any = { createdAt: "desc" };

      switch (sortBy) {
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "most_voted":
          orderBy = { upvotes: "desc" };
          break;
        case "most_answered":
          orderBy = { answers: { _count: "desc" } };
          break;
        case "unanswered":
          orderBy = { isAnswered: "asc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }

      const questions = await prisma.question.findMany({
        where: { courseId },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          course: {
            select: { id: true, title: true, code: true },
          },
          _count: {
            select: { answers: true },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      });

      const totalQuestions = await prisma.question.count({
        where: { courseId },
      });

      return res.status(200).json({
        questions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalQuestions,
          pages: Math.ceil(totalQuestions / limitNum),
        },
      });
    } else if (req.method === "POST") {
      // Create a new question
      const { courseId, title, content } = req.body;

      if (!courseId || !title || !content) {
        return res
          .status(400)
          .json({ message: "Course ID, title, and content are required" });
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

      // Check if user has access to this course (same logic as GET)
      let hasAccess = false;

      if (currentUser.role === "STUDENT" && currentUser.student) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: currentUser.student.id,
            courseId,
            isActive: true,
          },
        });
        hasAccess = !!enrollment;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        const assignment = await prisma.courseAssignment.findFirst({
          where: {
            lecturerId: currentUser.lecturer.id,
            courseId,
            isActive: true,
          },
        });
        hasAccess = !!assignment;
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { departmentId: true },
        });
        hasAccess =
          course?.departmentId === currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { schoolId: true },
        });
        hasAccess = course?.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this course" });
      }

      const question = await prisma.question.create({
        data: {
          courseId,
          title,
          content,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          course: {
            select: { id: true, title: true, code: true },
          },
        },
      });

      return res.status(201).json({ question });
    } else if (req.method === "PUT") {
      // Update a question
      const { questionId, title, content } = req.body;

      if (!questionId) {
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

      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          course: true,
        },
      });

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check permissions
      let canModify = false;

      // Author can always modify their own question
      if (question.authorId === session.user.id) {
        canModify = true;
      } else {
        // Admins can modify questions in their scope
        if (currentUser.role === "SENATE_ADMIN") {
          canModify = true;
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          canModify =
            question.course.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          canModify =
            question.course.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
          canModify = Boolean(
            await prisma.courseAssignment.findFirst({
              where: {
                lecturerId: currentUser.lecturer.id,
                courseId: question.courseId,
                isActive: true,
              },
            })
          );
        }
      }

      if (!canModify) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
        data: {
          title: title || question.title,
          content: content || question.content,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          course: {
            select: { id: true, title: true, code: true },
          },
        },
      });

      return res.status(200).json({ question: updatedQuestion });
    } else if (req.method === "DELETE") {
      // Delete a question
      const { questionId } = req.query;

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

      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          course: true,
        },
      });

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check permissions (same logic as PUT)
      let canDelete = false;

      if (question.authorId === session.user.id) {
        canDelete = true;
      } else {
        if (currentUser.role === "SENATE_ADMIN") {
          canDelete = true;
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          canDelete =
            question.course.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          canDelete =
            question.course.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
          canDelete = Boolean(
            await prisma.courseAssignment.findFirst({
              where: {
                lecturerId: currentUser.lecturer.id,
                courseId: question.courseId,
                isActive: true,
              },
            })
          );
        }
      }

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.question.delete({
        where: { id: questionId },
      });

      return res.status(200).json({ message: "Question deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in Q&A questions API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

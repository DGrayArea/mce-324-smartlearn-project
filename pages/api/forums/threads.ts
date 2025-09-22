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
      // Get forum threads
      const { categoryId, page = "1", limit = "20" } = req.query;

      if (!categoryId || typeof categoryId !== "string") {
        return res.status(400).json({ message: "Category ID is required" });
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

      // Check if user has access to this category
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId, isActive: true },
        include: {
          course: true,
          department: true,
          school: true,
        },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check access permissions
      let hasAccess = false;

      if (category.isGlobal) {
        hasAccess = true;
      } else if (currentUser.role === "STUDENT" && currentUser.student) {
        if (category.courseId) {
          // Check if student is enrolled in this course
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: currentUser.student.id,
              courseId: category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!enrollment;
        } else if (category.departmentId) {
          hasAccess =
            currentUser.student.departmentId === category.departmentId;
        }
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        if (category.courseId) {
          // Check if lecturer is assigned to this course
          const assignment = await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId: category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!assignment;
        } else if (category.departmentId) {
          hasAccess =
            currentUser.lecturer.departmentId === category.departmentId;
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        hasAccess =
          category.departmentId === currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        hasAccess = category.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this category" });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const threads = await prisma.forumThread.findMany({
        where: { categoryId },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          _count: {
            select: { posts: true },
          },
        },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limitNum,
      });

      const totalThreads = await prisma.forumThread.count({
        where: { categoryId },
      });

      return res.status(200).json({
        threads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalThreads,
          pages: Math.ceil(totalThreads / limitNum),
        },
      });
    } else if (req.method === "POST") {
      // Create a new forum thread
      const { categoryId, title, content } = req.body;

      if (!categoryId || !title || !content) {
        return res
          .status(400)
          .json({ message: "Category ID, title, and content are required" });
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

      // Check if user has access to this category
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId, isActive: true },
        include: {
          course: true,
          department: true,
          school: true,
        },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check access permissions (same logic as GET)
      let hasAccess = false;

      if (category.isGlobal) {
        hasAccess = true;
      } else if (currentUser.role === "STUDENT" && currentUser.student) {
        if (category.courseId) {
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: currentUser.student.id,
              courseId: category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!enrollment;
        } else if (category.departmentId) {
          hasAccess =
            currentUser.student.departmentId === category.departmentId;
        }
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        if (category.courseId) {
          const assignment = await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId: category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!assignment;
        } else if (category.departmentId) {
          hasAccess =
            currentUser.lecturer.departmentId === category.departmentId;
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        hasAccess =
          category.departmentId === currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        hasAccess = category.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this category" });
      }

      const thread = await prisma.forumThread.create({
        data: {
          categoryId,
          title,
          content,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      });

      return res.status(201).json({ thread });
    } else if (req.method === "PUT") {
      // Update a forum thread
      const { threadId, title, content, isPinned, isLocked } = req.body;

      if (!threadId) {
        return res.status(400).json({ message: "Thread ID is required" });
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

      const thread = await prisma.forumThread.findUnique({
        where: { id: threadId },
        include: {
          category: {
            include: {
              course: true,
              department: true,
              school: true,
            },
          },
        },
      });

      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      // Check permissions
      let canModify = false;

      // Author can always modify their own thread
      if (thread.authorId === session.user.id) {
        canModify = true;
      } else {
        // Admins can modify threads in their scope
        if (currentUser.role === "SENATE_ADMIN") {
          canModify = true;
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          canModify =
            thread.category.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          canModify =
            thread.category.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
          canModify = Boolean(
            thread.category.courseId &&
            (await prisma.courseAssignment.findFirst({
              where: {
                lecturerId: currentUser.lecturer.id,
                courseId: thread.category.courseId,
                isActive: true,
              },
            }))
          );
        }
      }

      if (!canModify) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedThread = await prisma.forumThread.update({
        where: { id: threadId },
        data: {
          title: title || thread.title,
          content: content || thread.content,
          isPinned: isPinned !== undefined ? isPinned : thread.isPinned,
          isLocked: isLocked !== undefined ? isLocked : thread.isLocked,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      });

      return res.status(200).json({ thread: updatedThread });
    } else if (req.method === "DELETE") {
      // Delete a forum thread
      const { threadId } = req.query;

      if (!threadId || typeof threadId !== "string") {
        return res.status(400).json({ message: "Thread ID is required" });
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

      const thread = await prisma.forumThread.findUnique({
        where: { id: threadId },
        include: {
          category: {
            include: {
              course: true,
              department: true,
              school: true,
            },
          },
        },
      });

      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }

      // Check permissions (same logic as PUT)
      let canDelete = false;

      if (thread.authorId === session.user.id) {
        canDelete = true;
      } else {
        if (currentUser.role === "SENATE_ADMIN") {
          canDelete = true;
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          canDelete =
            thread.category.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          canDelete =
            thread.category.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
          canDelete = Boolean(
            thread.category.courseId &&
            (await prisma.courseAssignment.findFirst({
              where: {
                lecturerId: currentUser.lecturer.id,
                courseId: thread.category.courseId,
                isActive: true,
              },
            }))
          );
        }
      }

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.forumThread.delete({
        where: { id: threadId },
      });

      return res.status(200).json({ message: "Thread deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in forum threads API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

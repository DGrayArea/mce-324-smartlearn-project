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
      // Get forum posts for a thread
      const { threadId, page = "1", limit = "20" } = req.query;

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

      // Check if user has access to this thread
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

      // Check access permissions (same logic as threads)
      let hasAccess = false;

      if (thread.category.isGlobal) {
        hasAccess = true;
      } else if (currentUser.role === "STUDENT" && currentUser.student) {
        if (thread.category.courseId) {
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: currentUser.student.id,
              courseId: thread.category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!enrollment;
        } else if (thread.category.departmentId) {
          hasAccess =
            currentUser.student.departmentId === thread.category.departmentId;
        }
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        if (thread.category.courseId) {
          const assignment = await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId: thread.category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!assignment;
        } else if (thread.category.departmentId) {
          hasAccess =
            currentUser.lecturer.departmentId === thread.category.departmentId;
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        hasAccess =
          thread.category.departmentId ===
          currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        hasAccess =
          thread.category.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this thread" });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const posts = await prisma.forumPost.findMany({
        where: { threadId },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limitNum,
      });

      const totalPosts = await prisma.forumPost.count({
        where: { threadId },
      });

      return res.status(200).json({
        posts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limitNum),
        },
      });
    } else if (req.method === "POST") {
      // Create a new forum post
      const { threadId, content } = req.body;

      if (!threadId || !content) {
        return res
          .status(400)
          .json({ message: "Thread ID and content are required" });
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

      // Check if user has access to this thread
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

      // Check if thread is locked
      if (thread.isLocked) {
        return res.status(403).json({ message: "Thread is locked" });
      }

      // Check access permissions (same logic as GET)
      let hasAccess = false;

      if (thread.category.isGlobal) {
        hasAccess = true;
      } else if (currentUser.role === "STUDENT" && currentUser.student) {
        if (thread.category.courseId) {
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: currentUser.student.id,
              courseId: thread.category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!enrollment;
        } else if (thread.category.departmentId) {
          hasAccess =
            currentUser.student.departmentId === thread.category.departmentId;
        }
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        if (thread.category.courseId) {
          const assignment = await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId: thread.category.courseId,
              isActive: true,
            },
          });
          hasAccess = !!assignment;
        } else if (thread.category.departmentId) {
          hasAccess =
            currentUser.lecturer.departmentId === thread.category.departmentId;
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        hasAccess =
          thread.category.departmentId ===
          currentUser.departmentAdmin.departmentId;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        hasAccess =
          thread.category.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this thread" });
      }

      // Create the post
      const post = await prisma.forumPost.create({
        data: {
          threadId,
          content,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // Update thread's reply count and last updated time
      await prisma.forumThread.update({
        where: { id: threadId },
        data: {
          replyCount: {
            increment: 1,
          },
          updatedAt: new Date(),
        },
      });

      return res.status(201).json({ post });
    } else if (req.method === "PUT") {
      // Update a forum post
      const { postId, content } = req.body;

      if (!postId || !content) {
        return res
          .status(400)
          .json({ message: "Post ID and content are required" });
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

      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        include: {
          thread: {
            include: {
              category: {
                include: {
                  course: true,
                  department: true,
                  school: true,
                },
              },
            },
          },
        },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check permissions
      let canModify = false;

      // Author can always modify their own post
      if (post.authorId === session.user.id) {
        canModify = true;
      } else {
        // Admins can modify posts in their scope
        if (currentUser.role === "SENATE_ADMIN") {
          canModify = true;
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          canModify =
            post.thread.category.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          canModify =
            post.thread.category.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
          canModify = Boolean(
            post.thread.category.courseId &&
            (await prisma.courseAssignment.findFirst({
              where: {
                lecturerId: currentUser.lecturer.id,
                courseId: post.thread.category.courseId,
                isActive: true,
              },
            }))
          );
        }
      }

      if (!canModify) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedPost = await prisma.forumPost.update({
        where: { id: postId },
        data: { content },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(200).json({ post: updatedPost });
    } else if (req.method === "DELETE") {
      // Delete a forum post
      const { postId } = req.query;

      if (!postId || typeof postId !== "string") {
        return res.status(400).json({ message: "Post ID is required" });
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

      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        include: {
          thread: {
            include: {
              category: {
                include: {
                  course: true,
                  department: true,
                  school: true,
                },
              },
            },
          },
        },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Check permissions (same logic as PUT)
      let canDelete = false;

      if (post.authorId === session.user.id) {
        canDelete = true;
      } else {
        if (currentUser.role === "SENATE_ADMIN") {
          canDelete = true;
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          canDelete =
            post.thread.category.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          canDelete =
            post.thread.category.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
          canDelete = Boolean(
            post.thread.category.courseId &&
            (await prisma.courseAssignment.findFirst({
              where: {
                lecturerId: currentUser.lecturer.id,
                courseId: post.thread.category.courseId,
                isActive: true,
              },
            }))
          );
        }
      }

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.forumPost.delete({
        where: { id: postId },
      });

      // Update thread's reply count
      await prisma.forumThread.update({
        where: { id: post.threadId },
        data: {
          replyCount: {
            decrement: 1,
          },
        },
      });

      return res.status(200).json({ message: "Post deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in forum posts API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

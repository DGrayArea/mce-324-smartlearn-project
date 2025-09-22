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
      // Get forum categories based on user role and access
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

      let whereClause: any = { isActive: true };

      // Filter categories based on user role and access
      if (currentUser.role === "STUDENT" && currentUser.student) {
        // Students can see global categories and categories for their enrolled courses
        const enrolledCourses = await prisma.enrollment.findMany({
          where: { studentId: currentUser.student.id, isActive: true },
          select: { courseId: true },
        });

        const courseIds = enrolledCourses.map((e) => e.courseId);

        whereClause = {
          isActive: true,
          OR: [
            { isGlobal: true },
            { courseId: { in: courseIds } },
            { departmentId: currentUser.student.departmentId },
          ],
        };
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        // Lecturers can see global categories and categories for their assigned courses
        const assignedCourses = await prisma.courseAssignment.findMany({
          where: { lecturerId: currentUser.lecturer.id, isActive: true },
          select: { courseId: true },
        });

        const courseIds = assignedCourses.map((a) => a.courseId);

        whereClause = {
          isActive: true,
          OR: [
            { isGlobal: true },
            { courseId: { in: courseIds } },
            { departmentId: currentUser.lecturer.departmentId },
          ],
        };
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Department admins can see categories for their department
        whereClause = {
          isActive: true,
          OR: [
            { isGlobal: true },
            { departmentId: currentUser.departmentAdmin.departmentId },
          ],
        };
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // School admins can see categories for their school
        whereClause = {
          isActive: true,
          OR: [
            { isGlobal: true },
            { schoolId: currentUser.schoolAdmin.schoolId },
          ],
        };
      } else if (currentUser.role === "SENATE_ADMIN") {
        // Senate admins can see all categories
        whereClause = { isActive: true };
      }

      const categories = await prisma.forumCategory.findMany({
        where: whereClause,
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          school: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          _count: {
            select: { threads: true },
          },
        },
        orderBy: [{ isGlobal: "desc" }, { createdAt: "desc" }],
      });

      return res.status(200).json({ categories });
    } else if (req.method === "POST") {
      // Create a new forum category
      const { name, description, courseId, departmentId, schoolId, isGlobal } =
        req.body;

      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          lecturer: true,
          departmentAdmin: true,
          schoolAdmin: true,
          senateAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check permissions
      if (currentUser.role === "STUDENT") {
        return res
          .status(403)
          .json({ message: "Students cannot create forum categories" });
      }

      // Validate scope based on role
      if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        if (courseId) {
          // Check if lecturer has access to this course
          const hasAccess = await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId,
              isActive: true,
            },
          });

          if (!hasAccess) {
            return res
              .status(403)
              .json({ message: "Access denied to this course" });
          }
        } else if (
          departmentId &&
          departmentId !== currentUser.lecturer.departmentId
        ) {
          return res
            .status(403)
            .json({ message: "Access denied to this department" });
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        if (
          departmentId &&
          departmentId !== currentUser.departmentAdmin.departmentId
        ) {
          return res
            .status(403)
            .json({ message: "Access denied to this department" });
        }
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        if (schoolId && schoolId !== currentUser.schoolAdmin.schoolId) {
          return res
            .status(403)
            .json({ message: "Access denied to this school" });
        }
      }

      const category = await prisma.forumCategory.create({
        data: {
          name,
          description,
          courseId: courseId || null,
          departmentId: departmentId || null,
          schoolId: schoolId || null,
          isGlobal: isGlobal || false,
          createdById: session.user.id,
        },
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          school: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(201).json({ category });
    } else if (req.method === "PUT") {
      // Update a forum category
      const { categoryId, name, description, isActive } = req.body;

      if (!categoryId) {
        return res.status(400).json({ message: "Category ID is required" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          lecturer: true,
          departmentAdmin: true,
          schoolAdmin: true,
          senateAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user can modify this category
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId },
        include: {
          course: true,
          department: true,
          school: true,
        },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check permissions
      let canModify = false;

      if (currentUser.role === "SENATE_ADMIN") {
        canModify = true;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        canModify =
          category.schoolId === currentUser.schoolAdmin.schoolId ||
          category.isGlobal;
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        canModify =
          category.departmentId === currentUser.departmentAdmin.departmentId ||
          category.isGlobal;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        canModify = Boolean(
          category.courseId &&
          (await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId: category.courseId,
              isActive: true,
            },
          }))
        );
      }

      if (!canModify) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedCategory = await prisma.forumCategory.update({
        where: { id: categoryId },
        data: {
          name: name || category.name,
          description:
            description !== undefined ? description : category.description,
          isActive: isActive !== undefined ? isActive : category.isActive,
        },
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          school: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(200).json({ category: updatedCategory });
    } else if (req.method === "DELETE") {
      // Delete a forum category
      const { categoryId } = req.query;

      if (!categoryId || typeof categoryId !== "string") {
        return res.status(400).json({ message: "Category ID is required" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          lecturer: true,
          departmentAdmin: true,
          schoolAdmin: true,
          senateAdmin: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user can delete this category
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId },
        include: {
          course: true,
          department: true,
          school: true,
        },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check permissions
      let canDelete = false;

      if (currentUser.role === "SENATE_ADMIN") {
        canDelete = true;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        canDelete = category.schoolId === currentUser.schoolAdmin.schoolId;
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        canDelete =
          category.departmentId === currentUser.departmentAdmin.departmentId;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        canDelete = Boolean(
          category.courseId &&
          (await prisma.courseAssignment.findFirst({
            where: {
              lecturerId: currentUser.lecturer.id,
              courseId: category.courseId,
              isActive: true,
            },
          }))
        );
      }

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Soft delete by setting isActive to false
      await prisma.forumCategory.update({
        where: { id: categoryId },
        data: { isActive: false },
      });

      return res.status(200).json({ message: "Category deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in forum categories API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

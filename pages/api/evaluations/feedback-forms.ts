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

    if (req.method === "GET") {
      // Get feedback forms
      const { type, targetId, page = "1", limit = "20" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let whereClause: any = {};

      // Filter by type (course, lecturer, system, etc.)
      if (type && typeof type === "string") {
        whereClause.type = type;
      }

      // Filter by target (course ID, lecturer ID, etc.)
      if (targetId && typeof targetId === "string") {
        whereClause.targetId = targetId;
      }

      // Role-based access
      if (currentUser.role === "STUDENT" && currentUser.student) {
        // Students can see feedback forms for their courses
        whereClause.OR = [
          { type: "SYSTEM" },
          { type: "GENERAL" },
          {
            type: "COURSE",
            course: {
              enrollments: {
                some: {
                  studentId: currentUser.student.id,
                  isActive: true,
                },
              },
            },
          },
        ];
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        // Lecturers can see feedback forms for their courses
        whereClause.OR = [
          { type: "SYSTEM" },
          { type: "GENERAL" },
          {
            type: "COURSE",
            course: {
              courseAssignments: {
                some: {
                  lecturerId: currentUser.lecturer.id,
                  isActive: true,
                },
              },
            },
          },
          {
            type: "LECTURER",
            targetId: currentUser.lecturer.id,
          },
        ];
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Department admins can see all feedback forms for their department
        whereClause.OR = [
          { type: "SYSTEM" },
          { type: "GENERAL" },
          {
            type: "COURSE",
            course: {
              departmentId: currentUser.departmentAdmin.departmentId,
            },
          },
          {
            type: "LECTURER",
            lecturer: {
              departmentId: currentUser.departmentAdmin.departmentId,
            },
          },
        ];
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // School admins can see all feedback forms for their school
        whereClause.OR = [
          { type: "SYSTEM" },
          { type: "GENERAL" },
          {
            type: "COURSE",
            course: {
              schoolId: currentUser.schoolAdmin.schoolId,
            },
          },
          {
            type: "LECTURER",
            lecturer: {
              department: {
                schoolId: currentUser.schoolAdmin.schoolId,
              },
            },
          },
        ];
      }
      // Senate admins can see all feedback forms (no additional filter)

      const feedbackForms = await prisma.feedbackForm.findMany({
        where: whereClause,
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
          lecturer: {
            select: { 
              id: true, 
              name: true,
              department: {
                select: { id: true, schoolId: true }
              }
            },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      });

      const totalForms = await prisma.feedbackForm.count({
        where: whereClause,
      });

      return res.status(200).json({
        feedbackForms,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalForms,
          pages: Math.ceil(totalForms / limitNum),
        },
      });
    } else if (req.method === "POST") {
      // Create a feedback form
      const {
        title,
        description,
        type,
        targetId,
        courseId,
        lecturerId,
        questions,
        isActive,
        startDate,
        endDate,
      } = req.body;

      if (!title || !type || !questions || !Array.isArray(questions)) {
        return res.status(400).json({
          message: "Title, type, and questions are required",
        });
      }

      // Check permissions
      const canCreate = [
        "DEPARTMENT_ADMIN",
        "SCHOOL_ADMIN",
        "SENATE_ADMIN",
      ].includes(currentUser.role);

      if (!canCreate) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate target based on type
      if (type === "COURSE" && !courseId) {
        return res
          .status(400)
          .json({ message: "Course ID is required for course feedback forms" });
      }

      if (type === "LECTURER" && !lecturerId) {
        return res
          .status(400)
          .json({
            message: "Lecturer ID is required for lecturer feedback forms",
          });
      }

      // Check access to target
      if (type === "COURSE" && courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { departmentId: true, schoolId: true },
        });

        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }

        if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          if (
            course.departmentId !== currentUser.departmentAdmin.departmentId
          ) {
            return res
              .status(403)
              .json({ message: "Access denied to this course" });
          }
        } else if (
          currentUser.role === "SCHOOL_ADMIN" &&
          currentUser.schoolAdmin
        ) {
          if (course.schoolId !== currentUser.schoolAdmin.schoolId) {
            return res
              .status(403)
              .json({ message: "Access denied to this course" });
          }
        }
      }

      if (type === "LECTURER" && lecturerId) {
        const lecturer = await prisma.lecturer.findUnique({
          where: { id: lecturerId },
          select: { departmentId: true },
        });

        if (!lecturer) {
          return res.status(404).json({ message: "Lecturer not found" });
        }

        if (
          currentUser.role === "DEPARTMENT_ADMIN" &&
          currentUser.departmentAdmin
        ) {
          if (
            lecturer.departmentId !== currentUser.departmentAdmin.departmentId
          ) {
            return res
              .status(403)
              .json({ message: "Access denied to this lecturer" });
          }
        }
      }

      const feedbackForm = await prisma.feedbackForm.create({
        data: {
          title,
          description: description || null,
          type,
          targetId: targetId || null,
          courseId: courseId || null,
          lecturerId: lecturerId || null,
          questions: JSON.stringify(questions),
          isActive: isActive !== undefined ? isActive : true,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdById: session.user.id,
        },
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
          lecturer: {
            select: { 
              id: true, 
              name: true,
              department: {
                select: { id: true, schoolId: true }
              }
            },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(201).json({ feedbackForm });
    } else if (req.method === "PUT") {
      // Update a feedback form
      const {
        formId,
        title,
        description,
        questions,
        isActive,
        startDate,
        endDate,
      } = req.body;

      if (!formId) {
        return res.status(400).json({ message: "Form ID is required" });
      }

      // Check permissions
      const canUpdate = [
        "DEPARTMENT_ADMIN",
        "SCHOOL_ADMIN",
        "SENATE_ADMIN",
      ].includes(currentUser.role);

      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied" });
      }

      const feedbackForm = await prisma.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          course: true,
          lecturer: {
            include: {
              department: true,
            },
          },
        },
      });

      if (!feedbackForm) {
        return res.status(404).json({ message: "Feedback form not found" });
      }

      // Check access to update this form
      let canModify = false;

      if (currentUser.role === "SENATE_ADMIN") {
        canModify = true;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        if (feedbackForm.course) {
          canModify =
            feedbackForm.course.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (feedbackForm.lecturer) {
          canModify =
            feedbackForm.lecturer.department.schoolId ===
            currentUser.schoolAdmin.schoolId;
        } else {
          canModify = true; // System/General forms
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        if (feedbackForm.course) {
          canModify =
            feedbackForm.course.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (feedbackForm.lecturer) {
          canModify =
            feedbackForm.lecturer.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else {
          canModify = true; // System/General forms
        }
      }

      if (!canModify) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedForm = await prisma.feedbackForm.update({
        where: { id: formId },
        data: {
          title: title || feedbackForm.title,
          description:
            description !== undefined ? description : feedbackForm.description,
          questions: questions
            ? JSON.stringify(questions)
            : feedbackForm.questions,
          isActive: isActive !== undefined ? isActive : feedbackForm.isActive,
          startDate: startDate ? new Date(startDate) : feedbackForm.startDate,
          endDate: endDate ? new Date(endDate) : feedbackForm.endDate,
        },
        include: {
          course: {
            select: { id: true, title: true, code: true },
          },
          lecturer: {
            select: { 
              id: true, 
              name: true,
              department: {
                select: { id: true, schoolId: true }
              }
            },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(200).json({ feedbackForm: updatedForm });
    } else if (req.method === "DELETE") {
      // Delete a feedback form
      const { formId } = req.query;

      if (!formId || typeof formId !== "string") {
        return res.status(400).json({ message: "Form ID is required" });
      }

      // Check permissions
      const canDelete = [
        "DEPARTMENT_ADMIN",
        "SCHOOL_ADMIN",
        "SENATE_ADMIN",
      ].includes(currentUser.role);

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      const feedbackForm = await prisma.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          course: true,
          lecturer: {
            include: {
              department: true,
            },
          },
        },
      });

      if (!feedbackForm) {
        return res.status(404).json({ message: "Feedback form not found" });
      }

      // Check access to delete this form (same logic as update)
      let canModify = false;

      if (currentUser.role === "SENATE_ADMIN") {
        canModify = true;
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        if (feedbackForm.course) {
          canModify =
            feedbackForm.course.schoolId === currentUser.schoolAdmin.schoolId;
        } else if (feedbackForm.lecturer) {
          canModify =
            feedbackForm.lecturer.department.schoolId ===
            currentUser.schoolAdmin.schoolId;
        } else {
          canModify = true;
        }
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        if (feedbackForm.course) {
          canModify =
            feedbackForm.course.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else if (feedbackForm.lecturer) {
          canModify =
            feedbackForm.lecturer.departmentId ===
            currentUser.departmentAdmin.departmentId;
        } else {
          canModify = true;
        }
      }

      if (!canModify) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.feedbackForm.delete({
        where: { id: formId },
      });

      return res
        .status(200)
        .json({ message: "Feedback form deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in feedback forms API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

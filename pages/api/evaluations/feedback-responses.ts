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
      // Get feedback responses
      const { formId, studentId, page = "1", limit = "20" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let whereClause: any = {};

      // Filter by form
      if (formId && typeof formId === "string") {
        whereClause.formId = formId;
      }

      // Filter by student
      if (studentId && typeof studentId === "string") {
        whereClause.studentId = studentId;
      }

      // Role-based access
      if (currentUser.role === "STUDENT" && currentUser.student) {
        // Students can only see their own responses
        whereClause.studentId = currentUser.student.id;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        // Lecturers can see responses for their feedback forms
        whereClause.form = {
          OR: [
            { lecturerId: currentUser.lecturer.id },
            {
              course: {
                courseAssignments: {
                  some: {
                    lecturerId: currentUser.lecturer.id,
                    isActive: true,
                  },
                },
              },
            },
          ],
        };
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Department admins can see responses for their department
        whereClause.form = {
          OR: [
            { type: "SYSTEM" },
            { type: "GENERAL" },
            {
              course: {
                departmentId: currentUser.departmentAdmin.departmentId,
              },
            },
            {
              lecturer: {
                departmentId: currentUser.departmentAdmin.departmentId,
              },
            },
          ],
        };
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // School admins can see responses for their school
        whereClause.form = {
          OR: [
            { type: "SYSTEM" },
            { type: "GENERAL" },
            {
              course: {
                schoolId: currentUser.schoolAdmin.schoolId,
              },
            },
            {
              lecturer: {
                department: {
                  schoolId: currentUser.schoolAdmin.schoolId,
                },
              },
            },
          ],
        };
      }
      // Senate admins can see all responses (no additional filter)

      const responses = await prisma.feedbackResponse.findMany({
        where: whereClause,
        include: {
          form: {
            select: {
              id: true,
              title: true,
              type: true,
              course: {
                select: { id: true, title: true, code: true },
              },
              lecturer: {
                select: { id: true, name: true },
              },
            },
          },
          student: {
            select: { id: true, name: true, matricNumber: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limitNum,
      });

      const totalResponses = await prisma.feedbackResponse.count({
        where: whereClause,
      });

      return res.status(200).json({
        responses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResponses,
          pages: Math.ceil(totalResponses / limitNum),
        },
      });
    } else if (req.method === "POST") {
      // Submit a feedback response
      const { formId, responses, isAnonymous } = req.body;

      if (!formId || !responses) {
        return res.status(400).json({
          message: "Form ID and responses are required",
        });
      }

      if (!currentUser.student) {
        return res
          .status(403)
          .json({ message: "Only students can submit feedback responses" });
      }

      // Check if form exists and is active
      const form = await prisma.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          course: true,
          lecturer: true,
        },
      });

      if (!form) {
        return res.status(404).json({ message: "Feedback form not found" });
      }

      if (!form.isActive) {
        return res.status(400).json({ message: "Feedback form is not active" });
      }

      // Check if form is within date range
      const now = new Date();
      if (form.startDate && now < form.startDate) {
        return res
          .status(400)
          .json({ message: "Feedback form is not yet open" });
      }

      if (form.endDate && now > form.endDate) {
        return res.status(400).json({ message: "Feedback form has closed" });
      }

      // Check if student has access to this form
      let hasAccess = false;

      if (form.type === "SYSTEM" || form.type === "GENERAL") {
        hasAccess = true;
      } else if (form.type === "COURSE" && form.course) {
        // Check if student is enrolled in this course
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: currentUser.student.id,
            courseId: form.course.id,
            isActive: true,
          },
        });
        hasAccess = !!enrollment;
      } else if (form.type === "LECTURER" && form.lecturer) {
        // Check if student has any courses with this lecturer
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            studentId: currentUser.student.id,
            course: {
              courseAssignments: {
                some: {
                  lecturerId: form.lecturer.id,
                  isActive: true,
                },
              },
            },
            isActive: true,
          },
        });
        hasAccess = !!enrollment;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this feedback form" });
      }

      // Check if student has already submitted a response
      const existingResponse = await prisma.feedbackResponse.findUnique({
        where: {
          formId_studentId: {
            formId,
            studentId: currentUser.student.id,
          },
        },
      });

      if (existingResponse) {
        return res.status(400).json({
          message:
            "You have already submitted a response for this feedback form",
        });
      }

      const response = await prisma.feedbackResponse.create({
        data: {
          formId,
          studentId: currentUser.student.id,
          responses: JSON.stringify(responses),
          isAnonymous: isAnonymous || true,
        },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          student: {
            select: { id: true, name: true, matricNumber: true },
          },
        },
      });

      return res.status(201).json({ response });
    } else if (req.method === "PUT") {
      // Update a feedback response
      const { responseId, responses } = req.body;

      if (!responseId || !responses) {
        return res.status(400).json({
          message: "Response ID and responses are required",
        });
      }

      if (!currentUser.student) {
        return res
          .status(403)
          .json({ message: "Only students can update feedback responses" });
      }

      const response = await prisma.feedbackResponse.findUnique({
        where: { id: responseId },
        include: {
          form: true,
        },
      });

      if (!response) {
        return res.status(404).json({ message: "Feedback response not found" });
      }

      if (response.studentId !== currentUser.student.id) {
        return res
          .status(403)
          .json({ message: "You can only update your own responses" });
      }

      if (response.isAnonymous) {
        return res
          .status(403)
          .json({ message: "Cannot update anonymous responses" });
      }

      // Check if form is still active and within date range
      const now = new Date();
      if (!response.form.isActive) {
        return res.status(400).json({ message: "Feedback form is not active" });
      }

      if (response.form.endDate && now > response.form.endDate) {
        return res.status(400).json({ message: "Feedback form has closed" });
      }

      const updatedResponse = await prisma.feedbackResponse.update({
        where: { id: responseId },
        data: {
          responses: JSON.stringify(responses),
        },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          student: {
            select: { id: true, name: true, matricNumber: true },
          },
        },
      });

      return res.status(200).json({ response: updatedResponse });
    } else if (req.method === "DELETE") {
      // Delete a feedback response
      const { responseId } = req.query;

      if (!responseId || typeof responseId !== "string") {
        return res.status(400).json({ message: "Response ID is required" });
      }

      if (!currentUser.student) {
        return res
          .status(403)
          .json({ message: "Only students can delete feedback responses" });
      }

      const response = await prisma.feedbackResponse.findUnique({
        where: { id: responseId },
        include: {
          form: true,
        },
      });

      if (!response) {
        return res.status(404).json({ message: "Feedback response not found" });
      }

      if (response.studentId !== currentUser.student.id) {
        return res
          .status(403)
          .json({ message: "You can only delete your own responses" });
      }

      // Check if form is still active and within date range
      const now = new Date();
      if (!response.form.isActive) {
        return res.status(400).json({ message: "Feedback form is not active" });
      }

      if (response.form.endDate && now > response.form.endDate) {
        return res.status(400).json({ message: "Feedback form has closed" });
      }

      await prisma.feedbackResponse.delete({
        where: { id: responseId },
      });

      return res
        .status(200)
        .json({ message: "Feedback response deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in feedback responses API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

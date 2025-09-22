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
      // Get course evaluations
      const {
        courseId,
        lecturerId,
        academicYear,
        semester,
        page = "1",
        limit = "20",
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let whereClause: any = {};

      // Filter by course
      if (courseId && typeof courseId === "string") {
        whereClause.courseId = courseId;
      }

      // Filter by lecturer
      if (lecturerId && typeof lecturerId === "string") {
        whereClause.lecturerId = lecturerId;
      }

      // Filter by academic year
      if (academicYear && typeof academicYear === "string") {
        whereClause.academicYear = academicYear;
      }

      // Filter by semester
      if (semester && typeof semester === "string") {
        whereClause.semester = semester;
      }

      // Role-based access
      if (currentUser.role === "STUDENT" && currentUser.student) {
        // Students can only see their own evaluations
        whereClause.studentId = currentUser.student.id;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        // Lecturers can see evaluations for their courses
        whereClause.lecturerId = currentUser.lecturer.id;
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Department admins can see evaluations for their department
        whereClause.course = {
          departmentId: currentUser.departmentAdmin.departmentId,
        };
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // School admins can see evaluations for their school
        whereClause.course = {
          schoolId: currentUser.schoolAdmin.schoolId,
        };
      }
      // Senate admins can see all evaluations (no additional filter)

      const evaluations = await prisma.courseEvaluation.findMany({
        where: whereClause,
        include: {
          student: {
            select: { id: true, name: true, matricNumber: true },
          },
          course: {
            select: { id: true, title: true, code: true },
          },
          lecturer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limitNum,
      });

      const totalEvaluations = await prisma.courseEvaluation.count({
        where: whereClause,
      });

      // Calculate average ratings
      const avgRatings = await prisma.courseEvaluation.aggregate({
        where: whereClause,
        _avg: {
          contentQuality: true,
          teachingMethod: true,
          courseOrganization: true,
          materialRelevance: true,
          overallRating: true,
        },
        _count: {
          id: true,
        },
      });

      return res.status(200).json({
        evaluations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalEvaluations,
          pages: Math.ceil(totalEvaluations / limitNum),
        },
        averageRatings: {
          contentQuality: avgRatings._avg.contentQuality || 0,
          teachingMethod: avgRatings._avg.teachingMethod || 0,
          courseOrganization: avgRatings._avg.courseOrganization || 0,
          materialRelevance: avgRatings._avg.materialRelevance || 0,
          overallRating: avgRatings._avg.overallRating || 0,
          totalResponses: avgRatings._count.id,
        },
      });
    } else if (req.method === "POST") {
      // Submit a course evaluation
      const {
        courseId,
        lecturerId,
        academicYear,
        semester,
        contentQuality,
        teachingMethod,
        courseOrganization,
        materialRelevance,
        overallRating,
        likes,
        improvements,
        additionalComments,
        wouldRecommend,
        isAnonymous,
      } = req.body;

      if (!currentUser.student) {
        return res
          .status(403)
          .json({ message: "Only students can submit evaluations" });
      }

      // Validate required fields
      if (!courseId || !lecturerId || !academicYear || !semester) {
        return res.status(400).json({
          message:
            "Course ID, lecturer ID, academic year, and semester are required",
        });
      }

      if (
        !contentQuality ||
        !teachingMethod ||
        !courseOrganization ||
        !materialRelevance ||
        !overallRating
      ) {
        return res.status(400).json({
          message: "All rating fields are required",
        });
      }

      // Check if student is enrolled in this course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: currentUser.student.id,
          courseId,
          academicYear,
          semester,
          isActive: true,
        },
      });

      if (!enrollment) {
        return res.status(403).json({
          message:
            "You are not enrolled in this course for the specified period",
        });
      }

      // Check if evaluation already exists
      const existingEvaluation = await prisma.courseEvaluation.findUnique({
        where: {
          studentId_courseId_academicYear_semester: {
            studentId: currentUser.student.id,
            courseId,
            academicYear,
            semester,
          },
        },
      });

      if (existingEvaluation) {
        return res.status(400).json({
          message: "You have already submitted an evaluation for this course",
        });
      }

      const evaluation = await prisma.courseEvaluation.create({
        data: {
          studentId: currentUser.student.id,
          courseId,
          lecturerId,
          academicYear,
          semester,
          contentQuality: parseInt(contentQuality),
          teachingMethod: parseInt(teachingMethod),
          courseOrganization: parseInt(courseOrganization),
          materialRelevance: parseInt(materialRelevance),
          overallRating: parseInt(overallRating),
          likes: likes || null,
          improvements: improvements || null,
          additionalComments: additionalComments || null,
          wouldRecommend: wouldRecommend || false,
          isAnonymous: isAnonymous || true,
        },
        include: {
          student: {
            select: { id: true, name: true, matricNumber: true },
          },
          course: {
            select: { id: true, title: true, code: true },
          },
          lecturer: {
            select: { id: true, name: true },
          },
        },
      });

      return res.status(201).json({ evaluation });
    } else if (req.method === "PUT") {
      // Update a course evaluation (only if not anonymous and by the same student)
      const {
        evaluationId,
        contentQuality,
        teachingMethod,
        courseOrganization,
        materialRelevance,
        overallRating,
        likes,
        improvements,
        additionalComments,
        wouldRecommend,
      } = req.body;

      if (!evaluationId) {
        return res.status(400).json({ message: "Evaluation ID is required" });
      }

      if (!currentUser.student) {
        return res
          .status(403)
          .json({ message: "Only students can update evaluations" });
      }

      const evaluation = await prisma.courseEvaluation.findUnique({
        where: { id: evaluationId },
      });

      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      if (evaluation.studentId !== currentUser.student.id) {
        return res
          .status(403)
          .json({ message: "You can only update your own evaluations" });
      }

      if (evaluation.isAnonymous) {
        return res
          .status(403)
          .json({ message: "Cannot update anonymous evaluations" });
      }

      const updatedEvaluation = await prisma.courseEvaluation.update({
        where: { id: evaluationId },
        data: {
          contentQuality: contentQuality
            ? parseInt(contentQuality)
            : evaluation.contentQuality,
          teachingMethod: teachingMethod
            ? parseInt(teachingMethod)
            : evaluation.teachingMethod,
          courseOrganization: courseOrganization
            ? parseInt(courseOrganization)
            : evaluation.courseOrganization,
          materialRelevance: materialRelevance
            ? parseInt(materialRelevance)
            : evaluation.materialRelevance,
          overallRating: overallRating
            ? parseInt(overallRating)
            : evaluation.overallRating,
          likes: likes !== undefined ? likes : evaluation.likes,
          improvements:
            improvements !== undefined ? improvements : evaluation.improvements,
          additionalComments:
            additionalComments !== undefined
              ? additionalComments
              : evaluation.additionalComments,
          wouldRecommend:
            wouldRecommend !== undefined
              ? wouldRecommend
              : evaluation.wouldRecommend,
        },
        include: {
          student: {
            select: { id: true, name: true, matricNumber: true },
          },
          course: {
            select: { id: true, title: true, code: true },
          },
          lecturer: {
            select: { id: true, name: true },
          },
        },
      });

      return res.status(200).json({ evaluation: updatedEvaluation });
    } else if (req.method === "DELETE") {
      // Delete a course evaluation
      const { evaluationId } = req.query;

      if (!evaluationId || typeof evaluationId !== "string") {
        return res.status(400).json({ message: "Evaluation ID is required" });
      }

      if (!currentUser.student) {
        return res
          .status(403)
          .json({ message: "Only students can delete evaluations" });
      }

      const evaluation = await prisma.courseEvaluation.findUnique({
        where: { id: evaluationId },
      });

      if (!evaluation) {
        return res.status(404).json({ message: "Evaluation not found" });
      }

      if (evaluation.studentId !== currentUser.student.id) {
        return res
          .status(403)
          .json({ message: "You can only delete your own evaluations" });
      }

      await prisma.courseEvaluation.delete({
        where: { id: evaluationId },
      });

      return res
        .status(200)
        .json({ message: "Evaluation deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in course evaluations API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

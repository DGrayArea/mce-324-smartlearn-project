import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user is a student
  const student = await prisma.student.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    return res
      .status(403)
      .json({ message: "Access denied. Student profile required." });
  }

  if (req.method === "GET") {
    try {
      const { courseId, week, topic, documentType } = req.query;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Verify student is enrolled in this course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          courseId: courseId as string,
          isActive: true,
        },
      });

      if (!enrollment) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }

      // Build filter conditions
      const whereConditions: any = {
        courseId: courseId as string,
        isActive: true,
      };

      if (week) {
        whereConditions.week = parseInt(week as string);
      }

      if (topic) {
        whereConditions.topic = {
          contains: topic as string,
          mode: "insensitive",
        };
      }

      if (documentType) {
        whereConditions.documentType = documentType as string;
      }

      // Get course content with access control
      const content = await prisma.content.findMany({
        where: whereConditions,
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          fileType: true,
          mimeType: true,
          documentType: true,
          week: true,
          topic: true,
          tags: true,
          downloadCount: true,
          uploadedAt: true,
        },
        orderBy: [{ week: "asc" }, { topic: "asc" }, { uploadedAt: "desc" }],
      });

      // Get course info for context
      const course = await prisma.course.findUnique({
        where: { id: courseId as string },
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          level: true,
          semester: true,
          department: {
            select: { name: true, code: true },
          },
        },
      });

      res.status(200).json({
        course,
        content,
        totalItems: content.length,
      });
    } catch (error: any) {
      console.error("Error fetching course content:", error);
      res
        .status(500)
        .json({ message: "Error fetching content", error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { contentId } = req.body;

      if (!contentId) {
        return res.status(400).json({ message: "Content ID is required" });
      }

      // Get the content and verify student has access
      const content = await prisma.content.findFirst({
        where: { id: contentId },
        include: {
          course: {
            include: {
              enrollments: {
                where: {
                  studentId: student.id,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      if (content.course.enrollments.length === 0) {
        return res
          .status(403)
          .json({ message: "You don't have access to this content" });
      }

      // Increment download count
      await prisma.content.update({
        where: { id: contentId },
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      });

      res.status(200).json({
        message: "Download recorded successfully",
        content: {
          id: content.id,
          title: content.title,
          fileUrl: content.fileUrl,
          fileName: content.fileName,
          fileSize: content.fileSize,
          fileType: content.fileType,
          mimeType: content.mimeType,
        },
      });
    } catch (error: any) {
      console.error("Error recording download:", error);
      res
        .status(500)
        .json({ message: "Error recording download", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

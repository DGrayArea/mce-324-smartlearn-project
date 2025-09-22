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

  // Verify student has access to the course
  const verifyStudentAccess = async (courseId: string) => {
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        enrollments: {
          where: {
            courseId,
            isActive: true,
            academicYear: "2024/2025",
            semester: "FIRST",
          },
        },
      },
    });

    return student;
  };

  try {
    if (req.method === "GET") {
      // Get documents for a course
      const { courseId } = req.query;

      if (!courseId || typeof courseId !== "string") {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const student = await verifyStudentAccess(courseId);
      if (!student || student.enrollments.length === 0) {
        return res
          .status(403)
          .json({ message: "Access denied to this course" });
      }

      const documents = await prisma.content.findMany({
        where: {
          courseId,
          isActive: true,
        },
        orderBy: {
          uploadedAt: "desc",
        },
      });

      res.status(200).json({ documents });
    } else if (req.method === "POST") {
      // Download a document (track download count)
      const { documentId } = req.body;

      if (!documentId) {
        return res.status(400).json({ message: "Document ID is required" });
      }

      const document = await prisma.content.findUnique({
        where: { id: documentId },
        select: {
          id: true,
          courseId: true,
          fileName: true,
          fileUrl: true,
          mimeType: true,
        },
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const student = await verifyStudentAccess(document.courseId);
      if (!student || student.enrollments.length === 0) {
        return res
          .status(403)
          .json({ message: "Access denied to this document" });
      }

      // Increment download count
      await prisma.content.update({
        where: { id: documentId },
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      });

      res.status(200).json({
        message: "Download authorized",
        document: {
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          mimeType: document.mimeType,
        },
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in student documents API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

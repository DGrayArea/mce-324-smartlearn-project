import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;

  if (!session || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user is a lecturer
  const lecturer = await prisma.lecturer.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!lecturer) {
    return res
      .status(403)
      .json({ message: "Access denied. Lecturer profile required." });
  }

  try {
    const { contentId } = req.body;

    if (!contentId) {
      return res.status(400).json({ message: "Content ID is required" });
    }

    // Get the content and verify access
    const content = await prisma.content.findFirst({
      where: {
        id: contentId,
        isActive: true,
      },
      include: {
        course: {
          include: {
            courseAssignments: {
              where: {
                lecturerId: lecturer.id,
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

    // Check if lecturer is assigned to this course
    const hasAccess = content.course.courseAssignments.length > 0;

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "You don't have access to this content" });
    }

    // Increment download count
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        fileName: true,
        downloadCount: true,
      },
    });

    // Return the file URL and updated download count
    console.log("Download successful:", {
      contentId,
      fileUrl: updatedContent.fileUrl,
      fileName: updatedContent.fileName,
      downloadCount: updatedContent.downloadCount,
    });

    res.status(200).json({
      success: true,
      fileUrl: updatedContent.fileUrl,
      fileName: updatedContent.fileName,
      downloadCount: updatedContent.downloadCount,
    });
  } catch (error) {
    console.error("Error tracking download:", error);
    res.status(500).json({
      message: "Error tracking download",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

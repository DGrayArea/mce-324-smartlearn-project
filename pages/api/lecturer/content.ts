import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
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

  if (req.method === "GET") {
    try {
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Verify lecturer is assigned to this course
      const courseAssignment = await prisma.courseAssignment.findFirst({
        where: {
          lecturerId: lecturer.id,
          courseId: courseId as string,
          isActive: true,
        },
      });

      if (!courseAssignment) {
        return res
          .status(403)
          .json({ message: "You are not assigned to this course" });
      }

      // Get course content
      const content = await prisma.content.findMany({
        where: {
          courseId: courseId as string,
          isActive: true,
        },
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
          updatedAt: true,
        },
        orderBy: [{ week: "asc" }, { topic: "asc" }, { uploadedAt: "desc" }],
      });

      res.status(200).json({ content });
    } catch (error: any) {
      console.error("Error fetching course content:", error);
      res
        .status(500)
        .json({ message: "Error fetching content", error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      // Configure formidable
      const form = formidable({
        uploadDir: "./tmp",
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB limit
      });

      // Parse the form data
      const [fields, files] = await form.parse(req);

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Extract form fields
      const courseId = Array.isArray(fields.courseId)
        ? fields.courseId[0]
        : fields.courseId;
      const title = Array.isArray(fields.title)
        ? fields.title[0]
        : fields.title;
      const description = Array.isArray(fields.description)
        ? fields.description[0]
        : fields.description;
      const documentType = Array.isArray(fields.documentType)
        ? fields.documentType[0]
        : fields.documentType;
      const week = Array.isArray(fields.week) ? fields.week[0] : fields.week;
      const topic = Array.isArray(fields.topic)
        ? fields.topic[0]
        : fields.topic;
      const tags = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags;

      const fileName = file.originalFilename || "unknown";
      const fileSize = file.size;
      const mimeType = file.mimetype || "application/octet-stream";

      // Generate unique filename for Cloudinary
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `course-${courseId}/${baseName}_${Date.now()}${fileExtension}`;

      if (!courseId || !title || !documentType) {
        return res.status(400).json({
          message: "Course ID, title, and document type are required",
        });
      }

      // Verify lecturer is assigned to this course
      const courseAssignment = await prisma.courseAssignment.findFirst({
        where: {
          lecturerId: lecturer.id,
          courseId: courseId,
          isActive: true,
        },
      });

      if (!courseAssignment) {
        return res
          .status(403)
          .json({ message: "You are not assigned to this course" });
      }

      // Upload to Cloudinary
      try {
        const uploadResult = await cloudinary.uploader.upload(file.filepath, {
          folder: `course-content/course-${courseId}`,
          resource_type: "auto", // Automatically detect file type
          public_id: `${baseName}_${Date.now()}`,
          overwrite: false,
          tags: [
            "course-content",
            `course-${courseId}`,
            ...(tags ? tags.split(",").map((t: string) => t.trim()) : []),
          ],
        });

        const fileUrl = uploadResult.secure_url;

        // Clean up temporary file
        fs.unlinkSync(file.filepath);

        // Create content
        const content = await prisma.content.create({
          data: {
            courseId,
            title,
            description: description || null,
            fileUrl: fileUrl,
            fileName: fileName,
            fileSize: fileSize,
            fileType: fileExtension,
            mimeType: mimeType,
            documentType: documentType as any,
            week: week ? parseInt(week) : null,
            topic: topic || null,
            tags: tags
              ? Array.isArray(tags)
                ? tags
                : tags.split(",").map((t) => t.trim())
              : [],
            isActive: true,
          },
        });

        res.status(201).json({
          message: "Content uploaded successfully",
          content,
        });
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Clean up temporary file on error
        if (fs.existsSync(file.filepath)) {
          fs.unlinkSync(file.filepath);
        }
        return res.status(500).json({
          message: "Failed to upload file to Cloudinary",
          error:
            uploadError instanceof Error
              ? uploadError.message
              : "Unknown error",
        });
      }
    } catch (error: any) {
      console.error("Error creating content:", error);
      res
        .status(500)
        .json({ message: "Error creating content", error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      // Parse JSON body for PUT requests
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      await new Promise((resolve) => {
        req.on("end", resolve);
      });

      const {
        contentId,
        title,
        description,
        fileUrl,
        fileName,
        fileSize,
        fileType,
        mimeType,
        documentType,
        week,
        topic,
        tags,
      } = JSON.parse(body);

      if (!contentId) {
        return res.status(400).json({ message: "Content ID is required" });
      }

      // Get the content and verify lecturer has access
      const existingContent = await prisma.content.findFirst({
        where: { id: contentId },
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

      if (!existingContent) {
        return res.status(404).json({ message: "Content not found" });
      }

      if (existingContent.course.courseAssignments.length === 0) {
        return res
          .status(403)
          .json({ message: "You don't have permission to edit this content" });
      }

      // Update content
      const updatedContent = await prisma.content.update({
        where: { id: contentId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(fileUrl !== undefined && { fileUrl }),
          ...(fileName !== undefined && { fileName }),
          ...(fileSize !== undefined && {
            fileSize: fileSize ? parseInt(fileSize) : null,
          }),
          ...(fileType !== undefined && { fileType }),
          ...(mimeType !== undefined && { mimeType }),
          ...(documentType && { documentType }),
          ...(week !== undefined && { week: week ? parseInt(week) : null }),
          ...(topic !== undefined && { topic }),
          ...(tags !== undefined && {
            tags: tags
              ? Array.isArray(tags)
                ? tags
                : tags.split(",").map((t) => t.trim())
              : [],
          }),
        },
      });

      res.status(200).json({
        message: "Content updated successfully",
        content: updatedContent,
      });
    } catch (error: any) {
      console.error("Error updating content:", error);
      res
        .status(500)
        .json({ message: "Error updating content", error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { contentId } = req.query;

      if (!contentId) {
        return res.status(400).json({ message: "Content ID is required" });
      }

      // Get the content and verify lecturer has access
      const existingContent = await prisma.content.findFirst({
        where: { id: contentId as string },
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

      if (!existingContent) {
        return res.status(404).json({ message: "Content not found" });
      }

      if (existingContent.course.courseAssignments.length === 0) {
        return res.status(403).json({
          message: "You don't have permission to delete this content",
        });
      }

      // Delete file from Cloudinary
      if (existingContent.fileUrl) {
        try {
          // Extract public_id from Cloudinary URL
          const url = new URL(existingContent.fileUrl);
          const pathParts = url.pathname.split("/");
          const publicId = pathParts
            .slice(-2)
            .join("/")
            .replace(/\.[^/.]+$/, ""); // Remove file extension

          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error("Cloudinary delete error:", deleteError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Soft delete content
      await prisma.content.update({
        where: { id: contentId as string },
        data: { isActive: false },
      });

      res.status(200).json({ message: "Content deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting content:", error);
      res
        .status(500)
        .json({ message: "Error deleting content", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

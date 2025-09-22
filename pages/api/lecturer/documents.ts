import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify lecturer has access to the course
  const verifyLecturerAccess = async (courseId: string) => {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
      select: {
        courseAssignments: {
          where: {
            courseId,
            isActive: true,
          },
        },
      },
    });

    return lecturer?.courseAssignments.length > 0;
  };

  try {
    if (req.method === "GET") {
      // Get documents for a course
      const { courseId } = req.query;

      if (!courseId || typeof courseId !== "string") {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const hasAccess = await verifyLecturerAccess(courseId);
      if (!hasAccess) {
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
      // Upload a new document
      const form = formidable({
        uploadDir: "./tmp",
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
      });

      const [fields, files] = await form.parse(req);

      const courseId = fields.courseId?.[0];
      const title = fields.title?.[0];
      const description = fields.description?.[0];
      const documentType = fields.documentType?.[0] || "LECTURE_NOTE";
      const week = fields.week?.[0];
      const topic = fields.topic?.[0];
      const tags =
        fields.tags?.[0]?.split(",").map((tag: string) => tag.trim()) || [];

      if (!courseId || !title || !files.file?.[0]) {
        return res.status(400).json({
          message: "Course ID, title, and file are required",
        });
      }

      const hasAccess = await verifyLecturerAccess(courseId);
      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this course" });
      }

      const file = files.file[0];
      const fileName = file.originalFilename || "unknown";
      const fileSize = file.size;
      const mimeType = file.mimetype || "application/octet-stream";

      // Generate unique filename
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `course-${courseId}/${baseName}_${Date.now()}${fileExtension}`;

      // Read file buffer
      const fileBuffer = fs.readFileSync(file.filepath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("course-documents")
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return res.status(500).json({
          message: "Failed to upload file to storage",
          error: uploadError.message,
        });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("course-documents")
        .getPublicUrl(uniqueFileName);

      const fileUrl = urlData.publicUrl;

      // Clean up temporary file
      fs.unlinkSync(file.filepath);

      // Save document info to database
      const document = await prisma.content.create({
        data: {
          courseId,
          title,
          description: description || null,
          fileUrl: fileUrl,
          fileName,
          fileSize,
          fileType: fileExtension,
          mimeType,
          documentType: documentType as any,
          week: week ? parseInt(week) : null,
          topic: topic || null,
          tags,
        },
      });

      res.status(201).json({
        message: "Document uploaded successfully",
        document,
      });
    } else if (req.method === "DELETE") {
      // Delete a document
      const { documentId } = req.query;

      if (!documentId || typeof documentId !== "string") {
        return res.status(400).json({ message: "Document ID is required" });
      }

      const document = await prisma.content.findUnique({
        where: { id: documentId },
        select: { courseId: true, fileUrl: true },
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const hasAccess = await verifyLecturerAccess(document.courseId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete file from Supabase Storage
      if (document.fileUrl) {
        // Extract file path from Supabase URL
        const url = new URL(document.fileUrl);
        const filePath = url.pathname.split("/").slice(3).join("/"); // Remove /storage/v1/object/public/course-documents/

        const { error: deleteError } = await supabase.storage
          .from("course-documents")
          .remove([filePath]);

        if (deleteError) {
          console.error("Supabase delete error:", deleteError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete from database
      await prisma.content.delete({
        where: { id: documentId },
      });

      res.status(200).json({ message: "Document deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in documents API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

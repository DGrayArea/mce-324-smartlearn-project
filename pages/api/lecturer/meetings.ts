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

      // Get virtual classes
      const meetings = await prisma.virtualClass.findMany({
        where: {
          courseId: courseId as string,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          meetingUrl: true,
          scheduledAt: true,
          duration: true,
          isRecorded: true,
          recordingUrl: true,
          maxParticipants: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { scheduledAt: "desc" },
      });

      res.status(200).json({ meetings });
    } catch (error: any) {
      console.error("Error fetching virtual meetings:", error);
      res
        .status(500)
        .json({ message: "Error fetching meetings", error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        courseId,
        title,
        description,
        meetingUrl,
        scheduledAt,
        duration,
      } = req.body;

      if (!courseId || !title || !scheduledAt) {
        return res.status(400).json({
          message: "Course ID, title, and scheduled time are required",
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

      // Validate scheduled time is in the future
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return res
          .status(400)
          .json({ message: "Meeting must be scheduled for a future time" });
      }

      // Get enrolled students for the course
      const enrolledStudents = await prisma.enrollment.findMany({
        where: {
          courseId,
          status: "APPROVED",
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      // Create virtual class
      const meeting = await prisma.virtualClass.create({
        data: {
          courseId,
          lecturerId: lecturer.id,
          title,
          description: description || null,
          meetingUrl: meetingUrl || "",
          scheduledAt: scheduledDate,
          duration: duration ? parseInt(duration) : 60, // Default 60 minutes
          isActive: true,
        },
      });

      // Send notifications to all enrolled students
      const notifications = enrolledStudents.map((enrollment) => ({
        userId: enrollment.student.userId,
        type: "VIRTUAL_CLASS" as const,
        title: "New Virtual Meeting Scheduled",
        message: `A new virtual meeting "${title}" has been scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}. ${meetingUrl ? `Join here: ${meetingUrl}` : ""}`,
        data: {
          meetingId: meeting.id,
          courseId,
          scheduledAt: scheduledDate.toISOString(),
          meetingUrl: meetingUrl || "",
        },
        isRead: false,
      }));

      // Create notifications in batch
      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }

      res.status(201).json({
        message: "Virtual meeting scheduled successfully",
        meeting,
        notificationsSent: notifications.length,
      });
    } catch (error: any) {
      console.error("Error creating virtual meeting:", error);
      res
        .status(500)
        .json({ message: "Error creating meeting", error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const {
        meetingId,
        title,
        description,
        meetingUrl,
        scheduledAt,
        duration,
        status,
      } = req.body;

      if (!meetingId) {
        return res.status(400).json({ message: "Meeting ID is required" });
      }

      // Get the meeting and verify lecturer has access
      const existingMeeting = await prisma.virtualClass.findFirst({
        where: { id: meetingId },
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

      if (!existingMeeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      if (existingMeeting.course.courseAssignments.length === 0) {
        return res
          .status(403)
          .json({ message: "You don't have permission to edit this meeting" });
      }

      // Validate scheduled time if provided
      if (scheduledAt) {
        const scheduledDate = new Date(scheduledAt);
        if (scheduledDate <= new Date()) {
          return res
            .status(400)
            .json({ message: "Meeting must be scheduled for a future time" });
        }
      }

      // Update meeting
      const updatedMeeting = await prisma.virtualClass.update({
        where: { id: meetingId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(meetingUrl !== undefined && { meetingUrl }),
          ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
          ...(duration !== undefined && { duration: parseInt(duration) }),
        },
      });

      res.status(200).json({
        message: "Meeting updated successfully",
        meeting: updatedMeeting,
      });
    } catch (error: any) {
      console.error("Error updating meeting:", error);
      res
        .status(500)
        .json({ message: "Error updating meeting", error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { meetingId } = req.query;

      if (!meetingId) {
        return res.status(400).json({ message: "Meeting ID is required" });
      }

      // Get the meeting and verify lecturer has access
      const existingMeeting = await prisma.virtualClass.findFirst({
        where: { id: meetingId as string },
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

      if (!existingMeeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      if (existingMeeting.course.courseAssignments.length === 0) {
        return res.status(403).json({
          message: "You don't have permission to delete this meeting",
        });
      }

      // Soft delete meeting
      await prisma.virtualClass.update({
        where: { id: meetingId as string },
        data: { isActive: false },
      });

      res.status(200).json({ message: "Meeting deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting meeting:", error);
      res
        .status(500)
        .json({ message: "Error deleting meeting", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

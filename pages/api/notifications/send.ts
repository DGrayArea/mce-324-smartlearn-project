import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
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

  try {
    const {
      type,
      title,
      message,
      data,
      recipientIds,
      recipientRoles,
      courseId,
      departmentId,
      schoolId,
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        message: "Type, title, and message are required",
      });
    }

    // Determine recipients based on the parameters
    let recipients: any[] = [];

    if (recipientIds && recipientIds.length > 0) {
      // Send to specific user IDs
      recipients = await prisma.user.findMany({
        where: { id: { in: recipientIds } },
        select: { id: true },
      });
    } else if (recipientRoles && recipientRoles.length > 0) {
      // Send to users with specific roles
      recipients = await prisma.user.findMany({
        where: { role: { in: recipientRoles } },
        select: { id: true },
      });
    } else if (courseId) {
      // Send to students enrolled in the course
      const enrollments = await prisma.enrollment.findMany({
        where: {
          courseId,
          status: "APPROVED",
        },
        include: {
          student: {
            select: { userId: true },
          },
        },
      });
      recipients = enrollments.map((enrollment) => ({
        id: enrollment.student.userId,
      }));
    } else if (departmentId) {
      // Send to students in the department
      const students = await prisma.student.findMany({
        where: { departmentId },
        select: { userId: true },
      });
      recipients = students.map((student) => ({ id: student.userId }));
    } else if (schoolId) {
      // Send to students in the school
      const students = await prisma.student.findMany({
        where: {
          department: {
            schoolId,
          },
        },
        select: { userId: true },
      });
      recipients = students.map((student) => ({ id: student.userId }));
    } else {
      return res.status(400).json({
        message:
          "Must specify recipients via recipientIds, recipientRoles, courseId, departmentId, or schoolId",
      });
    }

    // Create notifications for all recipients
    const notifications = recipients.map((recipient) => ({
      userId: recipient.id,
      type,
      title,
      message,
      data: data || {},
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    res.status(200).json({
      success: true,
      message: `Notifications sent to ${notifications.length} recipients`,
      recipientsCount: notifications.length,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    res.status(500).json({
      message: "Error sending notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

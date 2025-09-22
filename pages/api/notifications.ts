import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
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
    if (req.method === "GET") {
      // Get notifications for the current user
      const { page = "1", limit = "20", unreadOnly = "false" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;
      const unreadOnlyBool = unreadOnly === "true";

      // Get user's role-specific ID
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { student: true, lecturer: true }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build where clause based on user role
      const whereClause: any = {};
      if (user.student) {
        whereClause.studentId = user.student.id;
      } else if (user.lecturer) {
        whereClause.lecturerId = user.lecturer.id;
      } else {
        return res.status(403).json({ message: "User role not found" });
      }

      if (unreadOnlyBool) {
        whereClause.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      });

      const totalNotifications = await prisma.notification.count({
        where: whereClause,
      });

      // Count unread notifications
      const unreadWhereClause = { ...whereClause, isRead: false };
      const unreadCount = await prisma.notification.count({
        where: unreadWhereClause,
      });

      return res.status(200).json({
        notifications,
        unreadCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalNotifications,
          pages: Math.ceil(totalNotifications / limitNum),
        },
      });
    } else if (req.method === "PUT") {
      // Mark notifications as read
      const { notificationIds, markAllAsRead = false } = req.body;

      // Get user's role-specific ID
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { student: true, lecturer: true }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build where clause based on user role
      const userWhereClause: any = {};
      if (user.student) {
        userWhereClause.studentId = user.student.id;
      } else if (user.lecturer) {
        userWhereClause.lecturerId = user.lecturer.id;
      } else {
        return res.status(403).json({ message: "User role not found" });
      }

      if (markAllAsRead) {
        // Mark all notifications as read for the current user
        await prisma.notification.updateMany({
          where: { ...userWhereClause, isRead: false },
          data: { isRead: true },
        });

        return res
          .status(200)
          .json({ message: "All notifications marked as read" });
      } else if (notificationIds && Array.isArray(notificationIds)) {
        // Mark specific notifications as read
        await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            ...userWhereClause,
          },
          data: { isRead: true },
        });

        return res
          .status(200)
          .json({ message: "Notifications marked as read" });
      } else {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
    } else if (req.method === "DELETE") {
      // Delete notifications
      const { notificationIds, deleteAll = false } = req.body;

      // Get user's role-specific ID
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { student: true, lecturer: true }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build where clause based on user role
      const userWhereClause: any = {};
      if (user.student) {
        userWhereClause.studentId = user.student.id;
      } else if (user.lecturer) {
        userWhereClause.lecturerId = user.lecturer.id;
      } else {
        return res.status(403).json({ message: "User role not found" });
      }

      if (deleteAll) {
        // Delete all notifications for the current user
        await prisma.notification.deleteMany({
          where: userWhereClause,
        });

        return res.status(200).json({ message: "All notifications deleted" });
      } else if (notificationIds && Array.isArray(notificationIds)) {
        // Delete specific notifications
        await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            ...userWhereClause,
          },
        });

        return res.status(200).json({ message: "Notifications deleted" });
      } else {
        return res.status(400).json({ message: "Invalid request parameters" });
      }
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in notifications API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

// Helper function to create notifications
export async function createNotification(
  studentId: string | null,
  lecturerId: string | null,
  title: string,
  message: string,
  type: "DEADLINE" | "GRADE" | "ANNOUNCEMENT" | "REMINDER" | "COURSE_REGISTRATION" | "VIRTUAL_CLASS" | "SYSTEM"
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        studentId,
        lecturerId,
        title,
        message,
        type,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Helper function to create bulk notifications
export async function createBulkNotifications(
  studentIds: string[] | null,
  lecturerIds: string[] | null,
  title: string,
  message: string,
  type: "DEADLINE" | "GRADE" | "ANNOUNCEMENT" | "REMINDER" | "COURSE_REGISTRATION" | "VIRTUAL_CLASS" | "SYSTEM"
) {
  try {
    const notifications = [];
    
    // Create notifications for students
    if (studentIds && studentIds.length > 0) {
      const studentNotifications = await prisma.notification.createMany({
        data: studentIds.map((studentId) => ({
          studentId,
          lecturerId: null,
          title,
          message,
          type,
        })),
      });
      notifications.push(studentNotifications);
    }
    
    // Create notifications for lecturers
    if (lecturerIds && lecturerIds.length > 0) {
      const lecturerNotifications = await prisma.notification.createMany({
        data: lecturerIds.map((lecturerId) => ({
          studentId: null,
          lecturerId,
          title,
          message,
          type,
        })),
      });
      notifications.push(lecturerNotifications);
    }
    
    return notifications;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return null;
  }
}

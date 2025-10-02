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

  if (!session || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Notification ID is required" });
  }

  if (req.method === "PATCH") {
    try {
      const { isRead } = req.body;

      // Verify the notification belongs to the user
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Update the notification
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { isRead },
      });

      res.status(200).json({
        success: true,
        notification: updatedNotification,
      });
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({
        message: "Error updating notification",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Verify the notification belongs to the user
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Delete the notification
      await prisma.notification.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        message: "Error deleting notification",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

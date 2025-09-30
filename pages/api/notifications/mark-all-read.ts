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
    // Mark all notifications as read for the user
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} notifications marked as read`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      message: "Error marking all notifications as read",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

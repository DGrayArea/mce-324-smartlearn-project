import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;

  if (!session || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const { type, isRead } = req.query;

      // Build where clause
      let whereClause: any = {
        userId,
      };

      if (type && type !== "all") {
        whereClause.type = type;
      }
      if (isRead && isRead !== "all") {
        whereClause.isRead = isRead === "read";
      }

      // Get notifications
      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 100, // Limit to 100 most recent notifications
      });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        message: "Error fetching notifications",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

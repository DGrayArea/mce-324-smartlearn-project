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

  const { method } = req;

  switch (method) {
    case "GET":
      return handleGetUserActivity(req, res, session.user.id);
    default:
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handleGetUserActivity(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      userId: targetUserId,
      action,
      entity,
      startDate,
      endDate,
      limit = "50",
      offset = "0",
    } = req.query;

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only admins can view user activity
    if (
      !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
        user.role || ""
      )
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // Build where clause
    const where: any = {};

    if (targetUserId) {
      where.userId = targetUserId as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (entity) {
      where.entity = entity as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    // Fetch system logs with user information
    const logs = await prisma.systemLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            student: {
              select: {
                matricNumber: true,
                level: true,
                department: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
            lecturer: {
              select: {
                department: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.systemLog.count({ where });

    // Get activity statistics
    const stats = await prisma.systemLog.groupBy({
      by: ["action"],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
    });

    // Get user activity summary
    const userActivitySummary = await prisma.systemLog.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 10,
    });

    // Get user details for summary
    const userIds = userActivitySummary.map((ua) => ua.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const userActivityWithDetails = userActivitySummary.map((ua) => {
      const user = users.find((u) => u.id === ua.userId);
      return {
        ...ua,
        user,
      };
    });

    return res.status(200).json({
      logs,
      stats,
      userActivitySummary: userActivityWithDetails,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + logs.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

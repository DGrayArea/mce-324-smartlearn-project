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

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        lecturer: true,
        departmentAdmin: true,
        schoolAdmin: true,
        senateAdmin: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has access to system logs
    const hasAccess = [
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
    ].includes(currentUser.role);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.method === "GET") {
      const {
        page = "1",
        limit = "50",
        type = "all",
        startDate,
        endDate,
        userId,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause based on user role and filters
      let whereClause: any = {};

      // Date range filter
      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      // User filter
      if (userId && typeof userId === "string") {
        whereClause.userId = userId;
      }

      // Type filter
      if (type !== "all") {
        whereClause.type = type;
      }

      // Role-based access
      if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Department admins can only see logs for their department
        whereClause.user = {
          OR: [
            {
              student: {
                departmentId: currentUser.departmentAdmin.departmentId,
              },
            },
            {
              lecturer: {
                departmentId: currentUser.departmentAdmin.departmentId,
              },
            },
            {
              departmentAdmin: {
                departmentId: currentUser.departmentAdmin.departmentId,
              },
            },
          ],
        };
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // School admins can see logs for their school
        whereClause.user = {
          OR: [
            {
              student: {
                department: { schoolId: currentUser.schoolAdmin.schoolId },
              },
            },
            {
              lecturer: {
                department: { schoolId: currentUser.schoolAdmin.schoolId },
              },
            },
            {
              departmentAdmin: {
                department: { schoolId: currentUser.schoolAdmin.schoolId },
              },
            },
            { schoolAdmin: { schoolId: currentUser.schoolAdmin.schoolId } },
          ],
        };
      }
      // Senate admins can see all logs (no additional filter)

      const logs = await prisma.systemLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      });

      const totalLogs = await prisma.systemLog.count({
        where: whereClause,
      });

      // Get log statistics - simplified to avoid TypeScript issues
      const logStats = [];

      return res.status(200).json({
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalLogs,
          pages: Math.ceil(totalLogs / limitNum),
        },
        stats: logStats.reduce(
          (acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
          },
          {} as Record<string, number>
        ),
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in system logs API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

// Helper function to create system logs
export async function createSystemLog(
  userId: string,
  action: string,
  entity?: string,
  entityId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const log = await prisma.systemLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? details : null,
        ipAddress,
        userAgent,
      },
    });
    return log;
  } catch (error) {
    console.error("Error creating system log:", error);
    return null;
  }
}

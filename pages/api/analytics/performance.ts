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

    // Check if user has access to performance metrics
    const hasAccess = [
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
    ].includes(currentUser.role);

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.method === "GET") {
      const { timeRange = "24h" } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "1h":
          startDate.setHours(now.getHours() - 1);
          break;
        case "24h":
          startDate.setDate(now.getDate() - 1);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 1);
      }

      // Get system performance metrics
      const performanceMetrics = await getSystemPerformanceMetrics(
        startDate,
        now
      );

      // Get database performance metrics
      const dbMetrics = await getDatabasePerformanceMetrics(startDate, now);

      // Get API performance metrics
      const apiMetrics = await getAPIPerformanceMetrics(startDate, now);

      // Get user activity metrics
      const userActivityMetrics = await getUserActivityMetrics(startDate, now);

      return res.status(200).json({
        system: performanceMetrics,
        database: dbMetrics,
        api: apiMetrics,
        userActivity: userActivityMetrics,
        timeRange,
        generatedAt: now.toISOString(),
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getSystemPerformanceMetrics(startDate: Date, endDate: Date) {
  // Get system logs for performance analysis
  const systemLogs = await prisma.systemLog.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      action: {
        in: [
          "LOGIN",
          "LOGOUT",
          "CREATE",
          "UPDATE",
          "DELETE",
          "DOWNLOAD",
          "UPLOAD",
        ],
      },
    },
    select: {
      action: true,
      createdAt: true,
      details: true,
    },
  });

  // Calculate response times (simulated based on action types)
  const responseTimes = {
    login: 150, // ms
    logout: 50,
    create: 200,
    update: 180,
    delete: 100,
    download: 300,
    upload: 500,
  };

  // Calculate average response time
  const totalRequests = systemLogs.length;
  const avgResponseTime =
    totalRequests > 0
      ? systemLogs.reduce(
          (sum, log) =>
            sum +
            (responseTimes[log.action as keyof typeof responseTimes] || 200),
          0
        ) / totalRequests
      : 0;

  // Calculate requests per minute
  const timeDiffMinutes =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  const requestsPerMinute =
    timeDiffMinutes > 0 ? totalRequests / timeDiffMinutes : 0;

  // Calculate error rate (simulated)
  const errorRate = Math.random() * 0.05; // 0-5% error rate

  // Calculate uptime (simulated)
  const uptime = 99.9; // 99.9% uptime

  return {
    avgResponseTime: Math.round(avgResponseTime),
    requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
    totalRequests,
    errorRate: Math.round(errorRate * 10000) / 100, // percentage
    uptime,
    status: avgResponseTime < 500 && errorRate < 0.02 ? "healthy" : "warning",
  };
}

async function getDatabasePerformanceMetrics(startDate: Date, endDate: Date) {
  // Get database query statistics
  const totalQueries = await prisma.systemLog.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Calculate database performance metrics (simulated)
  const avgQueryTime = 25; // ms
  const slowQueries = Math.floor(totalQueries * 0.02); // 2% slow queries
  const connectionPool = {
    active: 8,
    idle: 12,
    max: 20,
  };

  return {
    avgQueryTime,
    totalQueries,
    slowQueries,
    connectionPool,
    status: avgQueryTime < 50 ? "healthy" : "warning",
  };
}

async function getAPIPerformanceMetrics(startDate: Date, endDate: Date) {
  // Get API endpoint statistics
  const apiLogs = await prisma.systemLog.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      action: true,
      entity: true,
      createdAt: true,
    },
  });

  // Group by endpoint
  const endpointStats = apiLogs.reduce(
    (acc, log) => {
      const endpoint = `${log.action}_${log.entity}`;
      if (!acc[endpoint]) {
        acc[endpoint] = { count: 0, avgTime: 0 };
      }
      acc[endpoint].count++;
      acc[endpoint].avgTime = Math.random() * 200 + 50; // Simulated response time
      return acc;
    },
    {} as Record<string, { count: number; avgTime: number }>
  );

  // Calculate overall API metrics
  const totalAPICalls = apiLogs.length;
  const avgAPITime =
    totalAPICalls > 0
      ? Object.values(endpointStats).reduce(
          (sum, stat) => sum + stat.avgTime,
          0
        ) / Object.keys(endpointStats).length
      : 0;

  return {
    totalAPICalls,
    avgAPITime: Math.round(avgAPITime),
    endpointStats,
    status: avgAPITime < 300 ? "healthy" : "warning",
  };
}

async function getUserActivityMetrics(startDate: Date, endDate: Date) {
  // Get user activity statistics
  const activeUsers = await prisma.userSession.count({
    where: {
      updatedAt: {
        gte: startDate,
      },
    },
  });

  const totalUsers = await prisma.user.count();
  const concurrentUsers = Math.floor(activeUsers * 0.3); // 30% concurrent

  // Get session statistics
  const sessions = await prisma.userSession.findMany({
    where: {
      updatedAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });

  const avgSessionDuration =
    sessions.length > 0
      ? sessions.reduce((sum, session) => {
          const duration =
            session.updatedAt.getTime() - session.createdAt.getTime();
          return sum + duration;
        }, 0) /
        sessions.length /
        1000 /
        60 // Convert to minutes
      : 0;

  return {
    activeUsers,
    totalUsers,
    concurrentUsers,
    avgSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // minutes
    status: concurrentUsers < 100 ? "healthy" : "warning",
  };
}

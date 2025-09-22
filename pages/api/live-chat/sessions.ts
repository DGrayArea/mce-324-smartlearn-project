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
      return handleGet(req, res, session.user.id);
    case "POST":
      return handlePost(req, res, session.user.id);
    case "PUT":
      return handlePut(req, res, session.user.id);
    case "DELETE":
      return handleDelete(req, res, session.user.id);
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { sessionId, status, limit = "20", offset = "0" } = req.query;

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If requesting a specific session
    if (sessionId) {
      const chatSession = await prisma.liveChatSession.findUnique({
        where: { sessionId: sessionId as string },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chatSession) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      // Check access permissions
      if (user.role === "STUDENT" && chatSession.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      return res.status(200).json({ session: chatSession });
    }

    // Build where clause based on user role
    const where: any = {};

    if (user.role === "STUDENT") {
      // Students can only see their own sessions
      where.userId = userId;
    } else {
      // Admins can see all sessions or sessions assigned to them
      if (status === "WAITING") {
        where.status = "WAITING";
      } else if (status === "ACTIVE") {
        where.OR = [{ agentId: userId }, { status: "ACTIVE" }];
      }
    }

    // Status filter
    if (status && status !== "WAITING" && status !== "ACTIVE") {
      where.status = status;
    }

    const sessions = await prisma.liveChatSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { lastMessageAt: "desc" },
        { startedAt: "desc" },
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.liveChatSession.count({ where });

    return res.status(200).json({
      sessions,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + sessions.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { subject, priority = "NORMAL" } = req.body;

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only students can initiate chat sessions
    if (user.role !== "STUDENT") {
      return res
        .status(403)
        .json({ message: "Only students can initiate chat sessions" });
    }

    // Check if user has an active session
    const existingSession = await prisma.liveChatSession.findFirst({
      where: {
        userId,
        status: { in: ["WAITING", "ACTIVE"] },
      },
    });

    if (existingSession) {
      return res.status(400).json({
        message: "You already have an active chat session",
        sessionId: existingSession.sessionId,
      });
    }

    // Generate unique session ID
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = await prisma.liveChatSession.create({
      data: {
        sessionId,
        userId,
        subject,
        priority,
        status: "WAITING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({ session });
  } catch (error) {
    console.error("Error creating chat session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { sessionId } = req.query;
    const { status, agentId, priority } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if session exists
    const existingSession = await prisma.liveChatSession.findUnique({
      where: { sessionId: sessionId as string },
      select: { userId: true, agentId: true },
    });

    if (!existingSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check permissions
    if (user.role === "STUDENT" && existingSession.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only admins can assign agents or change status
    if (
      ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
        user.role || ""
      )
    ) {
      const updateData: any = {};

      if (status !== undefined) {
        updateData.status = status;
        if (status === "ENDED") {
          updateData.endedAt = new Date();
        }
      }

      if (agentId !== undefined) {
        updateData.agentId = agentId;
        if (agentId && status === "WAITING") {
          updateData.status = "ACTIVE";
        }
      }

      if (priority !== undefined) {
        updateData.priority = priority;
      }

      const updatedSession = await prisma.liveChatSession.update({
        where: { sessionId: sessionId as string },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return res.status(200).json({ session: updatedSession });
    } else {
      // Students can only end their own sessions
      if (status === "ENDED" && existingSession.userId === userId) {
        const updatedSession = await prisma.liveChatSession.update({
          where: { sessionId: sessionId as string },
          data: {
            status: "ENDED",
            endedAt: new Date(),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            agent: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return res.status(200).json({ session: updatedSession });
      } else {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
    }
  } catch (error) {
    console.error("Error updating chat session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if session exists
    const existingSession = await prisma.liveChatSession.findUnique({
      where: { sessionId: sessionId as string },
      select: { userId: true, status: true },
    });

    if (!existingSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check permissions
    if (user.role === "STUDENT" && existingSession.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only admins can delete sessions
    if (
      !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
        user.role || ""
      )
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    await prisma.liveChatSession.delete({
      where: { sessionId: sessionId as string },
    });

    return res
      .status(200)
      .json({ message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

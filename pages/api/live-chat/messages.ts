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
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { sessionId, limit = "50", offset = "0" } = req.query;

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

    // Check if session exists and user has access
    const chatSession = await prisma.liveChatSession.findUnique({
      where: { sessionId: sessionId as string },
      select: { userId: true, agentId: true, status: true },
    });

    if (!chatSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check access permissions
    if (user.role === "STUDENT" && chatSession.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      user.role !== "STUDENT" &&
      chatSession.agentId !== userId &&
      chatSession.userId !== userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await prisma.liveChatMessage.findMany({
      where: { sessionId: sessionId as string },
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
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.liveChatMessage.count({
      where: { sessionId: sessionId as string },
    });

    return res.status(200).json({
      messages,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + messages.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      sessionId,
      content,
      type = "TEXT",
      fileUrl,
      fileName,
      fileSize,
    } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({
        message: "Session ID and content are required",
      });
    }

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if session exists and user has access
    const chatSession = await prisma.liveChatSession.findUnique({
      where: { sessionId: sessionId as string },
      select: { userId: true, agentId: true, status: true },
    });

    if (!chatSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check access permissions
    if (user.role === "STUDENT" && chatSession.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      user.role !== "STUDENT" &&
      chatSession.agentId !== userId &&
      chatSession.userId !== userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if session is active
    if (chatSession.status === "ENDED") {
      return res
        .status(400)
        .json({ message: "Cannot send messages to ended chat session" });
    }

    // Create message
    const message = await prisma.liveChatMessage.create({
      data: {
        sessionId: sessionId as string,
        senderId: userId,
        content,
        type,
        fileUrl,
        fileName,
        fileSize,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update session last message time
    await prisma.liveChatSession.update({
      where: { sessionId: sessionId as string },
      data: { lastMessageAt: new Date() },
    });

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error creating chat message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { messageId } = req.query;
    const { isRead } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if message exists
    const existingMessage = await prisma.liveChatMessage.findUnique({
      where: { id: messageId as string },
      select: { senderId: true, sessionId: true },
    });

    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if session exists and user has access
    const chatSession = await prisma.liveChatSession.findUnique({
      where: { sessionId: existingMessage.sessionId },
      select: { userId: true, agentId: true },
    });

    if (!chatSession) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    // Check access permissions
    if (user.role === "STUDENT" && chatSession.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      user.role !== "STUDENT" &&
      chatSession.agentId !== userId &&
      chatSession.userId !== userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update message read status
    const updateData: any = {};
    if (isRead !== undefined) {
      updateData.isRead = isRead;
      if (isRead) {
        updateData.readAt = new Date();
      }
    }

    const updatedMessage = await prisma.liveChatMessage.update({
      where: { id: messageId as string },
      data: updateData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({ message: updatedMessage });
  } catch (error) {
    console.error("Error updating chat message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

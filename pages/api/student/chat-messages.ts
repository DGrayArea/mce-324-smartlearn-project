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

  // Only allow students
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      student: true,
    },
  });

  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.student) {
    return res
      .status(403)
      .json({ message: "Forbidden: Student access required" });
  }

  const studentId = currentUser.student.id;

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res, studentId);
      case "POST":
        return handlePost(req, res, studentId, currentUser);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Chat messages error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Get messages for a chat room
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string
) {
  try {
    const { roomId } = req.query;

    if (!roomId || typeof roomId !== "string") {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // Verify student has access to this room
    if (roomId.startsWith("course-")) {
      const courseId = roomId.replace("course-", "");
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          courseId,
          isActive: true,
        },
      });

      if (!enrollment) {
        return res
          .status(403)
          .json({ message: "Access denied to this chat room" });
      }
    }

    // For now, return mock messages since we don't have a chat system in the database
    // In a real application, you would fetch from a messages table
    const mockMessages = [
      {
        id: "1",
        content:
          "Welcome to the chat! Feel free to ask questions about the course.",
        senderId: "lecturer-1",
        senderName: "Dr. Smith",
        senderRole: "LECTURER",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        courseId: roomId.startsWith("course-")
          ? roomId.replace("course-", "")
          : undefined,
      },
      {
        id: "2",
        content: "Hi everyone! Looking forward to learning with you all.",
        senderId: "student-1",
        senderName: "John Doe",
        senderRole: "STUDENT",
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        courseId: roomId.startsWith("course-")
          ? roomId.replace("course-", "")
          : undefined,
      },
      {
        id: "3",
        content: "Does anyone know when the assignment is due?",
        senderId: "student-2",
        senderName: "Jane Smith",
        senderRole: "STUDENT",
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        courseId: roomId.startsWith("course-")
          ? roomId.replace("course-", "")
          : undefined,
      },
    ];

    return res.status(200).json({
      messages: mockMessages,
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return res.status(500).json({
      message: "Failed to fetch messages",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Send a new message
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string,
  currentUser: any
) {
  try {
    const { roomId, content } = req.body;

    if (!roomId || !content) {
      return res
        .status(400)
        .json({ message: "Room ID and content are required" });
    }

    // Verify student has access to this room
    if (roomId.startsWith("course-")) {
      const courseId = roomId.replace("course-", "");
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          courseId,
          isActive: true,
        },
      });

      if (!enrollment) {
        return res
          .status(403)
          .json({ message: "Access denied to this chat room" });
      }
    }

    // For now, return a mock message since we don't have a chat system in the database
    // In a real application, you would save to a messages table
    const newMessage = {
      id: `msg-${Date.now()}`,
      content: content.trim(),
      senderId: currentUser.id,
      senderName:
        currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`,
      senderRole: currentUser.role,
      timestamp: new Date(),
      courseId: roomId.startsWith("course-")
        ? roomId.replace("course-", "")
        : undefined,
    };

    return res.status(201).json({
      message: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      message: "Failed to send message",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

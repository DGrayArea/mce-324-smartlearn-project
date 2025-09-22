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

  if (req.method === "GET") {
    try {
      // Get student's enrolled courses
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId,
          isActive: true,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              code: true,
            },
          },
        },
      });

      // Create chat rooms for enrolled courses
      const courseChatRooms = enrollments.map((enrollment) => ({
        id: `course-${enrollment.courseId}`,
        name: `${enrollment.course.code} Chat`,
        type: "COURSE" as const,
        courseId: enrollment.courseId,
        courseName: enrollment.course.title,
        memberCount: 25, // Mock data - in real app, count actual members
        lastMessage: null, // Will be populated by messages API
      }));

      // Add general chat room
      const generalChatRoom = {
        id: "general",
        name: "General Discussion",
        type: "GENERAL" as const,
        memberCount: 150, // Mock data
        lastMessage: null,
      };

      const chatRooms = [generalChatRoom, ...courseChatRooms];

      return res.status(200).json({
        chatRooms,
      });
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      return res.status(500).json({
        message: "Failed to fetch chat rooms",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

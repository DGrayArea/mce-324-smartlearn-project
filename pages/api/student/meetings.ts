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

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify user is a student
  const student = await prisma.student.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    return res
      .status(403)
      .json({ message: "Access denied. Student profile required." });
  }

  if (req.method === "GET") {
    try {
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Verify student is enrolled in this course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          courseId: courseId as string,
          isActive: true,
        },
      });

      if (!enrollment) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }

      // Get virtual classes for this course
      const meetings = await prisma.virtualClass.findMany({
        where: {
          courseId: courseId as string,
          isActive: true,
          scheduledAt: {
            gte: new Date(), // Only future meetings
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          meetingUrl: true,
          scheduledAt: true,
          duration: true,
          isRecorded: true,
          recordingUrl: true,
          maxParticipants: true,
        },
        orderBy: { scheduledAt: "asc" },
      });

      // Get course info for context
      const course = await prisma.course.findUnique({
        where: { id: courseId as string },
        select: {
          id: true,
          code: true,
          title: true,
          level: true,
          semester: true,
          department: {
            select: { name: true, code: true },
          },
        },
      });

      res.status(200).json({
        course,
        meetings,
        totalMeetings: meetings.length,
      });
    } catch (error: any) {
      console.error("Error fetching virtual meetings:", error);
      res
        .status(500)
        .json({ message: "Error fetching meetings", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

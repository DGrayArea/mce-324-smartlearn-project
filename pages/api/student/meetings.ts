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
      const { academicYear = "2024/2025", semester = "FIRST" } = req.query;

      // Get student's enrolled courses
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId,
          isActive: true,
          academicYear: academicYear as string,
          semester: semester as any,
        },
        include: {
          course: {
            include: {
              courseAssignments: {
                where: { isActive: true },
                include: {
                  lecturer: {
                    include: {
                      user: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Generate mock meetings for enrolled courses
      // In a real application, you would fetch from a meetings table
      const meetings = [];

      for (const enrollment of enrollments) {
        const course = enrollment.course;
        const lecturer = course.courseAssignments[0]?.lecturer;

        if (lecturer) {
          // Generate weekly lecture meetings
          const startDate = new Date("2024-09-01"); // Start of semester
          const endDate = new Date("2024-12-15"); // End of semester

          for (
            let d = new Date(startDate);
            d <= endDate;
            d.setDate(d.getDate() + 7)
          ) {
            const meetingDate = new Date(d);
            const startTime = new Date(meetingDate);
            startTime.setHours(10, 0, 0, 0); // 10:00 AM
            const endTime = new Date(startTime);
            endTime.setHours(11, 30, 0, 0); // 11:30 AM

            const now = new Date();
            let status: "UPCOMING" | "LIVE" | "ENDED";

            if (now < startTime) {
              status = "UPCOMING";
            } else if (now >= startTime && now <= endTime) {
              status = "LIVE";
            } else {
              status = "ENDED";
            }

            meetings.push({
              id: `meeting-${course.id}-${meetingDate.getTime()}`,
              title: `${course.code} Lecture`,
              description: `Weekly lecture for ${course.title}`,
              courseId: course.id,
              courseName: course.title,
              courseCode: course.code,
              lecturerName: lecturer.user.name,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              meetingLink: `https://zoom.us/j/123456789?pwd=${course.id}`,
              meetingId: `123456789`,
              meetingPassword: course.id.slice(-4),
              status,
              isRecurring: true,
              meetingType: "LECTURE",
            });
          }

          // Generate tutorial meetings (bi-weekly)
          for (
            let d = new Date(startDate);
            d <= endDate;
            d.setDate(d.getDate() + 14)
          ) {
            const meetingDate = new Date(d);
            const startTime = new Date(meetingDate);
            startTime.setHours(14, 0, 0, 0); // 2:00 PM
            const endTime = new Date(startTime);
            endTime.setHours(15, 0, 0, 0); // 3:00 PM

            const now = new Date();
            let status: "UPCOMING" | "LIVE" | "ENDED";

            if (now < startTime) {
              status = "UPCOMING";
            } else if (now >= startTime && now <= endTime) {
              status = "LIVE";
            } else {
              status = "ENDED";
            }

            meetings.push({
              id: `tutorial-${course.id}-${meetingDate.getTime()}`,
              title: `${course.code} Tutorial`,
              description: `Tutorial session for ${course.title}`,
              courseId: course.id,
              courseName: course.title,
              courseCode: course.code,
              lecturerName: lecturer.user.name,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              meetingLink: `https://zoom.us/j/987654321?pwd=${course.id}`,
              meetingId: `987654321`,
              meetingPassword: course.id.slice(-4),
              status,
              isRecurring: true,
              meetingType: "TUTORIAL",
            });
          }

          // Generate office hours (weekly)
          for (
            let d = new Date(startDate);
            d <= endDate;
            d.setDate(d.getDate() + 7)
          ) {
            const meetingDate = new Date(d);
            const startTime = new Date(meetingDate);
            startTime.setHours(16, 0, 0, 0); // 4:00 PM
            const endTime = new Date(startTime);
            endTime.setHours(17, 0, 0, 0); // 5:00 PM

            const now = new Date();
            let status: "UPCOMING" | "LIVE" | "ENDED";

            if (now < startTime) {
              status = "UPCOMING";
            } else if (now >= startTime && now <= endTime) {
              status = "LIVE";
            } else {
              status = "ENDED";
            }

            meetings.push({
              id: `office-${course.id}-${meetingDate.getTime()}`,
              title: `${course.code} Office Hours`,
              description: `Office hours with ${lecturer.user.name}`,
              courseId: course.id,
              courseName: course.title,
              courseCode: course.code,
              lecturerName: lecturer.user.name,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              meetingLink: `https://zoom.us/j/555666777?pwd=${course.id}`,
              meetingId: `555666777`,
              meetingPassword: course.id.slice(-4),
              status,
              isRecurring: true,
              meetingType: "OFFICE_HOURS",
            });
          }
        }
      }

      // Sort meetings by start time
      meetings.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      return res.status(200).json({
        meetings,
      });
    } catch (error) {
      console.error("Error fetching student meetings:", error);
      return res.status(500).json({
        message: "Failed to fetch meetings",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = (session?.user as any).id as string;

  const { courseId } = req.query;

  // For GET requests, courseId must be in query params
  // For POST requests, courseId can be in body (we'll check later)
  if (req.method === "GET" && (!courseId || typeof courseId !== "string")) {
    return res.status(400).json({ message: "Course ID is required" });
  }

  try {
    console.log(
      `API ${req.method} /api/course/communications - Query params:`,
      req.query
    );
    console.log(
      `API ${req.method} /api/course/communications - Body:`,
      req.body
    );

    if (req.method === "GET") {
      // Get communications for a course
      const { type, academicYear, semester } = req.query;

      const where: any = {
        courseId,
        ...(type && { type: type as any }),
        ...(academicYear && { academicYear: academicYear as string }),
        ...(semester && { semester: semester as any }),
      };

      const communications = await prisma?.courseCommunication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
              votes: {
                where: { userId: userId },
              },
              _count: {
                select: { votes: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          votes: {
            where: { userId: userId },
          },
          files: true,
          _count: {
            select: {
              votes: true,
              replies: true,
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      });

      return res.status(200).json({ communications });
    }

    if (req.method === "POST") {
      // Create new communication
      const {
        courseId: bodyCourseId,
        type,
        title,
        content,
        parentId,
        academicYear,
        semester,
      } = req.body;

      // Debug logging
      console.log("POST /api/course/communications - Request body:", req.body);
      console.log("POST /api/course/communications - Query params:", req.query);

      // Use courseId from body for POST requests, fallback to query for backward compatibility
      const courseIdToUse = bodyCourseId || courseId;

      console.log(
        "POST /api/course/communications - courseIdToUse:",
        courseIdToUse
      );

      if (!courseIdToUse || !type || !content || !academicYear || !semester) {
        console.log("POST /api/course/communications - Missing fields:", {
          courseIdToUse: !!courseIdToUse,
          type: !!type,
          content: !!content,
          academicYear: !!academicYear,
          semester: !!semester,
        });
        return res.status(400).json({
          message:
            "Missing required fields: courseId, type, content, academicYear, semester",
        });
      }

      // Debug: Log user info
      console.log("POST /api/course/communications - User info:", {
        userId: userId,
        userRole: (session?.user as any).role,
        academicYear: academicYear,
        semester: semester,
        courseIdToUse: courseIdToUse,
      });

      // Verify user has access to this course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          student: { userId: userId },
          courseId: courseIdToUse,
          isActive: true,
        },
      });

      const isLecturer = await prisma.courseAssignment.findFirst({
        where: {
          courseId: courseIdToUse,
          lecturer: { userId: userId },
          isActive: true,
          academicYear: academicYear,
          semester: semester,
        },
      });

      // Fallback: Check if lecturer is assigned to this course in any academic year/semester
      const isLecturerAnySemester = await prisma.courseAssignment.findFirst({
        where: {
          courseId: courseIdToUse,
          lecturer: { userId: userId },
          isActive: true,
        },
      });

      // Check if user is a lecturer at all
      const userLecturerRecord = await prisma.lecturer.findFirst({
        where: { userId: userId },
      });

      // Debug: Log lecturer check
      console.log("POST /api/course/communications - Lecturer check:", {
        courseId: courseIdToUse,
        userId: userId,
        isUserLecturer: !!userLecturerRecord,
        isLecturerForCourse: !!isLecturer,
        isLecturerAnySemester: !!isLecturerAnySemester,
        lecturerDetails: isLecturer
          ? {
              id: isLecturer.id,
              lecturerId: isLecturer.lecturerId,
              isActive: isLecturer.isActive,
              academicYear: isLecturer.academicYear,
              semester: isLecturer.semester,
            }
          : null,
        userLecturerRecord: userLecturerRecord
          ? {
              id: userLecturerRecord.id,
              userId: userLecturerRecord.userId,
              name: userLecturerRecord.name,
            }
          : null,
      });

      // Check if user is a departmental admin for this course's department
      const isDepartmentAdmin = await prisma.departmentAdmin.findFirst({
        where: {
          userId: userId,
          department: {
            courses: {
              some: {
                id: courseIdToUse,
              },
            },
          },
        },
      });

      // Check if user is a school admin or senate admin (they have access to all courses)
      const isSchoolOrSenateAdmin = await prisma.user.findFirst({
        where: {
          id: userId,
          role: {
            in: ["SCHOOL_ADMIN", "SENATE_ADMIN"],
          },
        },
      });

      // Debug: Log authorization results
      console.log("POST /api/course/communications - Authorization check:", {
        hasEnrollment: !!enrollment,
        isLecturer: !!isLecturer,
        isLecturerAnySemester: !!isLecturerAnySemester,
        isDepartmentAdmin: !!isDepartmentAdmin,
        isSchoolOrSenateAdmin: !!isSchoolOrSenateAdmin,
        courseId: courseIdToUse,
      });

      if (
        !enrollment &&
        !isLecturer &&
        !isLecturerAnySemester &&
        !isDepartmentAdmin &&
        !isSchoolOrSenateAdmin
      ) {
        console.log(
          "POST /api/course/communications - Access denied for user:",
          userId
        );
        return res.status(403).json({
          message: "You don't have access to this course",
        });
      }

      const communication = await prisma.courseCommunication.create({
        data: {
          courseId: courseIdToUse,
          userId: userId,
          type,
          title: title || null,
          content,
          parentId: parentId || null,
          academicYear,
          semester,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          files: true,
        },
      });

      return res.status(201).json({ communication });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error: any) {
    console.error("Course communications error:", error);
    return res.status(500).json({
      message: "Error processing request",
      error: error?.message,
    });
  }
}

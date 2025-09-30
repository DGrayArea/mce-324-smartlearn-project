import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    const userId = (session?.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get lecturer profile
    const lecturer = await prisma.lecturer.findFirst({
      where: { userId },
      select: {
        id: true,
        name: true,
        department: {
          select: { name: true, code: true },
        },
      },
    });

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer profile not found" });
    }

    console.log("Found lecturer:", lecturer.id, lecturer.name);

    // Get courses assigned to this lecturer
    const courseAssignments = await prisma.courseAssignment.findMany({
      where: {
        lecturerId: lecturer.id,
        isActive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            creditUnit: true,
            description: true,
            level: true,
            semester: true,
            department: {
              select: { name: true, code: true },
            },
          },
        },
      },
      orderBy: [
        { academicYear: "desc" },
        { semester: "asc" },
        { createdAt: "desc" },
      ],
    });

    console.log("Found course assignments:", courseAssignments.length);
    console.log(
      "Course assignments:",
      courseAssignments.map((ca) => ({
        course: ca.course.title,
        level: ca.course.level,
        semester: ca.course.semester,
        academicYear: ca.academicYear,
        isActive: ca.isActive,
      }))
    );

    // Get student enrollments for these courses
    const courseIds = courseAssignments.map((ca) => ca.course.id);
    const enrollments =
      courseIds.length > 0
        ? await prisma.enrollment.findMany({
            where: {
              courseId: { in: courseIds },
              isActive: true,
            },
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
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
              course: {
                select: {
                  id: true,
                  title: true,
                  department: {
                    select: {
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          })
        : [];

    // Group enrollments by course
    const enrollmentsByCourse = enrollments.reduce(
      (acc, enrollment) => {
        if (!acc[enrollment.courseId]) {
          acc[enrollment.courseId] = [];
        }
        acc[enrollment.courseId].push(enrollment);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Get course content (notes, videos, quizzes)
    const courseContent =
      courseIds.length > 0
        ? await prisma.content.findMany({
            where: {
              courseId: { in: courseIds },
              isActive: true,
            },
            select: {
              id: true,
              title: true,
              description: true,
              documentType: true,
              week: true,
              topic: true,
              tags: true,
              downloadCount: true,
              uploadedAt: true,
              courseId: true,
            },
            orderBy: { uploadedAt: "desc" },
          })
        : [];

    // Group content by course
    const contentByCourse = courseContent.reduce(
      (acc, content) => {
        if (!acc[content.courseId]) {
          acc[content.courseId] = [];
        }
        acc[content.courseId].push(content);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Get virtual classes for these courses
    const virtualClasses =
      courseIds.length > 0
        ? await prisma.virtualClass.findMany({
            where: {
              courseId: { in: courseIds },
              isActive: true,
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
              courseId: true,
            },
            orderBy: { scheduledAt: "desc" },
          })
        : [];

    // Group virtual classes by course
    const classesByCourse = virtualClasses.reduce(
      (acc, virtualClass) => {
        if (!acc[virtualClass.courseId]) {
          acc[virtualClass.courseId] = [];
        }
        acc[virtualClass.courseId].push(virtualClass);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Transform data for frontend
    const courses = courseAssignments.map((assignment) => ({
      id: assignment.course.id,
      code: assignment.course.code,
      title: assignment.course.title,
      creditUnit: assignment.course.creditUnit,
      description: assignment.course.description,
      level: assignment.course.level,
      semester: assignment.course.semester,
      department: assignment.course.department,
      studentCount: enrollmentsByCourse[assignment.course.id]?.length || 0,
      students: enrollmentsByCourse[assignment.course.id] || [],
      content: contentByCourse[assignment.course.id] || [],
      meetings: classesByCourse[assignment.course.id] || [],
      assignedAt: assignment.createdAt,
      academicYear: assignment.academicYear,
    }));

    res.status(200).json({
      lecturer,
      courses,
      totalCourses: courses.length,
      totalStudents: enrollments.length,
      totalContent: courseContent.length,
      totalMeetings: virtualClasses.length,
    });
  } catch (error: any) {
    console.error("Error fetching lecturer courses:", error);
    res.status(500).json({
      message: "Error fetching courses",
      error: error.message,
    });
  }
}

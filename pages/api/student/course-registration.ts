import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Only allow students
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      student: {
        include: {
          department: {
            include: {
              school: true,
            },
          },
        },
      },
    },
  });

  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.student) {
    return res
      .status(403)
      .json({ message: "Forbidden: Student access required" });
  }

  const studentId = currentUser.student.id;
  const departmentId = currentUser.student.departmentId;
  const studentLevel = currentUser.student.level;

  try {
    switch (req.method) {
      case "GET":
        return handleGet(
          req,
          res,
          departmentId,
          studentLevel,
          studentId,
          currentUser
        );
      case "POST":
        return handlePost(req, res, studentId);
      case "DELETE":
        return handleDelete(req, res, studentId);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Student course registration error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Get available courses for student registration
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  studentLevel: string,
  studentId: string,
  currentUser: any
) {
  try {
    // Get courses selected by department admin
    const departmentCourses = await prisma.departmentCourse.findMany({
      where: { departmentId },
      include: {
        course: {
          include: {
            department: {
              select: { name: true, code: true },
            },
            school: {
              select: { name: true, code: true },
            },
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    // Get student's current enrollments
    const currentEnrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
      },
    });

    const enrolledCourseIds = currentEnrollments.map(
      (enrollment) => enrollment.courseId
    );

    // Filter courses based on student level and enrollment status
    const availableCourses = departmentCourses
      .filter((dc) => {
        const course = dc.course;
        // Only show courses for student's level or lower
        const levelOrder = [
          "LEVEL_100",
          "LEVEL_200",
          "LEVEL_300",
          "LEVEL_400",
          "LEVEL_500",
        ];
        const studentLevelIndex = levelOrder.indexOf(studentLevel);
        const courseLevelIndex = levelOrder.indexOf(course.level);

        return (
          courseLevelIndex <= studentLevelIndex &&
          !enrolledCourseIds.includes(course.id)
        );
      })
      .map((dc) => ({
        ...dc.course,
        isRequired: dc.isRequired,
        selectedAt: dc.createdAt,
        category: dc.isRequired ? "required" : "elective",
      }));

    // Separate required and elective courses
    const requiredCourses = availableCourses.filter(
      (course) => course.isRequired
    );
    const electiveCourses = availableCourses.filter(
      (course) => !course.isRequired
    );

    return res.status(200).json({
      availableCourses,
      requiredCourses,
      electiveCourses,
      currentEnrollments: currentEnrollments.map((enrollment) => ({
        id: enrollment.id,
        courseId: enrollment.courseId,
        course: enrollment.course,
        enrolledAt: enrollment.enrolledAt,
        isActive: enrollment.isActive,
      })),
      student: {
        level: studentLevel,
        department: currentUser.student.department,
      },
    });
  } catch (error) {
    console.error("Get student courses error:", error);
    return res.status(500).json({
      message: "Failed to fetch student courses",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Register for a course
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string
) {
  try {
    const {
      courseId,
      academicYear = "2024/2025",
      semester = "FIRST",
    } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || !course.isActive) {
      return res.status(404).json({
        message: "Course not found or inactive",
      });
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        academicYear,
        semester,
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message:
          "You are already enrolled in this course for this academic period",
      });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        academicYear,
        semester,
      },
      include: {
        course: {
          include: {
            department: {
              select: { name: true, code: true },
            },
            school: {
              select: { name: true, code: true },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    console.error("Course registration error:", error);
    return res.status(500).json({
      message: "Failed to register for course",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Drop a course
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string
) {
  try {
    const { enrollmentId } = req.query;

    if (!enrollmentId || typeof enrollmentId !== "string") {
      return res.status(400).json({
        message: "Enrollment ID is required",
      });
    }

    // Check if enrollment exists and belongs to student
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId,
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        message: "Enrollment not found",
      });
    }

    // Delete enrollment
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    return res.status(200).json({
      message: "Successfully dropped course",
    });
  } catch (error) {
    console.error("Drop course error:", error);
    return res.status(500).json({
      message: "Failed to drop course",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

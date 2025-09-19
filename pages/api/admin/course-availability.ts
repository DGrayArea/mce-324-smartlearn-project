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

  // Get user with department admin profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { departmentAdmin: true },
  });

  if (!user?.departmentAdmin) {
    return res.status(403).json({
      message: "Only department admins can manage course availability",
    });
  }

  const departmentId = user.departmentAdmin.departmentId;

  switch (req.method) {
    case "GET":
      return handleGet(req, res, departmentId);
    case "POST":
      return handlePost(req, res, departmentId, user.departmentAdmin.id);
    case "PUT":
      return handlePut(req, res, departmentId, user.departmentAdmin.id);
    case "DELETE":
      return handleDelete(req, res, departmentId);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all courses and their availability status for the department
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    // Get all active courses
    const allCourses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        department: {
          select: { name: true, code: true },
        },
        school: {
          select: { name: true, code: true },
        },
        _count: {
          select: {
            enrollments: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ type: "asc" }, { level: "asc" }, { code: "asc" }],
    });

    // Get current availability configuration
    const availabilityConfig = await prisma.courseAvailability.findMany({
      where: { departmentId },
      include: {
        course: true,
      },
    });

    const availabilityMap = new Map();
    availabilityConfig.forEach((config) => {
      availabilityMap.set(config.courseId, config);
    });

    // Combine courses with their availability status
    const coursesWithAvailability = allCourses.map((course) => {
      const config = availabilityMap.get(course.id);
      return {
        id: course.id,
        title: course.title,
        code: course.code,
        creditUnit: course.creditUnit,
        description: course.description,
        type: course.type,
        level: course.level,
        semester: course.semester,
        department: course.department,
        school: course.school,
        enrolledCount: course._count.enrollments,
        isAvailable: config?.isAvailable || false,
        isRecommended: config?.isRecommended || false,
        priority: config?.priority || 50,
        notes: config?.notes || null,
        configuredAt: config?.createdAt || null,
      };
    });

    return res.status(200).json({
      courses: coursesWithAvailability,
      departmentId,
    });
  } catch (error) {
    console.error("Error fetching course availability:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Create or update course availability
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { courseId, isAvailable, isRecommended, priority, notes } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Upsert course availability
    const courseAvailability = await prisma.courseAvailability.upsert({
      where: {
        departmentId_courseId: {
          departmentId,
          courseId,
        },
      },
      update: {
        isAvailable: isAvailable ?? true,
        isRecommended: isRecommended ?? false,
        priority: priority ?? 50,
        notes: notes || null,
        configuredBy: adminId,
        updatedAt: new Date(),
      },
      create: {
        departmentId,
        courseId,
        isAvailable: isAvailable ?? true,
        isRecommended: isRecommended ?? false,
        priority: priority ?? 50,
        notes: notes || null,
        configuredBy: adminId,
      },
    });

    return res.status(200).json({
      message: "Course availability updated successfully",
      courseAvailability,
    });
  } catch (error) {
    console.error("Error updating course availability:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Bulk update course availability
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses)) {
      return res.status(400).json({ message: "Courses must be an array" });
    }

    // Process each course update
    const updates = courses.map((courseData) =>
      prisma.courseAvailability.upsert({
        where: {
          departmentId_courseId: {
            departmentId,
            courseId: courseData.courseId,
          },
        },
        update: {
          isAvailable: courseData.isAvailable ?? true,
          isRecommended: courseData.isRecommended ?? false,
          priority: courseData.priority ?? 50,
          notes: courseData.notes || null,
          configuredBy: adminId,
          updatedAt: new Date(),
        },
        create: {
          departmentId,
          courseId: courseData.courseId,
          isAvailable: courseData.isAvailable ?? true,
          isRecommended: courseData.isRecommended ?? false,
          priority: courseData.priority ?? 50,
          notes: courseData.notes || null,
          configuredBy: adminId,
        },
      })
    );

    await Promise.all(updates);

    return res.status(200).json({
      message: "Course availability updated successfully",
      updatedCount: courses.length,
    });
  } catch (error) {
    console.error("Error bulk updating course availability:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Remove course availability (make it unavailable)
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({ message: "Course ID is required" });
    }

    await prisma.courseAvailability.delete({
      where: {
        departmentId_courseId: {
          departmentId,
          courseId,
        },
      },
    });

    return res.status(200).json({
      message: "Course availability removed successfully",
    });
  } catch (error) {
    console.error("Error removing course availability:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

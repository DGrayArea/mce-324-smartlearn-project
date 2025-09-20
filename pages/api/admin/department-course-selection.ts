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

  // Only allow department admins
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      departmentAdmin: {
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

  if (
    !currentUser ||
    currentUser.role !== "DEPARTMENT_ADMIN" ||
    !currentUser.departmentAdmin
  ) {
    return res
      .status(403)
      .json({ message: "Forbidden: Department Admin access required" });
  }

  const departmentId = currentUser.departmentAdmin.departmentId;

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res, departmentId, currentUser);
      case "POST":
        return handlePost(
          req,
          res,
          departmentId,
          currentUser.departmentAdmin.id
        );
      case "DELETE":
        return handleDelete(req, res, departmentId);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Department course selection error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Get all available courses and department's selected courses
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  currentUser: any
) {
  try {
    // Get all active courses created by Senate/School admins
    const allCourses = await prisma.course.findMany({
      where: {
        isActive: true,
        // Only show courses for levels 100L-500L
        level: {
          in: ["LEVEL_100", "LEVEL_200", "LEVEL_300", "LEVEL_400", "LEVEL_500"],
        },
      },
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
      orderBy: [{ level: "asc" }, { code: "asc" }],
    });

    // Get department's selected courses
    const selectedCourses = await prisma.departmentCourse.findMany({
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

    // Mark which courses are selected
    const coursesWithSelection = allCourses.map((course) => ({
      ...course,
      isSelected: selectedCourses.some((sc) => sc.courseId === course.id),
      isRequired:
        selectedCourses.find((sc) => sc.courseId === course.id)?.isRequired ||
        false,
      selectedAt: selectedCourses.find((sc) => sc.courseId === course.id)
        ?.createdAt,
    }));

    return res.status(200).json({
      allCourses: coursesWithSelection,
      selectedCourses: selectedCourses.map((sc) => ({
        id: sc.id,
        courseId: sc.courseId,
        isRequired: sc.isRequired,
        selectedAt: sc.createdAt,
        course: sc.course,
      })),

      department: currentUser.departmentAdmin.department,
    });
  } catch (error) {
    console.error("Get department courses error:", error);
    return res.status(500).json({
      message: "Failed to fetch department courses",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Add course to department selection
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { courseId, isRequired = false } = req.body;

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

    // Check if course is already selected
    const existingSelection = await prisma.departmentCourse.findUnique({
      where: {
        departmentId_courseId: {
          departmentId,
          courseId,
        },
      },
    });

    if (existingSelection) {
      return res.status(409).json({
        message: "Course is already selected for this department",
      });
    }

    // Add course to department
    const departmentCourse = await prisma.departmentCourse.create({
      data: {
        departmentId,
        courseId,
        isRequired,
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
      message: "Course added to department successfully",
      departmentCourse,
    });
  } catch (error) {
    console.error("Add department course error:", error);
    return res.status(500).json({
      message: "Failed to add course to department",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Remove course from department selection
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Check if course selection exists
    const departmentCourse = await prisma.departmentCourse.findUnique({
      where: {
        departmentId_courseId: {
          departmentId,
          courseId,
        },
      },
    });

    if (!departmentCourse) {
      return res.status(404).json({
        message: "Course selection not found",
      });
    }

    // Remove course from department
    await prisma.departmentCourse.delete({
      where: {
        departmentId_courseId: {
          departmentId,
          courseId,
        },
      },
    });

    return res.status(200).json({
      message: "Course removed from department successfully",
    });
  } catch (error) {
    console.error("Remove department course error:", error);
    return res.status(500).json({
      message: "Failed to remove course from department",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

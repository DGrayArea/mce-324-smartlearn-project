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
        return handlePost(req, res, departmentId, currentUser);
      case "DELETE":
        return handleDelete(req, res, departmentId);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Lecturer assignment error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Get lecturers in department and their assignments
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  currentUser: any
) {
  try {
    // Get all lecturers in the department
    const lecturers = await prisma.lecturer.findMany({
      where: { departmentId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        department: {
          select: { name: true, code: true },
        },
      },
    });

    // Get courses selected by the department
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
          },
        },
      },
    });

    // Get current course assignments for courses in this department
    const courseAssignments = await prisma.courseAssignment.findMany({
      where: {
        lecturer: {
          departmentId,
        },
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
        lecturer: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            department: {
              select: { name: true, code: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      lecturers,
      departmentCourses,
      courseAssignments,
      department: currentUser.departmentAdmin.department,
    });
  } catch (error) {
    console.error("Get lecturer assignments error:", error);
    return res.status(500).json({
      message: "Failed to fetch lecturer assignments",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Assign lecturer to course
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  currentUser: any
) {
  try {
    const {
      courseId,
      lecturerId,
      academicYear = "2024/2025",
      semester = "FIRST",
    } = req.body;

    if (!courseId || !lecturerId) {
      return res.status(400).json({
        message: "Course ID and Lecturer ID are required",
      });
    }

    // Verify the course belongs to the department
    const departmentCourse = await prisma.departmentCourse.findUnique({
      where: {
        departmentId_courseId: {
          departmentId,
          courseId,
        },
      },
    });

    if (!departmentCourse) {
      return res.status(403).json({
        message: "Course is not available in your department",
      });
    }

    // Verify the lecturer belongs to the department
    const lecturer = await prisma.lecturer.findFirst({
      where: {
        id: lecturerId,
        departmentId,
      },
    });

    if (!lecturer) {
      return res.status(403).json({
        message: "Lecturer is not in your department",
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.courseAssignment.findFirst({
      where: {
        courseId,
        lecturerId,
        academicYear,
        semester,
      },
    });

    if (existingAssignment) {
      return res.status(409).json({
        message: "Lecturer is already assigned to this course for this period",
      });
    }

    // Create the assignment
    const assignment = await prisma.courseAssignment.create({
      data: {
        courseId,
        lecturerId,
        departmentAdminId: currentUser.departmentAdmin.id,
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
        lecturer: {
          include: {
            user: {
              select: { name: true, email: true },
            },
            department: {
              select: { name: true, code: true },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Lecturer assigned to course successfully",
      assignment,
    });
  } catch (error) {
    console.error("Assign lecturer error:", error);
    return res.status(500).json({
      message: "Failed to assign lecturer to course",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Remove lecturer assignment
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    const { assignmentId } = req.query;

    if (!assignmentId || typeof assignmentId !== "string") {
      return res.status(400).json({
        message: "Assignment ID is required",
      });
    }

    // Verify the assignment belongs to a lecturer in the department
    const assignment = await prisma.courseAssignment.findFirst({
      where: {
        id: assignmentId,
        lecturer: {
          departmentId,
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        message:
          "Assignment not found or you don't have permission to modify it",
      });
    }

    // Delete the assignment
    await prisma.courseAssignment.delete({
      where: { id: assignmentId },
    });

    return res.status(200).json({
      message: "Lecturer assignment removed successfully",
    });
  } catch (error) {
    console.error("Remove lecturer assignment error:", error);
    return res.status(500).json({
      message: "Failed to remove lecturer assignment",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

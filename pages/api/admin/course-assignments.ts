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
      message: "Only department admins can manage course assignments",
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

// Get all lecturers, courses, and current assignments for the department
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    const { academicYear, semester } = req.query;

    // Get all lecturers in the department
    const lecturers = await prisma.lecturer.findMany({
      where: { departmentId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get all courses available for assignment (from department or general)
    const courses = await prisma.course.findMany({
      where: {
        isActive: true,
        OR: [{ departmentId }, { type: "GENERAL" }],
      },
      include: {
        department: {
          select: { name: true, code: true },
        },
        school: {
          select: { name: true, code: true },
        },
      },
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });

    // Get current course assignments for the academic period
    const currentAssignments = await prisma.courseAssignment.findMany({
      where: {
        departmentAdmin: { departmentId },
        academicYear: (academicYear as string) || "2024/2025",
        semester: (semester as any) || "FIRST",
        isActive: true,
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
        lecturer: {
          select: { id: true, name: true },
        },
      },
    });

    // Create a map of current assignments for easy lookup
    const assignmentMap = new Map();
    currentAssignments.forEach((assignment) => {
      const key = `${assignment.courseId}-${assignment.lecturerId}`;
      assignmentMap.set(key, assignment);
    });

    return res.status(200).json({
      lecturers: lecturers.map((lecturer) => ({
        id: lecturer.id,
        name: lecturer.name,
        email: lecturer.user.email,
        userId: lecturer.userId,
      })),
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
        creditUnit: course.creditUnit,
        type: course.type,
        level: course.level,
        semester: course.semester,
        department: course.department,
        school: course.school,
      })),
      assignments: currentAssignments.map((assignment) => ({
        id: assignment.id,
        courseId: assignment.courseId,
        lecturerId: assignment.lecturerId,
        academicYear: assignment.academicYear,
        semester: assignment.semester,
        isActive: assignment.isActive,
        assignedAt: assignment.createdAt,
        course: assignment.course,
        lecturer: assignment.lecturer,
      })),
    });
  } catch (error) {
    console.error("Error fetching course assignments:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Create a new course assignment
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { courseId, lecturerId, academicYear, semester } = req.body;

    if (!courseId || !lecturerId || !academicYear || !semester) {
      return res.status(400).json({
        message:
          "Missing required fields: courseId, lecturerId, academicYear, semester",
      });
    }

    // Verify lecturer is in the same department
    const lecturer = await prisma.lecturer.findFirst({
      where: {
        id: lecturerId,
        departmentId,
      },
    });

    if (!lecturer) {
      return res.status(403).json({
        message: "Lecturer not found in your department",
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.courseAssignment.findUnique({
      where: {
        courseId_lecturerId_academicYear_semester: {
          courseId,
          lecturerId,
          academicYear,
          semester,
        },
      },
    });

    if (existingAssignment) {
      return res.status(409).json({
        message:
          "Course assignment already exists for this lecturer and period",
      });
    }

    // Create the assignment
    const assignment = await prisma.courseAssignment.create({
      data: {
        courseId,
        lecturerId,
        departmentAdminId: adminId,
        academicYear,
        semester,
        isActive: true,
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
        lecturer: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json({
      message: "Course assignment created successfully",
      assignment: {
        id: assignment.id,
        courseId: assignment.courseId,
        lecturerId: assignment.lecturerId,
        academicYear: assignment.academicYear,
        semester: assignment.semester,
        isActive: assignment.isActive,
        assignedAt: assignment.createdAt,
        course: assignment.course,
        lecturer: assignment.lecturer,
      },
    });
  } catch (error) {
    console.error("Error creating course assignment:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Update course assignment (activate/deactivate)
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { assignmentId, isActive } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        message: "Assignment ID is required",
      });
    }

    // Verify the assignment belongs to this department admin
    const assignment = await prisma.courseAssignment.findFirst({
      where: {
        id: assignmentId,
        departmentAdminId: adminId,
      },
    });

    if (!assignment) {
      return res.status(404).json({
        message:
          "Assignment not found or you don't have permission to modify it",
      });
    }

    // Update the assignment
    const updatedAssignment = await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
        lecturer: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(200).json({
      message: "Course assignment updated successfully",
      assignment: {
        id: updatedAssignment.id,
        courseId: updatedAssignment.courseId,
        lecturerId: updatedAssignment.lecturerId,
        academicYear: updatedAssignment.academicYear,
        semester: updatedAssignment.semester,
        isActive: updatedAssignment.isActive,
        assignedAt: updatedAssignment.createdAt,
        course: updatedAssignment.course,
        lecturer: updatedAssignment.lecturer,
      },
    });
  } catch (error) {
    console.error("Error updating course assignment:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Delete course assignment
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

    // Verify the assignment belongs to this department
    const assignment = await prisma.courseAssignment.findFirst({
      where: {
        id: assignmentId,
        departmentAdmin: { departmentId },
      },
    });

    if (!assignment) {
      return res.status(404).json({
        message:
          "Assignment not found or you don't have permission to delete it",
      });
    }

    await prisma.courseAssignment.delete({
      where: { id: assignmentId },
    });

    return res.status(200).json({
      message: "Course assignment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course assignment:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

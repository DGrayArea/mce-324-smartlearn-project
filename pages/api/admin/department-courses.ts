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
    include: {
      departmentAdmin: {
        include: {
          department: true,
        },
      },
    },
  });

  // Check if user is a department admin
  if (!user?.departmentAdmin) {
    return res.status(403).json({
      message: "Only department admins can manage department courses",
    });
  }

  const departmentId = user.departmentAdmin.departmentId;

  switch (req.method) {
    case "GET":
      return handleGet(req, res, departmentId);
    case "POST":
      return handlePost(req, res, departmentId, user.departmentAdmin.id);
    case "DELETE":
      return handleDelete(req, res, departmentId);
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get all available courses and department's selected courses
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string
) {
  try {
    // Get all active courses (created by Senate/School admins)
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

    // Get department's selected courses (explicitly selected by admin)
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
              select: {
                enrollments: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
      orderBy: { course: { level: "asc" } },
    });

    // Get courses that belong to this department by default (created under this department)
    const departmentOwnCourses = await prisma.course.findMany({
      where: {
        isActive: true,
        departmentId: departmentId,
      },
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
      orderBy: [{ level: "asc" }, { code: "asc" }],
    });

    // Get department's lecturers for assignment
    const lecturers = await prisma.lecturer.findMany({
      where: { departmentId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            courseAssignments: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get current course assignments
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        lecturer: { departmentId },
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

    // Combine department's own courses with explicitly selected courses
    const allSelectedCourseIds = new Set([
      ...departmentOwnCourses.map((c) => c.id),
      ...departmentCourses.map((dc) => dc.courseId),
    ]);

    // Create a map of explicitly selected courses for easy lookup
    const selectedCoursesMap = new Map();
    departmentCourses.forEach((dc) => {
      selectedCoursesMap.set(dc.courseId, dc);
    });

    // Transform department's own courses to match the expected format
    const departmentOwnCoursesFormatted = departmentOwnCourses.map(
      (course) => ({
        id: `own-${course.id}`, // Use a different ID to distinguish from explicitly selected
        courseId: course.id,
        isRequired: true, // Department's own courses are required by default
        level: course.level,
        course: {
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
          studentCount: course._count.enrollments,
        },
      })
    );

    // Transform explicitly selected courses
    const selectedCoursesFormatted = departmentCourses.map((dc) => ({
      id: dc.id,
      courseId: dc.courseId,
      isRequired: dc.isRequired,
      level: dc.course.level,
      course: {
        id: dc.course.id,
        title: dc.course.title,
        code: dc.course.code,
        creditUnit: dc.course.creditUnit,
        description: dc.course.description,
        type: dc.course.type,
        level: dc.course.level,
        semester: dc.course.semester,
        department: dc.course.department,
        school: dc.course.school,
        studentCount: dc.course._count.enrollments,
      },
    }));

    // Combine all selected courses (own + explicitly selected)
    const allSelectedCourses = [
      ...departmentOwnCoursesFormatted,
      ...selectedCoursesFormatted,
    ];

    return res.status(200).json({
      allCourses: allCourses.map((course) => ({
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
        studentCount: course._count.enrollments,
        isSelected: allSelectedCourseIds.has(course.id),
        isOwnCourse: course.departmentId === departmentId, // Mark if it's the department's own course
      })),
      selectedCourses: allSelectedCourses,
      lecturers,
      assignments,
    });
  } catch (error) {
    console.error("Error fetching department courses:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Add or update department course selection
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  adminId: string
) {
  try {
    const { courseId, isRequired, level } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Check if course exists and is active
    const course = await prisma.course.findFirst({
      where: { id: courseId, isActive: true },
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found or inactive",
      });
    }

    // Check if already selected
    const existingSelection = await prisma.departmentCourse.findUnique({
      where: {
        departmentId_courseId: {
          departmentId,
          courseId,
        },
      },
    });

    if (existingSelection) {
      // Update existing selection
      const updated = await prisma.departmentCourse.update({
        where: { id: existingSelection.id },
        data: {
          isRequired: isRequired ?? existingSelection.isRequired,
        },
        include: {
          course: {
            include: {
              department: { select: { name: true, code: true } },
              school: { select: { name: true, code: true } },
            },
          },
        },
      });

      return res.status(200).json({
        message: "Department course updated successfully",
        departmentCourse: updated,
      });
    } else {
      // Create new selection
      const newSelection = await prisma.departmentCourse.create({
        data: {
          departmentId,
          courseId,
          isRequired: isRequired ?? false,
        },
        include: {
          course: {
            include: {
              department: { select: { name: true, code: true } },
              school: { select: { name: true, code: true } },
            },
          },
        },
      });

      return res.status(201).json({
        message: "Course added to department successfully",
        departmentCourse: newSelection,
      });
    }
  } catch (error) {
    console.error("Error managing department course:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Remove course from department
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

    // Check if department course exists
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
        message: "Course not found in department",
      });
    }

    // Check if there are active enrollments
    const activeEnrollments = await prisma.enrollment.count({
      where: {
        courseId,
        isActive: true,
        student: {
          departmentId,
        },
      },
    });

    if (activeEnrollments > 0) {
      return res.status(409).json({
        message: "Cannot remove course with active student enrollments",
      });
    }

    // Remove the department course
    await prisma.departmentCourse.delete({
      where: { id: departmentCourse.id },
    });

    return res.status(200).json({
      message: "Course removed from department successfully",
    });
  } catch (error) {
    console.error("Error removing department course:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

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

  // Get user with admin profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      departmentAdmin: true,
      schoolAdmin: true,
      senateAdmin: true,
    },
  });

  // Check if user has admin privileges
  if (!user?.departmentAdmin && !user?.schoolAdmin && !user?.senateAdmin) {
    return res.status(403).json({
      message: "Only admins can manage courses",
    });
  }

  // Determine admin level and permissions
  const isSenateAdmin = !!user.senateAdmin;
  const isSchoolAdmin = !!user.schoolAdmin;
  const isDepartmentAdmin = !!user.departmentAdmin;

  switch (req.method) {
    case "GET":
      return handleGet(req, res, user, {
        isSenateAdmin,
        isSchoolAdmin,
        isDepartmentAdmin,
      });
    case "POST":
      return handlePost(req, res, user, {
        isSenateAdmin,
        isSchoolAdmin,
        isDepartmentAdmin,
      });
    case "PUT":
      return handlePut(req, res, user, {
        isSenateAdmin,
        isSchoolAdmin,
        isDepartmentAdmin,
      });
    case "DELETE":
      return handleDelete(req, res, user, {
        isSenateAdmin,
        isSchoolAdmin,
        isDepartmentAdmin,
      });
    default:
      return res.status(405).json({ message: "Method not allowed" });
  }
}

// Get courses based on admin level
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  permissions: any
) {
  try {
    let whereClause: any = { isActive: true };

    // Department Admin: Can only see courses from their department
    if (permissions.isDepartmentAdmin) {
      whereClause.departmentId = user.departmentAdmin.departmentId;
    }
    // School Admin: Can see courses from their school
    else if (permissions.isSchoolAdmin) {
      whereClause.schoolId = user.schoolAdmin.schoolId;
    }
    // Senate Admin: Can see all courses

    const courses = await prisma.course.findMany({
      where: whereClause,
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

    // Get departments and schools for dropdowns
    let departments = [];
    let schools = [];

    if (permissions.isDepartmentAdmin) {
      departments = await prisma.department.findMany({
        where: { id: user.departmentAdmin.departmentId },
        select: { id: true, name: true, code: true },
      });
      schools = await prisma.school.findMany({
        where: {
          departments: {
            some: { id: user.departmentAdmin.departmentId },
          },
        },
        select: { id: true, name: true, code: true },
      });
    } else if (permissions.isSchoolAdmin) {
      departments = await prisma.department.findMany({
        where: { schoolId: user.schoolAdmin.schoolId },
        select: { id: true, name: true, code: true },
      });
      schools = await prisma.school.findMany({
        where: { id: user.schoolAdmin.schoolId },
        select: { id: true, name: true, code: true },
      });
    } else if (permissions.isSenateAdmin) {
      departments = await prisma.department.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      });
      schools = await prisma.school.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      });
    }

    return res.status(200).json({
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
        creditUnit: course.creditUnit,
        description: course.description,
        type: course.type,
        level: course.level,
        semester: course.semester,
        isActive: course.isActive,
        department: course.department,
        school: course.school,
        studentCount: course._count.enrollments,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      })),
      departments,
      schools,
      adminLevel: permissions.isDepartmentAdmin
        ? "department"
        : permissions.isSchoolAdmin
          ? "school"
          : "senate",
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Create a new course
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  permissions: any
) {
  try {
    const {
      title,
      code,
      creditUnit,
      description,
      type,
      level,
      semester,
      schoolId,
      departmentId,
    } = req.body;

    if (!title || !code || !creditUnit || !type || !level || !semester) {
      return res.status(400).json({
        message:
          "Missing required fields: title, code, creditUnit, type, level, semester",
      });
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code },
    });

    if (existingCourse) {
      return res.status(409).json({
        message: "Course code already exists",
      });
    }

    // Validate permissions for department/school assignment
    let finalSchoolId = schoolId;
    let finalDepartmentId = departmentId;

    if (permissions.isDepartmentAdmin) {
      // Department admin cannot create courses - they can only select from existing ones
      return res.status(403).json({
        message:
          "Department admins cannot create courses. Only Senate admins can create courses.",
      });
    } else if (permissions.isSchoolAdmin) {
      // School admin can create courses for their school
      finalSchoolId = user.schoolAdmin.schoolId;
      if (departmentId) {
        // Verify department belongs to their school
        const department = await prisma.department.findFirst({
          where: {
            id: departmentId,
            schoolId: finalSchoolId,
          },
        });
        if (!department) {
          return res.status(403).json({
            message: "Department does not belong to your school",
          });
        }
        finalDepartmentId = departmentId;
      }
    }
    // Senate admin can create courses for any school/department

    // Create the course
    const course = await prisma.course.create({
      data: {
        title,
        code,
        creditUnit: parseInt(creditUnit),
        description,
        type,
        level,
        semester,
        schoolId: finalSchoolId,
        departmentId: finalDepartmentId,
        isActive: true,
      },
      include: {
        department: {
          select: { name: true, code: true },
        },
        school: {
          select: { name: true, code: true },
        },
      },
    });

    return res.status(201).json({
      message: "Course created successfully",
      course: {
        id: course.id,
        title: course.title,
        code: course.code,
        creditUnit: course.creditUnit,
        description: course.description,
        type: course.type,
        level: course.level,
        semester: course.semester,
        isActive: course.isActive,
        department: course.department,
        school: course.school,
        createdAt: course.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Update a course
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  permissions: any
) {
  try {
    const { courseId, ...updateData } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Check if user has permission to update this course
    let whereClause: any = { id: courseId };

    if (permissions.isDepartmentAdmin) {
      whereClause.departmentId = user.departmentAdmin.departmentId;
    } else if (permissions.isSchoolAdmin) {
      whereClause.schoolId = user.schoolAdmin.schoolId;
    }

    const existingCourse = await prisma.course.findFirst({
      where: whereClause,
    });

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found or you don't have permission to update it",
      });
    }

    // If updating code, check for duplicates
    if (updateData.code && updateData.code !== existingCourse.code) {
      const duplicateCourse = await prisma.course.findUnique({
        where: { code: updateData.code },
      });

      if (duplicateCourse) {
        return res.status(409).json({
          message: "Course code already exists",
        });
      }
    }

    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...updateData,
        creditUnit: updateData.creditUnit
          ? parseInt(updateData.creditUnit)
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        department: {
          select: { name: true, code: true },
        },
        school: {
          select: { name: true, code: true },
        },
      },
    });

    return res.status(200).json({
      message: "Course updated successfully",
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        code: updatedCourse.code,
        creditUnit: updatedCourse.creditUnit,
        description: updatedCourse.description,
        type: updatedCourse.type,
        level: updatedCourse.level,
        semester: updatedCourse.semester,
        isActive: updatedCourse.isActive,
        department: updatedCourse.department,
        school: updatedCourse.school,
        updatedAt: updatedCourse.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Delete a course (soft delete by setting isActive to false)
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  permissions: any
) {
  try {
    const { courseId } = req.query;

    if (!courseId || typeof courseId !== "string") {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Check if user has permission to delete this course
    let whereClause: any = { id: courseId };

    if (permissions.isDepartmentAdmin) {
      whereClause.departmentId = user.departmentAdmin.departmentId;
    } else if (permissions.isSchoolAdmin) {
      whereClause.schoolId = user.schoolAdmin.schoolId;
    }

    const existingCourse = await prisma.course.findFirst({
      where: whereClause,
    });

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found or you don't have permission to delete it",
      });
    }

    // Check if course has active enrollments
    const activeEnrollments = await prisma.enrollment.count({
      where: {
        courseId,
        isActive: true,
      },
    });

    if (activeEnrollments > 0) {
      return res.status(409).json({
        message:
          "Cannot delete course with active enrollments. Deactivate instead.",
      });
    }

    // Soft delete by setting isActive to false
    await prisma.course.update({
      where: { id: courseId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

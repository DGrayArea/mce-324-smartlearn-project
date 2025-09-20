import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Only allow admins to access user management
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      senateAdmin: true,
      schoolAdmin: true,
      departmentAdmin: true,
    },
  });

  if (
    !currentUser ||
    !["SENATE_ADMIN", "SCHOOL_ADMIN", "DEPARTMENT_ADMIN"].includes(
      currentUser.role || ""
    )
  ) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }

  try {
    const { userId } = req.query;
    const { action, ...data } = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            department: {
              select: { schoolId: true },
            },
          },
        },
        lecturer: {
          include: {
            department: {
              select: { schoolId: true },
            },
          },
        },
        departmentAdmin: {
          include: {
            department: {
              select: { schoolId: true },
            },
          },
        },
        schoolAdmin: true,
        senateAdmin: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check permissions based on admin level
    if (currentUser.role === "DEPARTMENT_ADMIN") {
      const userDepartmentId =
        user.student?.departmentId ||
        user.lecturer?.departmentId ||
        user.departmentAdmin?.departmentId;
      if (userDepartmentId !== currentUser.departmentAdmin?.departmentId) {
        return res
          .status(403)
          .json({ message: "You can only manage users in your department" });
      }
    } else if (currentUser.role === "SCHOOL_ADMIN") {
      const userSchoolId =
        user.student?.department?.schoolId ||
        user.lecturer?.department?.schoolId ||
        user.schoolAdmin?.schoolId;
      if (userSchoolId !== currentUser.schoolAdmin?.schoolId) {
        return res
          .status(403)
          .json({ message: "You can only manage users in your school" });
      }
    }

    switch (req.method) {
      case "PUT":
        return handleUpdateUser(req, res, user, data);
      case "DELETE":
        return handleDeleteUser(req, res, user);
      case "PATCH":
        return handleToggleStatus(req, res, user, data);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("User management error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

async function handleUpdateUser(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  data: any
) {
  try {
    const { name, email, role, departmentId, schoolId, level, isActive } = data;

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        email: email || user.email,
        isActive: isActive !== undefined ? isActive : user.isActive,
      },
    });

    // Update role-specific profile
    if (role && role !== user.role) {
      // Delete old profile
      if (user.student)
        await prisma.student.delete({ where: { userId: user.id } });
      if (user.lecturer)
        await prisma.lecturer.delete({ where: { userId: user.id } });
      if (user.departmentAdmin)
        await prisma.departmentAdmin.delete({ where: { userId: user.id } });
      if (user.schoolAdmin)
        await prisma.schoolAdmin.delete({ where: { userId: user.id } });
      if (user.senateAdmin)
        await prisma.senateAdmin.delete({ where: { userId: user.id } });

      // Update user role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: role.toUpperCase() },
      });

      // Create new profile based on role
      switch (role.toUpperCase()) {
        case "STUDENT":
          await prisma.student.create({
            data: {
              userId: user.id,
              name: name || user.name,
              matricNumber: `MAT${Date.now()}`,
              level: level || "LEVEL_100",
              departmentId: departmentId || user.student?.departmentId,
            },
          });
          break;
        case "LECTURER":
          await prisma.lecturer.create({
            data: {
              userId: user.id,
              name: name || user.name,
              departmentId: departmentId || user.lecturer?.departmentId,
            },
          });
          break;
        case "DEPARTMENT_ADMIN":
          await prisma.departmentAdmin.create({
            data: {
              userId: user.id,
              name: name || user.name,
              departmentId: departmentId || user.departmentAdmin?.departmentId,
            },
          });
          break;
        case "SCHOOL_ADMIN":
          await prisma.schoolAdmin.create({
            data: {
              userId: user.id,
              name: name || user.name,
              schoolId: schoolId || user.schoolAdmin?.schoolId,
            },
          });
          break;
        case "SENATE_ADMIN":
          await prisma.senateAdmin.create({
            data: {
              userId: user.id,
              name: name || user.name,
            },
          });
          break;
      }
    } else {
      // Update existing profile
      if (user.student) {
        await prisma.student.update({
          where: { userId: user.id },
          data: {
            name: name || user.student.name,
            level: level || user.student.level,
            departmentId: departmentId || user.student.departmentId,
          },
        });
      } else if (user.lecturer) {
        await prisma.lecturer.update({
          where: { userId: user.id },
          data: {
            name: name || user.lecturer.name,
            departmentId: departmentId || user.lecturer.departmentId,
          },
        });
      } else if (user.departmentAdmin) {
        await prisma.departmentAdmin.update({
          where: { userId: user.id },
          data: {
            name: name || user.departmentAdmin.name,
            departmentId: departmentId || user.departmentAdmin.departmentId,
          },
        });
      } else if (user.schoolAdmin) {
        await prisma.schoolAdmin.update({
          where: { userId: user.id },
          data: {
            name: name || user.schoolAdmin.name,
            schoolId: schoolId || user.schoolAdmin.schoolId,
          },
        });
      } else if (user.senateAdmin) {
        await prisma.senateAdmin.update({
          where: { userId: user.id },
          data: {
            name: name || user.senateAdmin.name,
          },
        });
      }
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      message: "Failed to update user",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

async function handleDeleteUser(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id },
    });

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      message: "Failed to delete user",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

async function handleToggleStatus(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any,
  data: any
) {
  try {
    const { isActive } = data;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: isActive !== undefined ? isActive : !user.isActive,
      },
    });

    return res.status(200).json({
      message: `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    return res.status(500).json({
      message: "Failed to update user status",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

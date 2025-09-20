import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Only allow admins to create users
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
    const {
      name,
      email,
      password,
      role,
      departmentId,
      schoolId,
      level,
      matricNumber,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Missing required fields: name, email, password, role",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists",
      });
    }

    // Check permissions based on admin level
    if (currentUser.role === "DEPARTMENT_ADMIN") {
      if (departmentId !== currentUser.departmentAdmin?.departmentId) {
        return res.status(403).json({
          message: "You can only create users in your department",
        });
      }
    } else if (currentUser.role === "SCHOOL_ADMIN") {
      if (schoolId !== currentUser.schoolAdmin?.schoolId) {
        return res.status(403).json({
          message: "You can only create users in your school",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
        isActive: true,
      },
    });

    // Create role-specific profile
    switch (role.toUpperCase()) {
      case "STUDENT":
        if (!departmentId || !level) {
          return res.status(400).json({
            message: "Department ID and level are required for students",
          });
        }
        await prisma.student.create({
          data: {
            userId: user.id,
            name,
            matricNumber: matricNumber || `MAT${Date.now()}`,
            level: level.toUpperCase(),
            departmentId,
          },
        });
        break;

      case "LECTURER":
        if (!departmentId) {
          return res.status(400).json({
            message: "Department ID is required for lecturers",
          });
        }
        await prisma.lecturer.create({
          data: {
            userId: user.id,
            name,
            departmentId,
          },
        });
        break;

      case "DEPARTMENT_ADMIN":
        if (!departmentId) {
          return res.status(400).json({
            message: "Department ID is required for department admins",
          });
        }
        await prisma.departmentAdmin.create({
          data: {
            userId: user.id,
            name,
            departmentId,
          },
        });
        break;

      case "SCHOOL_ADMIN":
        if (!schoolId) {
          return res.status(400).json({
            message: "School ID is required for school admins",
          });
        }
        await prisma.schoolAdmin.create({
          data: {
            userId: user.id,
            name,
            schoolId,
          },
        });
        break;

      case "SENATE_ADMIN":
        await prisma.senateAdmin.create({
          data: {
            userId: user.id,
            name,
          },
        });
        break;

      default:
        return res.status(400).json({
          message: "Invalid role specified",
        });
    }

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({
      message: "Failed to create user",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

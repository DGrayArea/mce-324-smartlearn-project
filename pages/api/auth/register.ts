import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      studentId,
      staffId,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        message:
          "First name, last name, email, password, and role are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate role
    const validRoles = [
      "STUDENT",
      "LECTURER",
      "DEPARTMENT_ADMIN",
      "SCHOOL_ADMIN",
      "SENATE_ADMIN",
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
      },
    });

    // Create role-specific profile
    if (role === "STUDENT") {
      if (!studentId || !department) {
        return res.status(400).json({
          message: "Student ID and department are required for students",
        });
      }

      // Find department
      const departmentRecord = await prisma.department.findFirst({
        where: { name: department },
      });

      if (!departmentRecord) {
        return res.status(400).json({ message: "Department not found" });
      }

      // Create student profile
      await prisma.student.create({
        data: {
          userId: user.id,
          studentId,
          departmentId: departmentRecord.id,
          level: "100L", // Default level
          isActive: true,
        },
      });
    } else {
      if (!staffId || !department) {
        return res.status(400).json({
          message: "Staff ID and department are required for staff",
        });
      }

      // Find department
      const departmentRecord = await prisma.department.findFirst({
        where: { name: department },
      });

      if (!departmentRecord) {
        return res.status(400).json({ message: "Department not found" });
      }

      // Create role-specific profile
      if (role === "LECTURER") {
        await prisma.lecturer.create({
          data: {
            userId: user.id,
            staffId,
            departmentId: departmentRecord.id,
            isActive: true,
          },
        });
      } else if (role === "DEPARTMENT_ADMIN") {
        await prisma.departmentAdmin.create({
          data: {
            userId: user.id,
            staffId,
            departmentId: departmentRecord.id,
            isActive: true,
          },
        });
      } else if (role === "SCHOOL_ADMIN") {
        // Find school
        const school = await prisma.school.findFirst({
          where: {
            departments: {
              some: { id: departmentRecord.id },
            },
          },
        });

        if (!school) {
          return res
            .status(400)
            .json({ message: "School not found for department" });
        }

        await prisma.schoolAdmin.create({
          data: {
            userId: user.id,
            staffId,
            schoolId: school.id,
            isActive: true,
          },
        });
      } else if (role === "SENATE_ADMIN") {
        await prisma.senateAdmin.create({
          data: {
            userId: user.id,
            staffId,
            isActive: true,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      message: "Error registering user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

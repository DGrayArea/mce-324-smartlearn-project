import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return res
      .status(403)
      .json({ message: "This endpoint is only available in development" });
  }

  try {
    // Check if users already exist
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: [
            "alice@university.edu",
            "robert@university.edu",
            "admin@university.edu",
            "student@demo.com",
            "lecturer@demo.com",
            "admin@demo.com",
          ],
        },
      },
    });

    if (existingUsers.length > 0) {
      return res.status(200).json({
        message: "Test users already exist",
        users: existingUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.role,
        })),
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Create test users (without department relationships for simplicity)
    const users = await Promise.all([
      // University users (for NextAuth)
      prisma.user.create({
        data: {
          email: "alice@university.edu",
          password: hashedPassword,
          role: "STUDENT",
          isActive: true,
        },
      }),

      prisma.user.create({
        data: {
          email: "robert@university.edu",
          password: hashedPassword,
          role: "LECTURER",
          isActive: true,
        },
      }),

      prisma.user.create({
        data: {
          email: "admin@university.edu",
          password: hashedPassword,
          role: "SENATE_ADMIN",
          isActive: true,
        },
      }),

      // Demo users (for dummy authentication)
      prisma.user.create({
        data: {
          email: "student@demo.com",
          password: hashedPassword,
          role: "STUDENT",
          isActive: true,
        },
      }),

      prisma.user.create({
        data: {
          email: "lecturer@demo.com",
          password: hashedPassword,
          role: "LECTURER",
          isActive: true,
        },
      }),

      prisma.user.create({
        data: {
          email: "admin@demo.com",
          password: hashedPassword,
          role: "SENATE_ADMIN",
          isActive: true,
        },
      }),
    ]);

    res.status(200).json({
      message: "Test users created successfully",
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (error: any) {
    console.error("Error seeding users:", error);
    res
      .status(500)
      .json({ message: "Error creating test users", error: error.message });
  }
}

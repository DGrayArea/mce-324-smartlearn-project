import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import * as bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userRole = (session?.user as any)?.role;
  if (
    !session ||
    !userRole ||
    !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(userRole)
  ) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const {
      firstName = "Demo",
      lastName = "Student",
      email = `demo.student+${Date.now()}@example.com`,
      password = "DemoPass123",
      departmentCode = "MCE",
      level = "LEVEL_300",
    } = req.body || {};

    const dept = await prisma.department.findFirst({
      where: { code: departmentCode },
    });
    if (!dept) return res.status(400).json({ message: "Department not found" });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
      return res.status(409).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashed,
        role: "STUDENT",
      },
    });

    // Generate a matric number-like identifier for demo
    const matric = `MCE/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000 + 1000)}`;

    const student = await prisma.student.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        level: level as any,
        matricNumber: matric,
        user: { connect: { id: user.id } },
        department: { connect: { id: dept.id } },
      },
    });

    return res.status(201).json({
      message: "Demo student created",
      credentials: { email, password },
      userId: user.id,
      studentId: student.id,
    });
  } catch (error: any) {
    console.error("create-demo-user error:", error);
    return res
      .status(500)
      .json({ message: "Failed to create demo user", error: error?.message });
  }
}

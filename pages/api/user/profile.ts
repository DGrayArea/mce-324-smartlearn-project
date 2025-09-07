import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: {
          include: {
            department: {
              include: {
                school: true,
              },
            },
          },
        },
        lecturer: {
          include: {
            department: {
              include: {
                school: true,
              },
            },
          },
        },
        departmentAdmin: {
          include: {
            department: {
              include: {
                school: true,
              },
            },
          },
        },
        schoolAdmin: {
          include: {
            school: true,
          },
        },
        senateAdmin: true,
      },
    });

    if (!dbUser) {
      console.warn(`User not found in database: ${session.user.id}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Get the appropriate name and department based on role
    let name = "Unknown User";
    let department = "";
    let studentId = "";
    let staffId = "";

    switch (dbUser.role) {
      case "STUDENT":
        name = dbUser.student?.name || "Student";
        department = dbUser.student?.department?.name || "";
        studentId = dbUser.student?.matricNumber || "";
        break;
      case "LECTURER":
        name = dbUser.lecturer?.name || "Lecturer";
        department = dbUser.lecturer?.department?.name || "";
        staffId = `LEC-${dbUser.lecturer?.id.slice(-4) || ""}`;
        break;
      case "DEPARTMENT_ADMIN":
        name = dbUser.departmentAdmin?.name || "Department Admin";
        department = dbUser.departmentAdmin?.department?.name || "";
        staffId = `DEPT-${dbUser.departmentAdmin?.id.slice(-4) || ""}`;
        break;
      case "SCHOOL_ADMIN":
        name = dbUser.schoolAdmin?.name || "School Admin";
        department = dbUser.schoolAdmin?.school?.name || "";
        staffId = `SCHOOL-${dbUser.schoolAdmin?.id.slice(-4) || ""}`;
        break;
      case "SENATE_ADMIN":
        name = dbUser.senateAdmin?.name || "Senate Admin";
        department = "University Administration";
        staffId = `SENATE-${dbUser.senateAdmin?.id.slice(-4) || ""}`;
        break;
    }

    // Return user data in the format expected by the frontend
    const userData = {
      id: dbUser.id,
      email: dbUser.email || "",
      firstName: name.split(" ")[0] || "",
      lastName: name.split(" ").slice(1).join(" ") || "",
      role: dbUser.role?.toLowerCase(),
      department: department,
      studentId: studentId || undefined,
      staffId: staffId || undefined,
      isActive: dbUser.isActive,
      isVerified: true,
      createdAt: dbUser.createdAt.toISOString(),
      // Include additional profile data
      profile: {
        student: dbUser.student,
        lecturer: dbUser.lecturer,
        departmentAdmin: dbUser.departmentAdmin,
        schoolAdmin: dbUser.schoolAdmin,
        senateAdmin: dbUser.senateAdmin,
      },
    };

    res.status(200).json(userData);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ message: "Error fetching user profile", error: error.message });
  }
}

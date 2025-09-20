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

  // Only allow admins to access user management
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      senateAdmin: true,
      schoolAdmin: true,
      departmentAdmin: {
        include: {
          department: true,
        },
      },
    },
  });

  if (
    !user ||
    !["SENATE_ADMIN", "SCHOOL_ADMIN", "DEPARTMENT_ADMIN"].includes(
      user.role || ""
    )
  ) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }

  try {
    if (req.method === "GET") {
      const { departmentId } = req.query;

      // Fetch users based on admin level
      let users;

      if (user.role === "SENATE_ADMIN") {
        // Senate Admin can see all users or filter by department
        let whereClause: any = {};

        if (departmentId && typeof departmentId === "string") {
          whereClause.OR = [
            { student: { departmentId } },
            { lecturer: { departmentId } },
            { departmentAdmin: { departmentId } },
          ];
        }

        users = await prisma.user.findMany({
          where: whereClause,
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
          orderBy: { createdAt: "desc" },
        });
      } else if (user.role === "SCHOOL_ADMIN") {
        // School Admin can see users in their school
        const schoolId = user.schoolAdmin?.schoolId;
        users = await prisma.user.findMany({
          where: {
            OR: [
              { student: { department: { schoolId } } },
              { lecturer: { department: { schoolId } } },
              { departmentAdmin: { department: { schoolId } } },
              { schoolAdmin: { schoolId } },
            ],
          },
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
          orderBy: { createdAt: "desc" },
        });
      } else if (user.role === "DEPARTMENT_ADMIN") {
        // Department Admin can see users in their department
        const departmentId = user.departmentAdmin?.departmentId;

        users = await prisma.user.findMany({
          where: {
            OR: [
              { student: { departmentId } },
              { lecturer: { departmentId } },
              { departmentAdmin: { departmentId } },
            ],
          },
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
          orderBy: { createdAt: "desc" },
        });
      }

      // Transform users to match frontend expected format
      const transformedUsers =
        users?.map((user) => {
          let role = user.role || "UNKNOWN";
          let department = "N/A";
          let school = "N/A";
          let name = user.name || "Unknown";
          let level = "N/A";

          if (user.student) {
            department = user.student.department?.name || "N/A";
            school = user.student.department?.school?.name || "N/A";
            name = user.student.name;
            level = user.student.level;
          } else if (user.lecturer) {
            department = user.lecturer.department?.name || "N/A";
            school = user.lecturer.department?.school?.name || "N/A";
            name = user.lecturer.name;
          } else if (user.departmentAdmin) {
            department = user.departmentAdmin.department?.name || "N/A";
            school = user.departmentAdmin.department?.school?.name || "N/A";
            name = user.departmentAdmin.name;
          } else if (user.schoolAdmin) {
            school = user.schoolAdmin.school?.name || "N/A";
            name = user.schoolAdmin.name;
          } else if (user.senateAdmin) {
            name = user.senateAdmin.name;
          }

          return {
            id: user.id,
            name,
            email: user.email || "",
            role,
            department,
            school,
            level,
            status: user.isActive ? "active" : "inactive",
            createdAt: user.createdAt,
            lastLogin: user.updatedAt,
            // Keep original properties for admin functionality
            originalUser: user,
          };
        }) || [];

      return res.status(200).json({
        users: transformedUsers,
        total: transformedUsers.length,
        adminLevel: user.role,
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

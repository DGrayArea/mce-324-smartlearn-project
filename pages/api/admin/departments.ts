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

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      senateAdmin: true,
      schoolAdmin: true,
    },
  });

  if (!user || !["SENATE_ADMIN", "SCHOOL_ADMIN"].includes(user.role || "")) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }

  try {
    if (req.method === "GET") {
      const { schoolId } = req.query;

      let whereClause: any = {};

      // If schoolId is provided, filter by school
      if (schoolId && typeof schoolId === "string") {
        whereClause.schoolId = schoolId;
      }

      // If user is School Admin, only show departments in their school
      if (user.role === "SCHOOL_ADMIN" && user.schoolAdmin) {
        whereClause.schoolId = user.schoolAdmin.schoolId;
      }

      const departments = await prisma.department.findMany({
        where: whereClause,
        include: {
          school: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return res.status(200).json({
        departments: departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          schoolId: dept.schoolId,
          school: dept.school,
        })),
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Departments API error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

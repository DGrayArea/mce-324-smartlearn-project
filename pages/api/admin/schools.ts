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

  // Only allow Senate Admin to access all schools
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      senateAdmin: true,
    },
  });

  if (!user || user.role !== "SENATE_ADMIN") {
    return res
      .status(403)
      .json({ message: "Forbidden: Senate Admin access required" });
  }

  try {
    if (req.method === "GET") {
      const schools = await prisma.school.findMany({
        include: {
          departments: {
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
        schools: schools.map((school) => ({
          id: school.id,
          name: school.name,
          code: school.code,
          departments: school.departments,
        })),
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Schools API error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

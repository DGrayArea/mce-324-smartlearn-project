import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        title: true,
        creditUnit: true,
        level: true,
        semester: true,
      },
      orderBy: [{ level: "asc" }, { semester: "asc" }, { code: "asc" }],
    });

    // Group by level and semester
    const grouped = courses.reduce(
      (acc, course) => {
        const key = `${course.level}:${course.semester}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(course);
        return acc;
      },
      {} as Record<string, typeof courses>
    );

    return res.status(200).json({
      total: courses.length,
      grouped,
      summary: Object.entries(grouped).map(([key, courses]) => ({
        level_semester: key,
        count: courses.length,
        mce_count: courses.filter((c) => c.code.startsWith("MCE")).length,
        total_credits: courses.reduce((sum, c) => sum + c.creditUnit, 0),
        courses: courses.map((c) => ({
          code: c.code,
          title: c.title,
          credits: c.creditUnit,
        })),
      })),
    });
  } catch (error: any) {
    console.error("Debug courses error:", error);
    return res
      .status(500)
      .json({ message: "Error fetching courses", error: error?.message });
  }
}

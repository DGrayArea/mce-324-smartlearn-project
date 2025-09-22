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

    // Get lecturer with their assigned courses
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        department: {
          select: {
            name: true,
            code: true,
          },
        },
        courseAssignments: {
          where: {
            isActive: true,
            academicYear: "2024/2025", // Current academic year
            semester: "FIRST", // Current semester
          },
          select: {
            id: true,
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                creditUnit: true,
                description: true,
                type: true,
                level: true,
                semester: true,
                department: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
                _count: {
                  select: {
                    enrollments: {
                      where: {
                        isActive: true,
                        academicYear: "2024/2025",
                        semester: "FIRST",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer profile not found" });
    }

    // Transform courses to include student count and other relevant info
    const courses = lecturer.courseAssignments.map((assignment) => ({
      id: assignment.course.id,
      title: assignment.course.title,
      code: assignment.course.code,
      creditUnit: assignment.course.creditUnit,
      description: assignment.course.description,
      type: assignment.course.type,
      level: assignment.course.level,
      semester: assignment.course.semester,
      department: assignment.course.department,
      studentCount: assignment.course._count.enrollments,
      assignmentId: assignment.id,
    }));

    res.status(200).json({
      courses,
      lecturer: {
        id: lecturer.id,
        name: lecturer.name,
        department: lecturer.department,
      },
    });
  } catch (error: any) {
    console.error("Error fetching lecturer courses:", error);
    res
      .status(500)
      .json({ message: "Error fetching courses", error: error.message });
  }
}

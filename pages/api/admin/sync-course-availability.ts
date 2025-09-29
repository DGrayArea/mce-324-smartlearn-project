import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Get user with department admin profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { departmentAdmin: true },
  });

  if (!user?.departmentAdmin) {
    return res.status(403).json({
      message: "Only department admins can sync course availability",
    });
  }

  const departmentId = user.departmentAdmin.departmentId;
  const adminId = user.departmentAdmin.id;

  try {
    // Get department's selected courses
    const departmentCourses = await prisma.departmentCourse.findMany({
      where: { departmentId },
      include: {
        course: true,
      },
    });

    // Get department's own courses (courses created under this department)
    const departmentOwnCourses = await prisma.course.findMany({
      where: {
        isActive: true,
        departmentId: departmentId,
      },
    });

    // Get courses that belong to this department by code
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { code: true },
    });

    const departmentCodeCourses = await prisma.course.findMany({
      where: {
        isActive: true,
        code: { startsWith: department?.code || "" },
        departmentId: null, // Courses not assigned to any specific department
      },
    });

    // Combine all courses that should be available for this department
    const allAvailableCourses = [
      ...departmentCourses.map((dc) => dc.course),
      ...departmentOwnCourses,
      ...departmentCodeCourses,
    ];

    // Remove duplicates based on course ID
    const uniqueCourses = allAvailableCourses.filter(
      (course, index, self) =>
        index === self.findIndex((c) => c.id === course.id)
    );

    // Create or update course availability for each course
    const availabilityUpdates = uniqueCourses.map((course) =>
      prisma.courseAvailability.upsert({
        where: {
          departmentId_courseId: {
            departmentId,
            courseId: course.id,
          },
        },
        update: {
          isAvailable: true,
          isRecommended:
            course.departmentId === departmentId ||
            course.code.startsWith(department?.code || ""),
          priority:
            course.departmentId === departmentId
              ? 90
              : course.code.startsWith(department?.code || "")
                ? 85
                : 70,
          notes:
            course.departmentId === departmentId
              ? "Department's own course"
              : course.code.startsWith(department?.code || "")
                ? "Department course by code"
                : "Selected by department admin",
          configuredBy: adminId,
          updatedAt: new Date(),
        },
        create: {
          departmentId,
          courseId: course.id,
          isAvailable: true,
          isRecommended:
            course.departmentId === departmentId ||
            course.code.startsWith(department?.code || ""),
          priority:
            course.departmentId === departmentId
              ? 90
              : course.code.startsWith(department?.code || "")
                ? 85
                : 70,
          notes:
            course.departmentId === departmentId
              ? "Department's own course"
              : course.code.startsWith(department?.code || "")
                ? "Department course by code"
                : "Selected by department admin",
          configuredBy: adminId,
        },
      })
    );

    await Promise.all(availabilityUpdates);

    // Also handle general and faculty courses that should be available to all departments
    const generalAndFacultyCourses = await prisma.course.findMany({
      where: {
        isActive: true,
        type: { in: ["GENERAL", "FACULTY"] },
      },
    });

    const generalFacultyUpdates = generalAndFacultyCourses.map((course) =>
      prisma.courseAvailability.upsert({
        where: {
          departmentId_courseId: {
            departmentId,
            courseId: course.id,
          },
        },
        update: {
          isAvailable: true,
          isRecommended: false,
          priority: course.type === "GENERAL" ? 60 : 50,
          notes: `${course.type} course - available to all departments`,
          configuredBy: adminId,
          updatedAt: new Date(),
        },
        create: {
          departmentId,
          courseId: course.id,
          isAvailable: true,
          isRecommended: false,
          priority: course.type === "GENERAL" ? 60 : 50,
          notes: `${course.type} course - available to all departments`,
          configuredBy: adminId,
        },
      })
    );

    await Promise.all(generalFacultyUpdates);

    return res.status(200).json({
      message: "Course availability synced successfully",
      syncedCourses: uniqueCourses.length,
      syncedGeneralFaculty: generalAndFacultyCourses.length,
      totalAvailable: uniqueCourses.length + generalAndFacultyCourses.length,
    });
  } catch (error) {
    console.error("Error syncing course availability:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

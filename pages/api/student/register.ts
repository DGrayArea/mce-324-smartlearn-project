import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = (await getServerSession(req, res, authOptions as any)) as any;
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = session.user.id as string;
    const { courseIds, academicYear } = req.body as {
      courseIds: string[];
      academicYear?: string;
    };
    if (!Array.isArray(courseIds)) {
      return res.status(400).json({ message: "courseIds must be an array" });
    }

    const student = await prisma.student.findFirst({
      where: { userId },
      select: { id: true, level: true, departmentId: true },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const year = academicYear || "2024/2025";

    // Get student's department to find related departments (same logic as courses API)
    const studentDepartment = await prisma.department.findFirst({
      where: { id: student.departmentId },
      select: { schoolId: true },
    });

    // Find all departments in the same school plus common service departments
    const relatedDepartments = await prisma.department.findMany({
      where: {
        OR: [
          { schoolId: studentDepartment?.schoolId }, // Same school departments
          { name: { contains: "General Studies" } }, // GST courses
          { name: { contains: "Mathematics" } }, // MTH courses
          { name: { contains: "Physics" } }, // PHY courses
          { name: { contains: "Chemistry" } }, // CHM courses
        ],
      },
      select: { id: true },
    });

    const relatedDepartmentIds = relatedDepartments.map((d) => d.id);

    // Debug logging
    console.log("Student register API - Related departments:", {
      studentDepartmentId: student.departmentId,
      studentDepartmentSchoolId: studentDepartment?.schoolId,
      relatedDepartments: relatedDepartments.map((d) => ({ id: d.id })),
      relatedDepartmentIds: relatedDepartmentIds,
      requestedCourseIds: courseIds,
    });

    // Fetch selected courses to split by semester
    const selectedCourses = courseIds.length
      ? await prisma.course.findMany({
          where: {
            id: { in: courseIds },
            departmentId: { in: relatedDepartmentIds },
            level: student.level,
          },
          select: { id: true, semester: true },
        })
      : [];

    const bySemester: Record<string, string[]> = { FIRST: [], SECOND: [] };
    for (const c of selectedCourses) {
      if (c.semester === "FIRST" || c.semester === "SECOND") {
        bySemester[c.semester].push(c.id);
      }
    }

    // Upsert registrations per semester and replace selections; status returns to PENDING on save
    for (const semester of ["FIRST", "SECOND"]) {
      const reg = await prisma.courseRegistration.upsert({
        where: {
          studentId_academicYear_semester: {
            studentId: student.id,
            academicYear: year,
            semester: semester as any,
          },
        },
        update: { status: "PENDING", reviewedAt: null, comments: null },
        create: {
          studentId: student.id,
          academicYear: year,
          semester: semester as any,
          status: "PENDING",
        },
      });

      // Replace selections
      await prisma.courseSelection.deleteMany({
        where: { courseRegistrationId: reg.id },
      });
      const ids = bySemester[semester];
      if (ids && ids.length) {
        await prisma.courseSelection.createMany({
          data: ids.map((cid) => ({
            courseRegistrationId: reg.id,
            courseId: cid,
          })),
          skipDuplicates: true,
        });
      }

      // On new save, do NOT create enrollments until approved
      await prisma.enrollment.deleteMany({
        where: { courseRegistrationId: reg.id },
      });
    }

    return res
      .status(200)
      .json({ message: "Registration submitted for approval" });
  } catch (e: any) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

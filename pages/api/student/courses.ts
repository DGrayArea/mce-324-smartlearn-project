import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = (await getServerSession(req, res, authOptions as any)) as any;
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = session.user.id as string;
    const student = await prisma.student.findFirst({
      where: { userId },
      select: { id: true, level: true, departmentId: true },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Get student's department to find related departments
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
    console.log("Student courses API - Related departments:", {
      studentDepartmentId: student.departmentId,
      studentDepartmentSchoolId: studentDepartment?.schoolId,
      relatedDepartments: relatedDepartments.map((d) => ({ id: d.id })),
      relatedDepartmentIds: relatedDepartmentIds,
    });

    const courses = await prisma.course.findMany({
      where: {
        departmentId: { in: relatedDepartmentIds },
        level: student.level,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        title: true,
        creditUnit: true,
        semester: true,
        level: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ semester: "asc" }, { code: "asc" }],
    });

    const first = courses.filter((c) => c.semester === "FIRST");
    const second = courses.filter((c) => c.semester === "SECOND");

    // Current session registration status per semester
    const ACADEMIC_YEAR = "2024/2025";
    const currentRegs = await prisma.courseRegistration.findMany({
      where: { studentId: student.id, academicYear: ACADEMIC_YEAR },
      select: { id: true, semester: true, status: true },
    });
    const regBySem = Object.fromEntries(
      currentRegs.map((r) => [r.semester, r])
    );
    const selectionsCurrent = currentRegs.length
      ? await prisma.courseSelection.findMany({
          where: { courseRegistrationId: { in: currentRegs.map((r) => r.id) } },
          select: { courseId: true, courseRegistrationId: true },
        })
      : [];
    const selectedFirst = new Set(
      selectionsCurrent
        .filter(
          (s) =>
            regBySem["FIRST"] && s.courseRegistrationId === regBySem["FIRST"].id
        )
        .map((s) => s.courseId)
    );
    const selectedSecond = new Set(
      selectionsCurrent
        .filter(
          (s) =>
            regBySem["SECOND"] &&
            s.courseRegistrationId === regBySem["SECOND"].id
        )
        .map((s) => s.courseId)
    );
    const sum = (arr: { creditUnit: number }[]) =>
      arr.reduce((a, b) => a + (b.creditUnit || 0), 0);

    return res.status(200).json({
      level: student.level,
      departmentId: student.departmentId,
      firstSemester: {
        totalCredits: sum(first),
        courses: first,
        status: regBySem["FIRST"]?.status || null,
        registeredCourseIds: first
          .filter((c) => selectedFirst.has(c.id))
          .map((c) => c.id),
      },
      secondSemester: {
        totalCredits: sum(second),
        courses: second,
        status: regBySem["SECOND"]?.status || null,
        registeredCourseIds: second
          .filter((c) => selectedSecond.has(c.id))
          .map((c) => c.id),
      },
      academicYear: ACADEMIC_YEAR,
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

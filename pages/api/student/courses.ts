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

    const courses = await prisma.course.findMany({
      where: {
        departmentId: student.departmentId,
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
      },
      orderBy: [{ semester: "asc" }, { code: "asc" }],
    });

    const first = courses.filter((c) => c.semester === "FIRST");
    const second = courses.filter((c) => c.semester === "SECOND");

    // Existing selections across registrations (for preselection)
    const regs = await prisma.courseRegistration.findMany({
      where: { studentId: student.id },
      select: { id: true },
    });
    const selections = regs.length
      ? await prisma.courseSelection.findMany({
          where: { courseRegistrationId: { in: regs.map((r) => r.id) } },
          select: { courseId: true },
        })
      : [];
    const registeredSet = new Set(selections.map((s) => s.courseId));
    const sum = (arr: { creditUnit: number }[]) =>
      arr.reduce((a, b) => a + (b.creditUnit || 0), 0);

    return res.status(200).json({
      level: student.level,
      departmentId: student.departmentId,
      firstSemester: {
        totalCredits: sum(first),
        courses: first,
        registeredCourseIds: first
          .filter((c) => registeredSet.has(c.id))
          .map((c) => c.id),
      },
      secondSemester: {
        totalCredits: sum(second),
        courses: second,
        registeredCourseIds: second
          .filter((c) => registeredSet.has(c.id))
          .map((c) => c.id),
      },
    });
  } catch (e: any) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

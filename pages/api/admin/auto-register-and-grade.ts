import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// Auto-register all students (100–500L) for the current session and generate pending results
// Results remain hidden until approved via the existing approval workflow (Result.status stays PENDING)

const CURRENT_SESSION = "2024/2025";

function gradeFromTotal(total: number): string {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log(
      "[auto] START: Auto-registering and grading all students for",
      CURRENT_SESSION
    );

    // Fetch MCE department
    const mce = await prisma.department.findUnique({ where: { code: "MCE" } });
    if (!mce)
      return res.status(400).json({ message: "MCE department not found" });

    // Fetch all students (100–500L) in MCE
    const students = await prisma.student.findMany({
      where: {
        departmentId: mce.id,
        level: {
          in: [
            "LEVEL_100",
            "LEVEL_200",
            "LEVEL_300",
            "LEVEL_400",
            "LEVEL_500",
          ] as any,
        },
      },
      select: { id: true, level: true },
    });
    console.log(`[auto] Students found: ${students.length}`);

    // Preload course catalog by level+semester for the current session
    const allCourses = await prisma.course.findMany({
      where: { departmentId: mce.id, isActive: true },
      select: {
        id: true,
        code: true,
        creditUnit: true,
        level: true,
        semester: true,
      },
    });
    const byKey = new Map<
      string,
      { id: string; code: string; creditUnit: number }[]
    >();
    for (const c of allCourses) {
      const key = `${c.level}:${c.semester}`;
      const arr = byKey.get(key) || [];
      arr.push({ id: c.id, code: c.code, creditUnit: c.creditUnit });
      byKey.set(key, arr);
    }

    // Helper to upsert registration + selections + enrollments + pending results
    async function processStudent(studentId: string, level: any) {
      const levels = [level]; // current level only for current session
      for (const L of levels) {
        for (const S of ["FIRST", "SECOND"] as const) {
          const key = `${L}:${S}`;
          const list = byKey.get(key) || [];
          if (!list.length) continue;

          // Upsert CourseRegistration (PENDING)
          const reg = await prisma.courseRegistration.upsert({
            where: {
              studentId_academicYear_semester: {
                studentId,
                academicYear: CURRENT_SESSION,
                semester: S as any,
              },
            },
            update: { status: "PENDING", reviewedAt: null, comments: null },
            create: {
              studentId,
              academicYear: CURRENT_SESSION,
              semester: S as any,
              status: "PENDING",
            },
          });

          // Replace selections
          await prisma.courseSelection.deleteMany({
            where: { courseRegistrationId: reg.id },
          });
          await prisma.courseSelection.createMany({
            data: list.map((c) => ({
              courseRegistrationId: reg.id,
              courseId: c.id,
            })),
            skipDuplicates: true,
          });

          // Create enrollments for current session
          await Promise.all(
            list.map((c) =>
              prisma.enrollment.upsert({
                where: {
                  studentId_courseId_academicYear_semester: {
                    studentId,
                    courseId: c.id,
                    academicYear: CURRENT_SESSION,
                    semester: S as any,
                  },
                },
                update: { isActive: true, courseRegistrationId: reg.id },
                create: {
                  studentId,
                  courseId: c.id,
                  academicYear: CURRENT_SESSION,
                  semester: S as any,
                  isActive: true,
                  courseRegistrationId: reg.id,
                },
              })
            )
          );

          // Generate pending results (hidden until approvals) — skip SIWES
          await Promise.all(
            list.map(async (c) => {
              const isSiwes = c.code.toUpperCase().includes("SIW");
              if (isSiwes) return;
              let ca = Math.floor(18 + Math.random() * 22);
              let exam = Math.floor(28 + Math.random() * 45);
              let total = Math.min(100, ca + exam);
              if (total < 40) {
                const boost = 40 - total;
                exam = Math.min(72, exam + boost);
                total = Math.min(100, ca + exam);
              }
              const grade = gradeFromTotal(total);

              await prisma.result.upsert({
                where: {
                  studentId_courseId_academicYear_semester: {
                    studentId,
                    courseId: c.id,
                    academicYear: CURRENT_SESSION,
                    semester: S as any,
                  },
                },
                update: {
                  caScore: ca,
                  examScore: exam,
                  totalScore: total,
                  grade,
                  status: "PENDING",
                },
                create: {
                  studentId,
                  courseId: c.id,
                  academicYear: CURRENT_SESSION,
                  semester: S as any,
                  caScore: ca,
                  examScore: exam,
                  totalScore: total,
                  grade,
                  status: "PENDING",
                },
              });
            })
          );
        }
      }
    }

    // Process students in parallel batches
    const BATCH = 10;
    for (let i = 0; i < students.length; i += BATCH) {
      const slice = students.slice(i, i + BATCH);
      console.log(
        `[auto] Processing students ${i + 1}-${i + slice.length}/${students.length} ...`
      );
      await Promise.all(slice.map((s) => processStudent(s.id, s.level)));
    }

    console.log(
      "[auto] COMPLETE: Auto-registration and pending results generated"
    );
    return res.status(200).json({
      message: "Auto registration & grading completed",
      session: CURRENT_SESSION,
      students: students.length,
    });
  } catch (error: any) {
    console.error("[auto] Error:", error);
    return res
      .status(500)
      .json({ message: "Auto registration failed", error: error?.message });
  }
}

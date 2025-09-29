import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { calculateGrade } from "@/lib/grading";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify lecturer has access to the course
  const verifyLecturerAccess = async (courseId: string) => {
    const lecturer = await prisma.lecturer.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        courseAssignments: {
          where: {
            courseId,
            isActive: true,
          },
        },
      },
    });

    return lecturer;
  };

  try {
    if (req.method === "GET") {
      // Get existing results for a course
      const { courseId, academicYear, semester } = req.query;

      if (!courseId || typeof courseId !== "string") {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const lecturer = await verifyLecturerAccess(courseId);
      if (!lecturer || lecturer.courseAssignments.length === 0) {
        return res
          .status(403)
          .json({ message: "Access denied to this course" });
      }

      const results = await prisma.result.findMany({
        where: {
          courseId,
          academicYear: (academicYear as string) || "2024/2025",
          semester: (semester as any) || "FIRST",
        },
        select: {
          id: true,
          caScore: true,
          examScore: true,
          totalScore: true,
          grade: true,
          status: true,
          academicYear: true,
          semester: true,
          createdAt: true,
          updatedAt: true,
          student: {
            select: {
              id: true,
              name: true,
              matricNumber: true,
            },
          },
        },
      });

      res.status(200).json({ results });
    } else if (req.method === "POST") {
      // Save/update results
      const { courseId, academicYear, semester, grades } = req.body;

      if (!courseId || !grades || !Array.isArray(grades)) {
        return res.status(400).json({
          message: "Course ID and grades are required",
        });
      }

      const lecturer = await verifyLecturerAccess(courseId);
      if (!lecturer || lecturer.courseAssignments.length === 0) {
        return res
          .status(403)
          .json({ message: "Access denied to this course" });
      }

      // Save/update results in a transaction
      const results = await prisma.$transaction(
        grades.map((grade: any) => {
          // Calculate grade automatically if not provided
          const calculatedGrade =
            grade.grade || calculateGrade(grade.totalScore).grade;

          return prisma.result.upsert({
            where: {
              studentId_courseId_academicYear_semester: {
                studentId: grade.studentId,
                courseId,
                academicYear: academicYear || "2024/2025",
                semester: semester || "FIRST",
              },
            },
            update: {
              caScore: grade.caScore,
              examScore: grade.examScore,
              totalScore: grade.totalScore,
              grade: calculatedGrade,
              status: "PENDING",
            },
            create: {
              studentId: grade.studentId,
              courseId,
              academicYear: academicYear || "2024/2025",
              semester: semester || "FIRST",
              caScore: grade.caScore,
              examScore: grade.examScore,
              totalScore: grade.totalScore,
              grade: calculatedGrade,
              status: "PENDING",
            },
          });
        })
      );

      res.status(200).json({
        message: "Results saved successfully",
        results: results.length,
      });
    } else if (req.method === "PUT") {
      // Submit results to department admin for review
      const { courseId, academicYear, semester, action } = req.body;

      if (!courseId || action !== "submit") {
        return res.status(400).json({
          message: "Course ID and submit action are required",
        });
      }

      const lecturer = await verifyLecturerAccess(courseId);
      if (!lecturer || lecturer.courseAssignments.length === 0) {
        return res
          .status(403)
          .json({ message: "Access denied to this course" });
      }

      // Get course info
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          title: true,
          code: true,
          departmentId: true,
        },
      });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Update all results to submitted status
      const updatedResults = await prisma.result.updateMany({
        where: {
          courseId,
          academicYear: academicYear || "2024/2025",
          semester: semester || "FIRST",
          status: "PENDING",
        },
        data: {
          status: "DEPARTMENT_APPROVED", // Ready for department admin review
        },
      });

      // Create notification for department admin
      const departmentAdmin = await prisma.departmentAdmin.findFirst({
        where: {
          departmentId: course.departmentId,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (departmentAdmin) {
        await prisma.notification.create({
          data: {
            title: "End-of-Semester Grades Ready for Review",
            message: `Grades for ${course.title} (${course.code}) have been submitted for review. ${updatedResults.count} students' results are ready for approval.`,
            type: "GRADE",
            priority: "high",
            actionUrl: `/dashboard/result-approval`,
            lecturerId: lecturer.id,
          },
        });
      }

      res.status(200).json({
        message: "Results submitted successfully for department admin review",
        submittedCount: updatedResults.count,
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in lecturer results API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

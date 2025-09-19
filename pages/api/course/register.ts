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

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId, academicYear, semester } = req.body;

    if (!courseId || !academicYear || !semester) {
      return res.status(400).json({
        message: "Missing required fields: courseId, academicYear, semester",
      });
    }

    // Get user with student profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { student: true },
    });

    if (!user || !user.student) {
      return res.status(403).json({
        message: "Only students can register for courses",
      });
    }

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || !course.isActive) {
      return res.status(404).json({
        message: "Course not found or inactive",
      });
    }

    // Check if student is already enrolled in this course for this semester
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId_academicYear_semester: {
          studentId: user.student.id,
          courseId: courseId,
          academicYear: academicYear,
          semester: semester,
        },
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        message: "Already enrolled in this course for this semester",
      });
    }

    // Check if there's an existing course registration for this semester
    let courseRegistration = await prisma.courseRegistration.findUnique({
      where: {
        studentId_academicYear_semester: {
          studentId: user.student.id,
          academicYear: academicYear,
          semester: semester,
        },
      },
    });

    // Create course registration if it doesn't exist
    if (!courseRegistration) {
      courseRegistration = await prisma.courseRegistration.create({
        data: {
          studentId: user.student.id,
          academicYear: academicYear,
          semester: semester,
          status: "PENDING",
        },
      });
    }

    // Add course to the registration
    await prisma.courseSelection.create({
      data: {
        courseRegistrationId: courseRegistration.id,
        courseId: courseId,
      },
    });

    // Create enrollment (assuming auto-approval for now)
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: user.student.id,
        courseId: courseId,
        academicYear: academicYear,
        semester: semester,
        courseRegistrationId: courseRegistration.id,
        isActive: true,
      },
    });

    // Update course registration status to approved
    await prisma.courseRegistration.update({
      where: { id: courseRegistration.id },
      data: {
        status: "DEPARTMENT_APPROVED",
        reviewedAt: new Date(),
      },
    });

    return res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        academicYear: enrollment.academicYear,
        semester: enrollment.semester,
        enrolledAt: enrollment.enrolledAt,
      },
    });
  } catch (error) {
    console.error("Course registration error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

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

    // Check if course is already selected in this registration
    const existingSelection = await prisma.courseSelection.findUnique({
      where: {
        courseRegistrationId_courseId: {
          courseRegistrationId: courseRegistration.id,
          courseId: courseId,
        },
      },
    });

    if (existingSelection) {
      return res.status(409).json({
        message: "Course already selected in this registration",
      });
    }

    // Add course to the registration
    await prisma.courseSelection.create({
      data: {
        courseRegistrationId: courseRegistration.id,
        courseId: courseId,
      },
    });

    return res.status(201).json({
      message:
        "Course added to registration successfully. Submit your registration for department admin review.",
      registration: {
        id: courseRegistration.id,
        status: courseRegistration.status,
        academicYear: courseRegistration.academicYear,
        semester: courseRegistration.semester,
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

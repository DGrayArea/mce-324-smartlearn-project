import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Only allow students
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email },
    include: {
      student: {
        include: {
          department: {
            include: {
              school: true,
            },
          },
        },
      },
    },
  });

  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.student) {
    return res
      .status(403)
      .json({ message: "Forbidden: Student access required" });
  }

  const studentId = currentUser.student.id;
  const departmentId = currentUser.student.departmentId;
  const studentLevel = currentUser.student.level;

  try {
    switch (req.method) {
      case "GET":
        return handleGet(
          req,
          res,
          departmentId,
          studentLevel,
          studentId,
          currentUser
        );
      case "POST":
        return handlePost(req, res, studentId);
      case "PUT":
        return handleUpdate(req, res, studentId);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Course selection error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Get available courses for student selection
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  departmentId: string,
  studentLevel: string,
  studentId: string,
  currentUser: any
) {
  try {
    const { academicYear = "2024/2025", semester = "FIRST" } = req.query;

    // Check if registration is open
    const currentDate = new Date();
    const registrationDeadline = new Date("2024-10-15");

    if (currentDate > registrationDeadline) {
      return res.status(400).json({
        message: "Course registration period has ended for this session",
      });
    }

    // Check if student has already submitted registration for this session
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: {
        studentId,
        academicYear: academicYear as string,
        semester: semester as any,
      },
      include: {
        selectedCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    // Get student's failed courses (carry-over courses)
    const failedResults = await prisma.result.findMany({
      where: {
        studentId,
        grade: "F",
        status: "SENATE_APPROVED",
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            creditUnit: true,
            level: true,
            semester: true,
            type: true,
          },
        },
      },
    });

    // Filter carry-over courses based on semester
    const carryOverCourses = failedResults
      .filter((result) => {
        // 1st semester courses can only be taken in 1st semester
        // 2nd semester courses can only be taken in 2nd semester
        return result.course.semester === semester;
      })
      .map((result) => ({
        ...result.course,
        isCarryOver: true,
        failedIn: result.academicYear,
        reason: "Failed in previous attempt",
      }));

    // Get courses available for student's level
    const departmentCourses = await prisma.departmentCourse.findMany({
      where: { departmentId },
      include: {
        course: {
          include: {
            department: {
              select: { name: true, code: true },
            },
            school: {
              select: { name: true, code: true },
            },
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    // Filter courses based on student level and semester
    const levelOrder = [
      "LEVEL_100",
      "LEVEL_200",
      "LEVEL_300",
      "LEVEL_400",
      "LEVEL_500",
    ];
    const studentLevelIndex = levelOrder.indexOf(studentLevel);

    const availableCourses = departmentCourses
      .filter((dc) => {
        const course = dc.course;
        const courseLevelIndex = levelOrder.indexOf(course.level);

        // Student can take courses for their level or lower
        // Course must be offered in the current semester
        return (
          courseLevelIndex <= studentLevelIndex &&
          course.semester === semester &&
          course.isActive
        );
      })
      .map((dc) => ({
        ...dc.course,
        isRequired: dc.isRequired,
        isElective: !dc.isRequired,
        category: dc.isRequired ? "required" : "elective",
      }));

    // Separate required and elective courses
    const requiredCourses = availableCourses.filter(
      (course) => course.isRequired
    );
    const electiveCourses = availableCourses.filter(
      (course) => course.isElective
    );

    // Calculate current credit load if registration exists
    let currentCredits = 0;
    let selectedCourseIds: string[] = [];

    if (existingRegistration) {
      currentCredits = existingRegistration.selectedCourses.reduce(
        (sum, selection) => sum + selection.course.creditUnit,
        0
      );
      selectedCourseIds = existingRegistration.selectedCourses.map(
        (s) => s.courseId
      );
    }

    return res.status(200).json({
      availableCourses,
      requiredCourses,
      electiveCourses,
      carryOverCourses,
      existingRegistration,
      currentCredits,
      selectedCourseIds,
      maxCredits: 24,
      remainingCredits: 24 - currentCredits,
      student: {
        level: studentLevel,
        department: currentUser.student.department,
      },
      registrationStatus: existingRegistration?.status || "NOT_STARTED",
    });
  } catch (error) {
    console.error("Get course selection error:", error);
    return res.status(500).json({
      message: "Failed to fetch course selection",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Submit course selection
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string
) {
  try {
    const {
      selectedCourseIds,
      academicYear = "2024/2025",
      semester = "FIRST",
    } = req.body;

    if (!selectedCourseIds || !Array.isArray(selectedCourseIds)) {
      return res.status(400).json({
        message: "Selected course IDs are required",
      });
    }

    // Check if registration is open
    const currentDate = new Date();
    const registrationDeadline = new Date("2024-10-15");

    if (currentDate > registrationDeadline) {
      return res.status(400).json({
        message: "Course registration period has ended for this session",
      });
    }

    // Get course details to calculate total credits
    const courses = await prisma.course.findMany({
      where: {
        id: { in: selectedCourseIds },
      },
    });

    // Calculate total credits
    const totalCredits = courses.reduce(
      (sum, course) => sum + course.creditUnit,
      0
    );

    if (totalCredits > 24) {
      return res.status(400).json({
        message: `Total credits (${totalCredits}) exceeds the maximum limit of 24 credits. Please remove some courses.`,
        totalCredits,
        maxCredits: 24,
      });
    }

    // Check if student already has a registration for this session
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: {
        studentId,
        academicYear,
        semester,
      },
    });

    if (existingRegistration) {
      return res.status(409).json({
        message:
          "You have already submitted a course registration for this session. Please contact your department admin to modify it.",
      });
    }

    // Create course registration in a transaction
    const registration = await prisma.$transaction(async (tx) => {
      // Create the registration
      const newRegistration = await tx.courseRegistration.create({
        data: {
          studentId,
          academicYear,
          semester,
          status: "PENDING",
        },
      });

      // Create course selections
      await Promise.all(
        selectedCourseIds.map((courseId) =>
          tx.courseSelection.create({
            data: {
              courseRegistrationId: newRegistration.id,
              courseId,
            },
          })
        )
      );

      return newRegistration;
    });

    // Create notification for department admin
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: {
          include: {
            admins: true,
          },
        },
      },
    });

    if (student?.department.admins.length > 0) {
      await prisma.notification.create({
        data: {
          title: "New Course Registration for Review",
          message: `${student.name} (${student.matricNumber}) has submitted a course registration with ${selectedCourseIds.length} courses (${totalCredits} credits) for review.`,
          type: "COURSE_REGISTRATION",
          priority: "normal",
          actionUrl: `/dashboard/course-registrations`,
          studentId,
        },
      });
    }

    return res.status(201).json({
      message:
        "Course registration submitted successfully for department admin review",
      registration,
      totalCredits,
      selectedCourses: courses.length,
    });
  } catch (error) {
    console.error("Course selection submission error:", error);
    return res.status(500).json({
      message: "Failed to submit course selection",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Update course selection (if not yet reviewed)
async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  studentId: string
) {
  try {
    const {
      selectedCourseIds,
      academicYear = "2024/2025",
      semester = "FIRST",
    } = req.body;

    if (!selectedCourseIds || !Array.isArray(selectedCourseIds)) {
      return res.status(400).json({
        message: "Selected course IDs are required",
      });
    }

    // Check if registration is open
    const currentDate = new Date();
    const registrationDeadline = new Date("2024-10-15");

    if (currentDate > registrationDeadline) {
      return res.status(400).json({
        message: "Course registration period has ended for this session",
      });
    }

    // Get existing registration
    const existingRegistration = await prisma.courseRegistration.findFirst({
      where: {
        studentId,
        academicYear,
        semester,
      },
      include: {
        selectedCourses: true,
      },
    });

    if (!existingRegistration) {
      return res.status(404).json({
        message: "No existing registration found",
      });
    }

    if (existingRegistration.status !== "PENDING") {
      return res.status(400).json({
        message: "Cannot modify registration that has already been reviewed",
      });
    }

    // Get course details to calculate total credits
    const courses = await prisma.course.findMany({
      where: {
        id: { in: selectedCourseIds },
      },
    });

    // Calculate total credits
    const totalCredits = courses.reduce(
      (sum, course) => sum + course.creditUnit,
      0
    );

    if (totalCredits > 24) {
      return res.status(400).json({
        message: `Total credits (${totalCredits}) exceeds the maximum limit of 24 credits. Please remove some courses.`,
        totalCredits,
        maxCredits: 24,
      });
    }

    // Update registration in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing course selections
      await tx.courseSelection.deleteMany({
        where: {
          courseRegistrationId: existingRegistration.id,
        },
      });

      // Create new course selections
      await Promise.all(
        selectedCourseIds.map((courseId) =>
          tx.courseSelection.create({
            data: {
              courseRegistrationId: existingRegistration.id,
              courseId,
            },
          })
        )
      );
    });

    return res.status(200).json({
      message: "Course registration updated successfully",
      totalCredits,
      selectedCourses: courses.length,
    });
  } catch (error) {
    console.error("Course selection update error:", error);
    return res.status(500).json({
      message: "Failed to update course selection",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

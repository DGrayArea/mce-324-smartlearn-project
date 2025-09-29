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

    // Get user with student profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user || !user.student) {
      return res.status(403).json({
        message: "Only students can view available courses",
      });
    }

    const { academicYear, semester } = req.query;

    // Get available courses (not already enrolled)
    const enrolledCourses = await prisma.enrollment.findMany({
      where: {
        studentId: user.student.id,
        academicYear: (academicYear as string) || "2024/2025",
        semester: (semester as any) || "FIRST",
        isActive: true,
      },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrolledCourses.map((e) => e.courseId);

    // Get department required courses
    const departmentCourses = await prisma.departmentCourse.findMany({
      where: {
        departmentId: user.student.departmentId,
        isRequired: true,
      },
      include: {
        course: true,
      },
    });

    const requiredCourseIds = departmentCourses.map((dc) => dc.courseId);

    // Get course availability configuration for this department
    const courseAvailability = await prisma.courseAvailability.findMany({
      where: {
        departmentId: user.student.departmentId,
        isAvailable: true,
      },
      include: {
        course: true,
        admin: {
          select: { name: true },
        },
      },
    });

    const availableCourseIds = courseAvailability.map((ca) => ca.courseId);

    // Get available courses based on department configuration
    // Students should see courses for their level and semester, filtered by department admin selections
    const whereClause: any = {
      isActive: true,
      // Filter by student level (100L, 200L, 300L, 400L, 500L)
      level: user.student?.level,
      // Filter by semester if specified
      ...(semester && { semester: semester as any }),
      // Not already enrolled
      id: {
        notIn: enrolledCourseIds,
      },
    };

    // If admin has configured availability, only show those courses
    if (availableCourseIds.length > 0) {
      whereClause.id.in = availableCourseIds;
    } else {
      // If no admin configuration, show courses based on department and course type
      whereClause.OR = [
        // Department's own courses (courses created under this department)
        { departmentId: user.student.departmentId },
        // General education courses (available to all departments)
        { type: "GENERAL" },
        // Faculty-wide courses (available to all departments in the faculty)
        { type: "FACULTY" },
        // Courses that belong to the department by code (e.g., MCE courses for MCE department)
        {
          AND: [
            { code: { startsWith: user.student.department?.code || "" } },
            { departmentId: null }, // Courses not assigned to any specific department
          ],
        },
      ];
    }

    const availableCourses = await prisma.course.findMany({
      where: whereClause,
      include: {
        department: {
          select: { name: true, code: true },
        },
        school: {
          select: { name: true, code: true },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                academicYear: (academicYear as string) || "2024/2025",
                semester: (semester as any) || "FIRST",
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Create a map of course availability configurations
    const availabilityMap = new Map();
    courseAvailability.forEach((ca) => {
      availabilityMap.set(ca.courseId, ca);
    });

    // Add recommendation scoring and categorization
    const coursesWithRecommendations = availableCourses.map((course) => {
      const availability = availabilityMap.get(course.id);
      let recommendationScore = 0;
      let recommendationReason = "";
      let category = "elective";

      // Required courses get highest priority
      if (requiredCourseIds.includes(course.id)) {
        recommendationScore = 100;
        recommendationReason = "Required for your department";
        category = "required";
      }
      // Use admin-configured priority if available
      else if (availability) {
        recommendationScore = availability.priority;
        recommendationReason = availability.isRecommended
          ? "Recommended by department admin"
          : "Available for your department";

        // Determine category based on course type and department
        if (course.departmentId === user.student?.departmentId) {
          category = "departmental";
        } else if (
          course.code.startsWith(user.student.department?.code || "")
        ) {
          // Course belongs to department by code (e.g., MCE101 for MCE department)
          category = "departmental";
        } else if (course.type === "GENERAL") {
          category = "general";
        } else if (course.type === "FACULTY") {
          category = "faculty";
        } else {
          category = "elective";
        }
      }
      // If no availability configuration, use default scoring
      else {
        if (course.departmentId === user.student?.departmentId) {
          recommendationScore = 80;
          recommendationReason = "From your department";
          category = "departmental";
        } else if (
          course.code.startsWith(user.student.department?.code || "")
        ) {
          // Course belongs to department by code (e.g., MCE101 for MCE department)
          recommendationScore = 80;
          recommendationReason = "From your department (by course code)";
          category = "departmental";
        } else if (course.type === "GENERAL") {
          recommendationScore = 60;
          recommendationReason = "General education course";
          category = "general";
        } else if (course.type === "FACULTY") {
          recommendationScore = 50;
          recommendationReason = "Faculty-wide course";
          category = "faculty";
        } else {
          recommendationScore = 40;
          recommendationReason = "From other departments";
          category = "elective";
        }
      }

      // Boost score based on popularity (enrollment count)
      const popularityBoost = Math.min(course._count.enrollments * 2, 20);
      recommendationScore += popularityBoost;

      // Boost score for courses matching current semester
      if (course.semester === ((semester as any) || "FIRST")) {
        recommendationScore += 10;
      }

      return {
        ...course,
        recommendationScore,
        recommendationReason,
        category,
        isRecommended: availability?.isRecommended || recommendationScore >= 70,
        isRequired: requiredCourseIds.includes(course.id),
        adminNotes: availability?.notes,
      };
    });

    // Filter out null values and sort by recommendation score (highest first)
    const validCourses = coursesWithRecommendations.filter(
      (course) => course !== null
    );
    validCourses.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return res.status(200).json({
      courses: validCourses.map((course) => ({
        id: course.id,
        title: course.title,
        code: course.code,
        creditUnit: course.creditUnit,
        description: course.description,
        type: course.type,
        level: course.level,
        semester: course.semester,
        department: course.department,
        school: course.school,
        enrolledCount: course._count.enrollments,
        recommendationScore: course.recommendationScore,
        recommendationReason: course.recommendationReason,
        category: course.category,
        isRecommended: course.isRecommended,
        isRequired: course.isRequired,
        adminNotes: course.adminNotes,
        configuredBy: availabilityMap.get(course.id)?.admin?.name,
      })),
    });
  } catch (error) {
    console.error("Get available courses error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

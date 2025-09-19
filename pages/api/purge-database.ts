import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return res
      .status(403)
      .json({ message: "This endpoint is only available in development" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Get user with admin profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      senateAdmin: true,
    },
  });

  // Only Senate Admin can purge the database
  if (!user?.senateAdmin) {
    return res.status(403).json({
      message: "Only Senate Admins can purge the database",
    });
  }

  try {
    console.log("🧹 Starting database purge...");

    // Clear existing data in proper order (respecting foreign key constraints)
    // Start with dependent tables first
    console.log("Deleting course selections...");
    const courseSelections = await prisma.courseSelection.deleteMany();

    console.log("Deleting course registrations...");
    const courseRegistrations = await prisma.courseRegistration.deleteMany();

    console.log("Deleting course assignments...");
    const courseAssignments = await prisma.courseAssignment.deleteMany();

    console.log("Deleting enrollments...");
    const enrollments = await prisma.enrollment.deleteMany();

    console.log("Deleting results...");
    const results = await prisma.result.deleteMany();

    console.log("Deleting assessments...");
    const assessments = await prisma.assessment.deleteMany();

    console.log("Deleting content...");
    const content = await prisma.content.deleteMany();

    console.log("Deleting virtual classes...");
    const virtualClasses = await prisma.virtualClass.deleteMany();

    console.log("Deleting feedback...");
    const feedback = await prisma.feedback.deleteMany();

    console.log("Deleting course evaluations...");
    const courseEvaluations = await prisma.courseEvaluation.deleteMany();

    console.log("Deleting announcements...");
    const announcements = await prisma.announcement.deleteMany();

    console.log("Deleting assignments...");
    const assignments = await prisma.assignment.deleteMany();

    console.log("Deleting quizzes...");
    const quizzes = await prisma.quiz.deleteMany();

    console.log("Deleting chat rooms...");
    const chatRooms = await prisma.chatRoom.deleteMany();

    console.log("Deleting courses...");
    const courses = await prisma.course.deleteMany();

    console.log("Deleting department courses...");
    const departmentCourses = await prisma.departmentCourse.deleteMany();

    // Note: courseAvailability table doesn't exist in current schema

    console.log("Deleting department admins...");
    const departmentAdmins = await prisma.departmentAdmin.deleteMany();

    console.log("Deleting school admins...");
    const schoolAdmins = await prisma.schoolAdmin.deleteMany();

    console.log("Deleting senate admins...");
    const senateAdmins = await prisma.senateAdmin.deleteMany();

    console.log("Deleting lecturers...");
    const lecturers = await prisma.lecturer.deleteMany();

    console.log("Deleting students...");
    const students = await prisma.student.deleteMany();

    console.log("Deleting departments...");
    const departments = await prisma.department.deleteMany();

    console.log("Deleting schools...");
    const schools = await prisma.school.deleteMany();

    console.log("Deleting users...");
    const users = await prisma.user.deleteMany();

    console.log("✅ Database purge completed successfully!");

    return res.status(200).json({
      message: "Database purged successfully!",
      purgedData: {
        courseSelections: courseSelections.count,
        courseRegistrations: courseRegistrations.count,
        courseAssignments: courseAssignments.count,
        enrollments: enrollments.count,
        results: results.count,
        assessments: assessments.count,
        content: content.count,
        virtualClasses: virtualClasses.count,
        feedback: feedback.count,
        courseEvaluations: courseEvaluations.count,
        announcements: announcements.count,
        assignments: assignments.count,
        quizzes: quizzes.count,
        chatRooms: chatRooms.count,
        courses: courses.count,
        departmentCourses: departmentCourses.count,
        // courseAvailability: courseAvailability.count, // Table doesn't exist
        departmentAdmins: departmentAdmins.count,
        schoolAdmins: schoolAdmins.count,
        senateAdmins: senateAdmins.count,
        lecturers: lecturers.count,
        students: students.count,
        departments: departments.count,
        schools: schools.count,
        users: users.count,
      },
    });
  } catch (error) {
    console.error("Purge error:", error);
    return res.status(500).json({
      message: "Database purge failed",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

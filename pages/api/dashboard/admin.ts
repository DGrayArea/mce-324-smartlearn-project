import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    const userId = (session?.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user with admin profile - optimized query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        senateAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
        schoolAdmin: {
          select: {
            id: true,
            name: true,
            schoolId: true,
            school: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        departmentAdmin: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            department: {
              select: {
                name: true,
                code: true,
                school: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate stats based on admin level
    let stats;
    let recentActivity;
    let courses = [];

    if (user.role === "SENATE_ADMIN") {
      // Senate Admin - system-wide stats
      const totalUsers = await prisma.user.count();
      const totalStudents = await prisma.student.count();
      const totalLecturers = await prisma.lecturer.count();
      const activeCourses = await prisma.course.count({
        where: { isActive: true },
      });
      const systemLoad = 78; // TODO: Implement real system monitoring
      const supportTickets = await prisma.supportTicket.count({
        where: { status: "OPEN" },
      });
      const revenue = 24500; // TODO: Implement real revenue tracking
      const serverUptime = 99.9; // TODO: Implement real uptime monitoring

      // Fetch all courses for Senate Admin
      const rawCourses = await prisma.course.findMany({
        where: { isActive: true },
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
        orderBy: { createdAt: "desc" },
      });

      // Transform courses to match frontend expected format
      courses = rawCourses.map((course) => ({
        id: course.id,
        name: course.title,
        code: course.code,
        credits: course.creditUnit,
        description: course.description || "",
        semester: course.semester,
        status: "active",
        students: course._count.enrollments,
        schedule: `${course.semester} Semester`,
        department: course.department?.name || "N/A",
        school: course.school?.name || "N/A",
        type: course.type,
        level: course.level,
        // Keep original properties for admin functionality
        title: course.title,
        creditUnit: course.creditUnit,
        departmentId: course.departmentId,
        schoolId: course.schoolId,
      }));

      stats = {
        totalUsers,
        activeCourses,
        systemLoad: `${systemLoad}%`,
        supportTickets,
        revenue: `$${(revenue / 1000).toFixed(1)}k`,
        serverUptime: `${serverUptime}%`,
      };

      recentActivity = [
        "Approved 3 new course registrations",
        "Reviewed system performance metrics",
        "Updated platform security settings",
        "Processed 12 support tickets",
      ];
    } else if (user.role === "SCHOOL_ADMIN") {
      // School Admin - school-specific stats
      const schoolId = user.schoolAdmin?.schoolId;
      const schoolUsers = await prisma.user.count({
        where: {
          OR: [
            { student: { department: { schoolId } } },
            { lecturer: { department: { schoolId } } },
            { departmentAdmin: { department: { schoolId } } },
            { schoolAdmin: { schoolId } },
          ],
        },
      });
      const schoolCourses = await prisma.course.count({
        where: { schoolId, isActive: true },
      });
      const schoolStudents = await prisma.student.count({
        where: { department: { schoolId } },
      });
      const schoolLecturers = await prisma.lecturer.count({
        where: { department: { schoolId } },
      });
      const schoolEnrollments = await prisma.enrollment.count({
        where: {
          course: { schoolId },
          isActive: true,
        },
      });

      // Fetch courses for this school
      const rawCourses = await prisma.course.findMany({
        where: { schoolId, isActive: true },
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
        orderBy: { createdAt: "desc" },
      });

      // Transform courses to match frontend expected format
      courses = rawCourses.map((course) => ({
        id: course.id,
        name: course.title,
        code: course.code,
        credits: course.creditUnit,
        description: course.description || "",
        semester: course.semester,
        status: "active",
        students: course._count.enrollments,
        schedule: `${course.semester} Semester`,
        department: course.department?.name || "N/A",
        school: course.school?.name || "N/A",
        type: course.type,
        level: course.level,
        // Keep original properties for admin functionality
        title: course.title,
        creditUnit: course.creditUnit,
        departmentId: course.departmentId,
        schoolId: course.schoolId,
      }));

      // Calculate real average grade for school
      const schoolResults = await prisma.result.findMany({
        where: {
          student: { department: { schoolId } },
          status: "SENATE_APPROVED",
        },
        select: { grade: true },
      });

      const schoolGradePoints = schoolResults.map((r) => {
        const grade = r.grade?.toUpperCase();
        switch (grade) {
          case "A":
            return 4.0;
          case "B":
            return 3.0;
          case "C":
            return 2.0;
          case "D":
            return 1.0;
          case "F":
            return 0.0;
          default:
            return 0.0;
        }
      });

      const schoolAverageGrade =
        schoolGradePoints.length > 0
          ? (
              schoolGradePoints.reduce((sum, gp) => sum + gp, 0) /
              schoolGradePoints.length
            ).toFixed(1)
          : "0.0";

      stats = {
        totalUsers: schoolUsers,
        activeCourses: schoolCourses,
        totalStudents: schoolStudents,
        totalLecturers: schoolLecturers,
        totalEnrollments: schoolEnrollments,
        averageGrade: schoolAverageGrade,
      };

      recentActivity = [
        "Reviewed school performance metrics",
        "Approved department course proposals",
        "Scheduled faculty meeting",
        "Updated school policies",
      ];
    } else if (user.role === "DEPARTMENT_ADMIN") {
      // Department Admin - department-specific stats
      const departmentId = user.departmentAdmin?.departmentId;
      const deptStudents = await prisma.student.count({
        where: { departmentId },
      });
      const deptLecturers = await prisma.lecturer.count({
        where: { departmentId },
      });
      const deptCourses = await prisma.course.count({
        where: { departmentId, isActive: true },
      });
      const deptEnrollments = await prisma.enrollment.count({
        where: {
          course: { departmentId },
          isActive: true,
        },
      });

      // Fetch courses for this department
      const rawCourses = await prisma.course.findMany({
        where: { departmentId, isActive: true },
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
        orderBy: { createdAt: "desc" },
      });

      // Transform courses to match frontend expected format
      courses = rawCourses.map((course) => ({
        id: course.id,
        name: course.title,
        code: course.code,
        credits: course.creditUnit,
        description: course.description || "",
        semester: course.semester,
        status: "active",
        students: course._count.enrollments,
        schedule: `${course.semester} Semester`,
        department: course.department?.name || "N/A",
        school: course.school?.name || "N/A",
        type: course.type,
        level: course.level,
        // Keep original properties for admin functionality
        title: course.title,
        creditUnit: course.creditUnit,
        departmentId: course.departmentId,
        schoolId: course.schoolId,
      }));

      // Calculate real average grade and pass rate
      const deptResults = await prisma.result.findMany({
        where: {
          student: { departmentId },
          status: "SENATE_APPROVED",
        },
        select: { grade: true },
      });

      const gradePoints = deptResults.map((r) => {
        const grade = r.grade?.toUpperCase();
        switch (grade) {
          case "A":
            return 4.0;
          case "B":
            return 3.0;
          case "C":
            return 2.0;
          case "D":
            return 1.0;
          case "F":
            return 0.0;
          default:
            return 0.0;
        }
      });

      const averageGrade =
        gradePoints.length > 0
          ? (
              gradePoints.reduce((sum, gp) => sum + gp, 0) / gradePoints.length
            ).toFixed(1)
          : "0.0";

      const passRate =
        deptResults.length > 0
          ? Math.round(
              (deptResults.filter(
                (r) => r.grade && !["F"].includes(r.grade.toUpperCase())
              ).length /
                deptResults.length) *
                100
            )
          : 0;

      stats = {
        totalStudents: deptStudents,
        totalLecturers: deptLecturers,
        activeCourses: deptCourses,
        totalEnrollments: deptEnrollments,
        averageGrade,
        passRate: `${passRate}%`,
      };

      recentActivity = [
        "Approved course registrations",
        "Reviewed student applications",
        "Scheduled department meeting",
        "Updated course curriculum",
      ];
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const dashboardData = {
      stats,
      recentActivity,
      courses,
      role: user.role,
      profile: {
        senateAdmin: user.senateAdmin,
        schoolAdmin: user.schoolAdmin,
        departmentAdmin: user.departmentAdmin,
      },
    };

    res.status(200).json(dashboardData);
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);
    res
      .status(500)
      .json({ message: "Error fetching dashboard data", error: error.message });
  }
}

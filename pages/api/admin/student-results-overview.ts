/**
 * Admin Student Results Overview API
 * Provides comprehensive view of student results across all courses for admins
 */

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

    const { academicYear, semester, level, status } = req.query;

    // Get user with admin roles
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        departmentAdmin: {
          include: { department: { select: { name: true, code: true } } },
        },
        schoolAdmin: {
          include: { school: { select: { name: true, code: true } } },
        },
        senateAdmin: true,
      },
    });

    if (
      !user ||
      (!user.departmentAdmin && !user.schoolAdmin && !user.senateAdmin)
    ) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Build where clause based on admin level
    const whereClause: any = {};

    if (academicYear) {
      whereClause.academicYear = academicYear;
    }

    if (semester && semester !== "ALL") {
      whereClause.semester = semester;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (level && level !== "ALL") {
      whereClause.student = { level: level };
    }

    // Filter based on admin level - admins view student results as a whole
    if (user.departmentAdmin) {
      // Department admins see all students in their department across all courses
      whereClause.student = {
        ...whereClause.student,
        departmentId: user.departmentAdmin.departmentId,
      };
    } else if (user.schoolAdmin) {
      // School admins see all students in their school across all courses
      whereClause.student = {
        ...whereClause.student,
        department: { schoolId: user.schoolAdmin.schoolId },
      };
    }
    // Senate admins can see all results across all students and courses

    // Get all results with comprehensive student and course information
    const results = await prisma.result.findMany({
      where: whereClause,
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
            level: true,
            department: {
              select: {
                name: true,
                code: true,
                school: { select: { name: true, code: true } },
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            creditUnit: true,
            semester: true,
            level: true,
            department: {
              select: { name: true, code: true },
            },
            school: {
              select: { name: true, code: true },
            },
          },
        },
        approvals: {
          include: {
            departmentAdmin: { select: { name: true } },
            schoolAdmin: { select: { name: true } },
            senateAdmin: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [
        { student: { matricNumber: "asc" } },
        { academicYear: "desc" },
        { semester: "desc" },
        { course: { code: "asc" } },
      ],
    });

    // Group results by student for comprehensive view
    const studentResults = results.reduce(
      (acc, result) => {
        const studentId = result.student.id;
        if (!acc[studentId]) {
          acc[studentId] = {
            student: result.student,
            results: [],
            totalCredits: 0,
            totalGradePoints: 0,
            cgpa: 0,
            statistics: {
              total: 0,
              passed: 0,
              failed: 0,
              weakPass: 0,
              gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
            },
          };
        }
        acc[studentId].results.push(result);
        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate statistics for each student
    Object.values(studentResults).forEach((studentData: any) => {
      const approvedResults = studentData.results.filter(
        (r: any) => r.status === "SENATE_APPROVED"
      );

      let totalCredits = 0;
      let totalGradePoints = 0;

      approvedResults.forEach((result: any) => {
        const creditUnit = result.course.creditUnit;
        const grade = result.grade;

        // Grade point mapping
        const gradePoints: Record<string, number> = {
          A: 5.0,
          B: 4.0,
          C: 3.0,
          D: 2.0,
          E: 1.0,
          F: 0.0,
        };

        const points = gradePoints[grade] || 0;
        totalCredits += creditUnit;
        totalGradePoints += points * creditUnit;

        // Update statistics
        studentData.statistics.total++;
        studentData.statistics.gradeDistribution[grade]++;

        if (["A", "B", "C", "D"].includes(grade)) {
          studentData.statistics.passed++;
        } else if (grade === "E") {
          studentData.statistics.weakPass++;
        } else {
          studentData.statistics.failed++;
        }
      });

      studentData.totalCredits = totalCredits;
      studentData.totalGradePoints = totalGradePoints;
      studentData.cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
      studentData.statistics.passRate =
        studentData.statistics.total > 0
          ? Math.round(
              (studentData.statistics.passed / studentData.statistics.total) *
                100
            )
          : 0;
    });

    // Calculate overall statistics
    const totalStudents = Object.keys(studentResults).length;
    const totalResults = results.length;
    const pendingResults = results.filter((r) => r.status === "PENDING").length;
    const departmentApproved = results.filter(
      (r) => r.status === "DEPARTMENT_APPROVED"
    ).length;
    const facultyApproved = results.filter(
      (r) => r.status === "FACULTY_APPROVED"
    ).length;
    const senateApproved = results.filter(
      (r) => r.status === "SENATE_APPROVED"
    ).length;
    const rejectedResults = results.filter(
      (r) => r.status === "REJECTED"
    ).length;

    // Get results by level
    const resultsByLevel = results.reduce(
      (acc, result) => {
        const level = result.student.level;
        if (!acc[level]) {
          acc[level] = { total: 0, approved: 0, pending: 0, rejected: 0 };
        }
        acc[level].total++;
        if (result.status === "SENATE_APPROVED") acc[level].approved++;
        else if (result.status === "PENDING") acc[level].pending++;
        else if (result.status === "REJECTED") acc[level].rejected++;
        return acc;
      },
      {} as Record<string, any>
    );

    // Get results by department
    const resultsByDepartment = results.reduce(
      (acc, result) => {
        const dept = result.student.department.code;
        if (!acc[dept]) {
          acc[dept] = {
            name: result.student.department.name,
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
          };
        }
        acc[dept].total++;
        if (result.status === "SENATE_APPROVED") acc[dept].approved++;
        else if (result.status === "PENDING") acc[dept].pending++;
        else if (result.status === "REJECTED") acc[dept].rejected++;
        return acc;
      },
      {} as Record<string, any>
    );

    return res.status(200).json({
      adminInfo: {
        role: user.departmentAdmin
          ? "DEPARTMENT_ADMIN"
          : user.schoolAdmin
            ? "SCHOOL_ADMIN"
            : "SENATE_ADMIN",
        department: user.departmentAdmin?.department,
        school: user.schoolAdmin?.school,
      },
      studentResults: Object.values(studentResults),
      statistics: {
        totalStudents,
        totalResults,
        pendingResults,
        departmentApproved,
        facultyApproved,
        senateApproved,
        rejectedResults,
        resultsByLevel,
        resultsByDepartment,
      },
      filters: {
        academicYear,
        semester,
        level,
        status,
      },
    });
  } catch (error) {
    console.error("Error fetching admin student results overview:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

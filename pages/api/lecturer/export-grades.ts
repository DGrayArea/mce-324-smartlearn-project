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

  const { method } = req;

  switch (method) {
    case "GET":
      return handleExportGrades(req, res, session.user.id);
    default:
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handleExportGrades(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { courseId, academicYear, semester, format = "csv" } = req.query;

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only lecturers and admins can export grades
    if (
      ![
        "LECTURER",
        "DEPARTMENT_ADMIN",
        "SCHOOL_ADMIN",
        "SENATE_ADMIN",
      ].includes(user.role || "")
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // Build where clause
    const where: any = {};

    if (courseId) {
      where.courseId = courseId as string;
    }

    if (academicYear) {
      where.academicYear = academicYear as string;
    }

    if (semester) {
      where.semester = semester as string;
    }

    // If user is lecturer, only show their courses
    if (user.role === "LECTURER") {
      const lecturer = await prisma.lecturer.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!lecturer) {
        return res.status(404).json({ message: "Lecturer profile not found" });
      }

      // Get courses assigned to this lecturer
      const assignedCourses = await prisma.courseAssignment.findMany({
        where: { lecturerId: lecturer.id },
        select: { courseId: true },
      });

      const courseIds = assignedCourses.map((ac) => ac.courseId);
      where.courseId = { in: courseIds };
    }

    // Fetch results with related data
    const results = await prisma.result.findMany({
      where,
      include: {
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
          },
        },
        approvals: {
          include: {
            departmentAdmin: {
              select: { name: true },
            },
            schoolAdmin: {
              select: { name: true },
            },
            senateAdmin: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [
        { student: { matricNumber: "asc" } },
        { course: { code: "asc" } },
      ],
    });

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = [
        "Matric Number",
        "Student Name",
        "Department",
        "Level",
        "Course Code",
        "Course Title",
        "Credit Unit",
        "Academic Year",
        "Semester",
        "CA Score",
        "Exam Score",
        "Total Score",
        "Grade",
        "Status",
        "Department Approval",
        "School Approval",
        "Senate Approval",
      ];

      const csvRows = results.map((result) => {
        const deptApproval = result.approvals.find(
          (a) => a.level === "DEPARTMENT_ADMIN"
        );
        const schoolApproval = result.approvals.find(
          (a) => a.level === "SCHOOL_ADMIN"
        );
        const senateApproval = result.approvals.find(
          (a) => a.level === "SENATE_ADMIN"
        );

        return [
          result.student.matricNumber,
          result.student.name,
          result.student.department.name,
          result.student.level,
          result.course.code,
          result.course.title,
          result.course.creditUnit,
          result.academicYear,
          result.semester,
          result.caScore,
          result.examScore,
          result.totalScore,
          result.grade,
          result.status,
          deptApproval
            ? `${deptApproval.status} by ${deptApproval.departmentAdmin?.name || "N/A"}`
            : "Pending",
          schoolApproval
            ? `${schoolApproval.status} by ${schoolApproval.schoolAdmin?.name || "N/A"}`
            : "Pending",
          senateApproval
            ? `${senateApproval.status} by ${senateApproval.senateAdmin?.name || "N/A"}`
            : "Pending",
        ];
      });

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      // Set headers for CSV download
      const filename = `grades_export_${new Date().toISOString().split("T")[0]}.csv`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      return res.status(200).send(csvContent);
    } else if (format === "excel") {
      // For Excel format, we'll return JSON data that can be processed by the frontend
      const excelData = results.map((result) => {
        const deptApproval = result.approvals.find(
          (a) => a.level === "DEPARTMENT_ADMIN"
        );
        const schoolApproval = result.approvals.find(
          (a) => a.level === "SCHOOL_ADMIN"
        );
        const senateApproval = result.approvals.find(
          (a) => a.level === "SENATE_ADMIN"
        );

        return {
          matricNumber: result.student.matricNumber,
          studentName: result.student.name,
          department: result.student.department.name,
          level: result.student.level,
          courseCode: result.course.code,
          courseTitle: result.course.title,
          creditUnit: result.course.creditUnit,
          academicYear: result.academicYear,
          semester: result.semester,
          caScore: result.caScore,
          examScore: result.examScore,
          totalScore: result.totalScore,
          grade: result.grade,
          status: result.status,
          departmentApproval: deptApproval
            ? `${deptApproval.status} by ${deptApproval.departmentAdmin?.name || "N/A"}`
            : "Pending",
          schoolApproval: schoolApproval
            ? `${schoolApproval.status} by ${schoolApproval.schoolAdmin?.name || "N/A"}`
            : "Pending",
          senateApproval: senateApproval
            ? `${senateApproval.status} by ${senateApproval.senateAdmin?.name || "N/A"}`
            : "Pending",
        };
      });

      return res.status(200).json({
        data: excelData,
        filename: `grades_export_${new Date().toISOString().split("T")[0]}.xlsx`,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid format. Use 'csv' or 'excel'" });
    }
  } catch (error) {
    console.error("Error exporting grades:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

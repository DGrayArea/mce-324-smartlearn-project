import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { lecturer: true },
  });

  if (!user?.lecturer) {
    return res.status(403).json({
      message: "Forbidden: Only lecturers can export student data",
    });
  }

  const {
    courseId,
    academicYear,
    semester,
    format = "xlsx",
    includeGrades = "true",
  } = req.query;

  if (!courseId) {
    return res.status(400).json({ message: "Course ID is required" });
  }

  try {
    // Verify lecturer is assigned to this course
    const courseAssignment = await prisma.courseAssignment.findFirst({
      where: {
        lecturerId: user.lecturer.id,
        courseId: courseId as string,
        isActive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            creditUnit: true,
          },
        },
      },
    });

    if (!courseAssignment) {
      return res.status(403).json({
        message: "You are not assigned to this course",
      });
    }

    // Get enrolled students for this course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: courseId as string,
        isActive: true,
        ...(academicYear && { academicYear: academicYear as string }),
        ...(semester && { semester: semester as any }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          matricNumber: "asc",
        },
      },
    });

    // Get results for these students in this course
    const results = await prisma.result.findMany({
      where: {
        courseId: courseId as string,
        studentId: { in: enrollments.map((e) => e.studentId) },
        ...(academicYear && { academicYear: academicYear as string }),
        ...(semester && { semester: semester as any }),
      },
      select: {
        id: true,
        studentId: true,
        caScore: true,
        examScore: true,
        totalScore: true,
        grade: true,
        status: true,
      },
    });

    // Format data for export
    const exportData = enrollments.map((enrollment) => {
      const student = enrollment.student;
      const result = results.find((r) => r.studentId === enrollment.studentId);

      // Split name into first and last
      const nameParts = student.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const baseData = {
        "Matric Number": student.matricNumber,
        "First Name": firstName,
        "Last Name": lastName,
        "Full Name": student.name,
        Department: student.department.name,
        "Department Code": student.department.code,
        "Course Code": courseAssignment.course.code,
        "Course Title": courseAssignment.course.title,
        "Credit Unit": courseAssignment.course.creditUnit,
        "Academic Year": enrollment.academicYear,
        Semester: enrollment.semester,
      };

      // Add grade information only if requested
      if (includeGrades === "true") {
        return {
          ...baseData,
          "CA Score": result?.caScore || "N/A",
          "Exam Score": result?.examScore || "N/A",
          "Total Score": result?.totalScore || "N/A",
          Grade: result?.grade || "N/A",
          Status: result?.status || "No Grade",
        };
      }

      return baseData;
    });

    if (format === "xlsx") {
      // Generate Excel file
      const workbook = XLSX.utils.book_new();

      // Create main data sheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths based on whether grades are included
      const columnWidths =
        includeGrades === "true"
          ? [
              { wch: 15 }, // Matric Number
              { wch: 15 }, // First Name
              { wch: 15 }, // Last Name
              { wch: 25 }, // Full Name
              { wch: 20 }, // Department
              { wch: 10 }, // Department Code
              { wch: 10 }, // Course Code
              { wch: 30 }, // Course Title
              { wch: 10 }, // Credit Unit
              { wch: 12 }, // Academic Year
              { wch: 10 }, // Semester
              { wch: 10 }, // CA Score
              { wch: 10 }, // Exam Score
              { wch: 10 }, // Total Score
              { wch: 8 }, // Grade
              { wch: 15 }, // Status
            ]
          : [
              { wch: 15 }, // Matric Number
              { wch: 15 }, // First Name
              { wch: 15 }, // Last Name
              { wch: 25 }, // Full Name
              { wch: 20 }, // Department
              { wch: 10 }, // Department Code
              { wch: 10 }, // Course Code
              { wch: 30 }, // Course Title
              { wch: 10 }, // Credit Unit
              { wch: 12 }, // Academic Year
              { wch: 10 }, // Semester
            ];
      worksheet["!cols"] = columnWidths;

      // Add summary sheet
      const summaryData = [
        { "Course Code": courseAssignment.course.code },
        { "Course Title": courseAssignment.course.title },
        { "Credit Unit": courseAssignment.course.creditUnit },
        { "Academic Year": academicYear || "All" },
        { Semester: semester || "All" },
        { "Total Students": exportData.length },
        { "Include Grades": includeGrades === "true" ? "Yes" : "No" },
        { "Generated By": user.name },
        { "Generated At": new Date().toLocaleString() },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet["!cols"] = [{ wch: 20 }, { wch: 30 }];

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Student List");
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
        compression: true,
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Students-${courseAssignment.course.code}-${academicYear || "all"}-${semester || "all"}-${includeGrades === "true" ? "with-grades" : "basic"}.xlsx"`
      );
      return res.status(200).send(excelBuffer);
    } else if (format === "csv") {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              // Escape commas and quotes in CSV
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="students-${courseAssignment.course.code}-${academicYear || "all"}-${semester || "all"}-${includeGrades === "true" ? "with-grades" : "basic"}.csv"`
      );
      return res.status(200).send(csvContent);
    } else {
      return res
        .status(400)
        .json({ message: "Invalid format. Use 'xlsx' or 'csv'" });
    }
  } catch (error) {
    console.error("Error exporting student data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

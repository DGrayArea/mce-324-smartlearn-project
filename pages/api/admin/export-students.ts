import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { calculateComprehensiveGPA } from "@/lib/gpa-calculator";
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
    include: {
      departmentAdmin: { include: { department: true } },
      schoolAdmin: { include: { school: true } },
      senateAdmin: true,
    },
  });

  if (!user?.departmentAdmin && !user?.schoolAdmin && !user?.senateAdmin) {
    return res.status(403).json({
      message: "Forbidden: Only admins can export student data",
    });
  }

  const {
    academicYear,
    semester,
    level,
    departmentId,
    format = "xlsx",
    includeGrades = "true",
    includeTranscript = "false",
  } = req.query;

  try {
    // Determine admin scope
    let whereClause: any = {};
    let adminScope = "";

    if (user.departmentAdmin) {
      whereClause.departmentId = user.departmentAdmin.departmentId;
      adminScope = `Department: ${user.departmentAdmin.department.name}`;
    } else if (user.schoolAdmin) {
      whereClause.department = { schoolId: user.schoolAdmin.schoolId };
      adminScope = `School: ${user.schoolAdmin.school.name}`;
    } else if (user.senateAdmin) {
      adminScope = "Senate (All Students)";
    }

    // Add additional filters
    if (academicYear && academicYear !== "ALL") {
      whereClause.enrollments = {
        some: { academicYear: academicYear as string },
      };
    }
    if (semester && semester !== "ALL") {
      whereClause.enrollments = {
        some: {
          ...whereClause.enrollments,
          semester: semester as any,
        },
      };
    }
    if (level && level !== "ALL") {
      whereClause.level = level as any;
    }
    if (departmentId && departmentId !== "ALL") {
      whereClause.departmentId = departmentId as string;
    }

    // Get students with their academic data
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
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
        enrollments: {
          where: {
            isActive: true,
            ...(academicYear &&
              academicYear !== "ALL" && {
                academicYear: academicYear as string,
              }),
            ...(semester &&
              semester !== "ALL" && { semester: semester as any }),
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
        },
        results: {
          where: {
            ...(academicYear &&
              academicYear !== "ALL" && {
                academicYear: academicYear as string,
              }),
            ...(semester &&
              semester !== "ALL" && { semester: semester as any }),
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
            courseId: true,
          },
        },
      },
      orderBy: {
        matricNumber: "asc",
      },
    });

    // Format data for export
    const exportData = await Promise.all(
      students.map(async (student) => {
        const nameParts = student.user.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const baseData = {
          "Matric Number": student.matricNumber,
          "First Name": firstName,
          "Last Name": lastName,
          "Full Name": student.user.name,
          Email: student.user.email,
          Department: student.department.name,
          "Department Code": student.department.code,
          School: student.department.school.name,
          "School Code": student.department.school.code,
          Level: student.level,
          "Academic Year": academicYear || "All",
          Semester: semester || "All",
        };

        if (includeGrades === "true") {
          // Calculate CGPA and GPA
          const allResults = student.results.map((result) => {
            const enrollment = student.enrollments.find(
              (e) => e.courseId === result.courseId
            );
            return {
              id: result.id,
              grade: result.grade,
              creditUnit: enrollment?.course.creditUnit || 0,
              academicYear: result.academicYear,
              semester: result.semester,
              level: student.level,
              courseCode: enrollment?.course.code || "Unknown",
              status: result.status,
            };
          });

          const comprehensiveGPA = calculateComprehensiveGPA(allResults);

          return {
            ...baseData,
            "Total Credits": comprehensiveGPA.totalCredits,
            CGPA: comprehensiveGPA.cgpa,
            "Academic Standing": comprehensiveGPA.progression.currentLevel,
            "Can Graduate": comprehensiveGPA.progression.canGraduate,
            "Total Courses": student.enrollments.length,
            "Courses with Grades": allResults.length,
          };
        } else {
          // Just basic student info without grades
          return {
            ...baseData,
            "Total Courses": student.enrollments.length,
          };
        }
      })
    );

    if (includeTranscript === "true" && includeGrades === "true") {
      // Include detailed transcript data
      const transcriptData = students.map((student) => {
        const nameParts = student.user.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        return {
          student: {
            "Matric Number": student.matricNumber,
            "First Name": firstName,
            "Last Name": lastName,
            "Full Name": student.user.name,
            Department: student.department.name,
            Level: student.level,
          },
          courses: student.enrollments.map((enrollment) => {
            const result = student.results.find(
              (r) => r.courseId === enrollment.courseId
            );
            return {
              "Course Code": enrollment.course.code,
              "Course Title": enrollment.course.title,
              "Credit Unit": enrollment.course.creditUnit,
              "Academic Year": enrollment.academicYear,
              Semester: enrollment.semester,
              "CA Score": result?.caScore || "N/A",
              "Exam Score": result?.examScore || "N/A",
              "Total Score": result?.totalScore || "N/A",
              Grade: result?.grade || "N/A",
              Status: result?.status || "No Grade",
            };
          }),
        };
      });

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="student-transcripts-${academicYear || "all"}-${semester || "all"}.json"`
        );
        return res.status(200).json({
          adminScope,
          academicYear: academicYear || "All",
          semester: semester || "All",
          totalStudents: transcriptData.length,
          transcripts: transcriptData,
        });
      }
    }

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
              { wch: 25 }, // Email
              { wch: 20 }, // Department
              { wch: 10 }, // Department Code
              { wch: 20 }, // School
              { wch: 10 }, // School Code
              { wch: 10 }, // Level
              { wch: 12 }, // Academic Year
              { wch: 10 }, // Semester
              { wch: 10 }, // Total Credits
              { wch: 8 }, // CGPA
              { wch: 15 }, // Academic Standing
              { wch: 12 }, // Can Graduate
              { wch: 10 }, // Total Courses
              { wch: 15 }, // Courses with Grades
            ]
          : [
              { wch: 15 }, // Matric Number
              { wch: 15 }, // First Name
              { wch: 15 }, // Last Name
              { wch: 25 }, // Full Name
              { wch: 25 }, // Email
              { wch: 20 }, // Department
              { wch: 10 }, // Department Code
              { wch: 20 }, // School
              { wch: 10 }, // School Code
              { wch: 10 }, // Level
              { wch: 12 }, // Academic Year
              { wch: 10 }, // Semester
              { wch: 10 }, // Total Courses
            ];
      worksheet["!cols"] = columnWidths;

      // Add summary sheet
      const summaryData = [
        { "Admin Scope": adminScope },
        { "Academic Year": academicYear || "All" },
        { Semester: semester || "All" },
        { Level: level || "All" },
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
        `attachment; filename="Students-${academicYear || "all"}-${semester || "all"}-${includeGrades === "true" ? "with-grades" : "basic"}.xlsx"`
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
        `attachment; filename="students-${academicYear || "all"}-${semester || "all"}-${includeGrades === "true" ? "with-grades" : "basic"}.csv"`
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

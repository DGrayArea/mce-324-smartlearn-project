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
      message: "Forbidden: Only admins can export transcripts",
    });
  }

  const {
    studentIds,
    matricNumbers,
    format = "xlsx",
    includeAllSessions = "true",
  } = req.query;

  try {
    let whereClause: any = {};
    let adminScope = "";

    // Determine admin scope
    if (user.departmentAdmin) {
      whereClause.departmentId = user.departmentAdmin.departmentId;
      adminScope = `Department: ${user.departmentAdmin.department.name}`;
    } else if (user.schoolAdmin) {
      whereClause.department = { schoolId: user.schoolAdmin.schoolId };
      adminScope = `School: ${user.schoolAdmin.school.name}`;
    } else if (user.senateAdmin) {
      adminScope = "Senate (All Students)";
    }

    // Add student filters
    if (studentIds) {
      const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
      whereClause.id = { in: ids };
    } else if (matricNumbers) {
      const matricNums = Array.isArray(matricNumbers)
        ? matricNumbers
        : [matricNumbers];
      whereClause.matricNumber = { in: matricNums };
    }

    // Get students with complete academic history
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
            ...(includeAllSessions === "false" && {
              academicYear: "2024/2025", // Current session only
            }),
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
              },
            },
          },
          orderBy: [
            { academicYear: "asc" },
            { semester: "asc" },
            { course: { code: "asc" } },
          ],
        },
        results: {
          where: {
            ...(includeAllSessions === "false" && {
              academicYear: "2024/2025", // Current session only
            }),
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
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ academicYear: "asc" }, { semester: "asc" }],
        },
      },
      orderBy: {
        matricNumber: "asc",
      },
    });

    // Generate comprehensive transcripts
    const transcripts = await Promise.all(
      students.map(async (student) => {
        const nameParts = student.user.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Calculate comprehensive GPA
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
            level: enrollment?.course.level || "LEVEL_100",
            courseCode: enrollment?.course.code || "Unknown",
            status: result.status,
          };
        });

        const comprehensiveGPA = calculateComprehensiveGPA(allResults);

        // Group courses by academic year and semester
        const coursesBySession = student.enrollments.reduce(
          (acc, enrollment) => {
            const key = `${enrollment.academicYear}-${enrollment.semester}`;
            if (!acc[key]) {
              acc[key] = {
                academicYear: enrollment.academicYear,
                semester: enrollment.semester,
                courses: [],
                totalCredits: 0,
                totalGradePoints: 0,
              };
            }

            const result = student.results.find(
              (r) => r.courseId === enrollment.courseId
            );
            const courseData = {
              courseCode: enrollment.course.code,
              courseTitle: enrollment.course.title,
              creditUnit: enrollment.course.creditUnit,
              level: enrollment.course.level,
              caScore: result?.caScore || null,
              examScore: result?.examScore || null,
              totalScore: result?.totalScore || null,
              grade: result?.grade || null,
              status: result?.status || "No Grade",
              gradePoint: result?.grade
                ? result.grade === "A"
                  ? 5.0
                  : result.grade === "B"
                    ? 4.0
                    : result.grade === "C"
                      ? 3.0
                      : result.grade === "D"
                        ? 2.0
                        : result.grade === "E"
                          ? 1.0
                          : 0.0
                : 0,
            };

            acc[key].courses.push(courseData);
            acc[key].totalCredits += enrollment.course.creditUnit;
            acc[key].totalGradePoints +=
              courseData.gradePoint * enrollment.course.creditUnit;

            return acc;
          },
          {} as any
        );

        // Calculate session GPAs
        const sessionGPAs = Object.values(coursesBySession).map(
          (session: any) => ({
            academicYear: session.academicYear,
            semester: session.semester,
            totalCredits: session.totalCredits,
            totalGradePoints: session.totalGradePoints,
            gpa:
              session.totalCredits > 0
                ? session.totalGradePoints / session.totalCredits
                : 0,
            courses: session.courses,
          })
        );

        return {
          studentInfo: {
            matricNumber: student.matricNumber,
            firstName,
            lastName,
            fullName: student.user.name,
            email: student.user.email,
            department: student.department.name,
            departmentCode: student.department.code,
            school: student.department.school.name,
            schoolCode: student.department.school.code,
            currentLevel: student.level,
            admissionYear: student.matricNumber.substring(0, 4), // Extract year from matric number
          },
          academicSummary: {
            totalCredits: comprehensiveGPA.totalCredits,
            totalGradePoints: comprehensiveGPA.totalGradePoints,
            cgpa: comprehensiveGPA.cgpa,
            currentLevel: comprehensiveGPA.progression.currentLevel,
            nextLevel: comprehensiveGPA.progression.nextLevel,
            canGraduate: comprehensiveGPA.progression.canGraduate,
            graduationRequirements:
              comprehensiveGPA.progression.graduationRequirements,
            academicStanding: comprehensiveGPA.statistics,
          },
          sessionGPAs,
          levelGPAs: comprehensiveGPA.levelGPAs,
          allCourses: student.enrollments.map((enrollment) => {
            const result = student.results.find(
              (r) => r.courseId === enrollment.courseId
            );
            return {
              courseCode: enrollment.course.code,
              courseTitle: enrollment.course.title,
              creditUnit: enrollment.course.creditUnit,
              level: enrollment.course.level,
              academicYear: enrollment.academicYear,
              semester: enrollment.semester,
              caScore: result?.caScore || null,
              examScore: result?.examScore || null,
              totalScore: result?.totalScore || null,
              grade: result?.grade || null,
              status: result?.status || "No Grade",
              gradePoint: result?.grade
                ? result.grade === "A"
                  ? 5.0
                  : result.grade === "B"
                    ? 4.0
                    : result.grade === "C"
                      ? 3.0
                      : result.grade === "D"
                        ? 2.0
                        : result.grade === "E"
                          ? 1.0
                          : 0.0
                : 0,
            };
          }),
        };
      })
    );

    if (format === "xlsx") {
      // Generate Excel file with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Create summary sheet
      const summaryData = transcripts.map((transcript) => ({
        "Matric Number": transcript.studentInfo.matricNumber,
        "Full Name": transcript.studentInfo.fullName,
        Department: transcript.studentInfo.department,
        "Current Level": transcript.studentInfo.currentLevel,
        CGPA: transcript.academicSummary.cgpa,
        "Total Credits": transcript.academicSummary.totalCredits,
        "Academic Standing": transcript.academicSummary.currentLevel,
        "Can Graduate": transcript.academicSummary.canGraduate ? "Yes" : "No",
        "Total Courses": transcript.allCourses.length,
        "Courses with Grades": transcript.allCourses.filter((c) => c.grade)
          .length,
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet["!cols"] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 12 },
        { wch: 8 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
      ];

      // Create detailed transcript sheet
      const detailedData = transcripts.flatMap((transcript) =>
        transcript.allCourses.map((course) => ({
          "Matric Number": transcript.studentInfo.matricNumber,
          "Full Name": transcript.studentInfo.fullName,
          Department: transcript.studentInfo.department,
          "Current Level": transcript.studentInfo.currentLevel,
          CGPA: transcript.academicSummary.cgpa,
          "Total Credits": transcript.academicSummary.totalCredits,
          "Course Code": course.courseCode,
          "Course Title": course.courseTitle,
          "Credit Unit": course.creditUnit,
          Level: course.level,
          "Academic Year": course.academicYear,
          Semester: course.semester,
          "CA Score": course.caScore || "N/A",
          "Exam Score": course.examScore || "N/A",
          "Total Score": course.totalScore || "N/A",
          Grade: course.grade || "N/A",
          "Grade Point": course.gradePoint,
          Status: course.status,
        }))
      );

      const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
      detailedSheet["!cols"] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 12 },
        { wch: 8 },
        { wch: 12 },
        { wch: 10 },
        { wch: 30 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 },
        { wch: 8 },
        { wch: 15 },
      ];

      // Create session GPA sheet
      const sessionGPAData = transcripts.flatMap((transcript) =>
        transcript.sessionGPAs.map((session) => ({
          "Matric Number": transcript.studentInfo.matricNumber,
          "Full Name": transcript.studentInfo.fullName,
          "Academic Year": session.academicYear,
          Semester: session.semester,
          "Total Credits": session.totalCredits,
          "Total Grade Points": session.totalGradePoints,
          GPA: session.gpa,
          "Course Count": session.courses.length,
        }))
      );

      const sessionGPASheet = XLSX.utils.json_to_sheet(sessionGPAData);
      sessionGPASheet["!cols"] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 15 },
        { wch: 8 },
        { wch: 12 },
      ];

      // Create metadata sheet
      const metadataData = [
        { "Admin Scope": adminScope },
        { "Generated At": new Date().toLocaleString() },
        { "Total Students": transcripts.length },
        {
          "Include All Sessions": includeAllSessions === "true" ? "Yes" : "No",
        },
        { "Generated By": user.name },
      ];
      const metadataSheet = XLSX.utils.json_to_sheet(metadataData);
      metadataSheet["!cols"] = [{ wch: 20 }, { wch: 30 }];

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(
        workbook,
        detailedSheet,
        "Detailed Transcript"
      );
      XLSX.utils.book_append_sheet(workbook, sessionGPASheet, "Session GPAs");
      XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");

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
        `attachment; filename="Transcripts-${Date.now()}.xlsx"`
      );
      return res.status(200).send(excelBuffer);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="transcripts-${Date.now()}.json"`
      );
      return res.status(200).json({
        adminScope,
        generatedAt: new Date().toISOString(),
        totalStudents: transcripts.length,
        includeAllSessions: includeAllSessions === "true",
        transcripts,
      });
    } else if (format === "csv") {
      // Flatten transcript data for CSV
      const csvData = transcripts.flatMap((transcript) =>
        transcript.allCourses.map((course) => ({
          "Matric Number": transcript.studentInfo.matricNumber,
          "Full Name": transcript.studentInfo.fullName,
          Department: transcript.studentInfo.department,
          "Current Level": transcript.studentInfo.currentLevel,
          CGPA: transcript.academicSummary.cgpa,
          "Total Credits": transcript.academicSummary.totalCredits,
          "Course Code": course.courseCode,
          "Course Title": course.courseTitle,
          "Credit Unit": course.creditUnit,
          Level: course.level,
          "Academic Year": course.academicYear,
          Semester: course.semester,
          "CA Score": course.caScore || "N/A",
          "Exam Score": course.examScore || "N/A",
          "Total Score": course.totalScore || "N/A",
          Grade: course.grade || "N/A",
          "Grade Point": course.gradePoint,
          Status: course.status,
        }))
      );

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) =>
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
        `attachment; filename="transcripts-${Date.now()}.csv"`
      );
      return res.status(200).send(csvContent);
    } else {
      return res
        .status(400)
        .json({ message: "Invalid format. Use 'xlsx', 'json' or 'csv'" });
    }
  } catch (error) {
    console.error("Error exporting transcripts:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

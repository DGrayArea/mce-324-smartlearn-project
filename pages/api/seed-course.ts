import { NextApiRequest, NextApiResponse } from "next";
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

  try {
    // First, get existing schools and departments to work with
    const schools = await prisma.school.findMany();
    const departments = await prisma.department.findMany();

    if (schools.length === 0) {
      return res.status(400).json({
        message:
          "No schools found. Please run seed-organized first to create schools and departments.",
      });
    }

    if (departments.length === 0) {
      return res.status(400).json({
        message:
          "No departments found. Please run seed-organized first to create schools and departments.",
      });
    }

    // Find specific departments by code for better mapping
    const seetSchool = schools.find((s) => s.code === "SEET");
    const sipetSchool = schools.find((s) => s.code === "SIPET");
    const spsSchool = schools.find((s) => s.code === "SPS");
    const slsSchool = schools.find((s) => s.code === "SLS");

    const mceDept = departments.find((d) => d.code === "MCE");
    const eeeDept = departments.find((d) => d.code === "EEE");
    const cpeDept = departments.find((d) => d.code === "CPE");
    const tmeDept = departments.find((d) => d.code === "TME");
    const cieDept = departments.find((d) => d.code === "CIE");
    const meeDept = departments.find((d) => d.code === "MEE");
    const mthDept = departments.find((d) => d.code === "MTH");
    const phyDept = departments.find((d) => d.code === "PHY");
    const chmDept = departments.find((d) => d.code === "CHM");
    const bioDept = departments.find((d) => d.code === "BIO");

    // Create additional courses to supplement existing ones
    const courses = await Promise.all([
      // Additional MCE (Mechatronics) Courses
      prisma.course.create({
        data: {
          title: "Microcontrollers and Embedded Systems",
          code: "MCE102",
          creditUnit: 4,
          description:
            "Introduction to microcontrollers and embedded system design",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: seetSchool?.id,
          departmentId: mceDept?.id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Digital Signal Processing",
          code: "MCE202",
          creditUnit: 3,
          description: "Fundamentals of digital signal processing",
          type: "DEPARTMENTAL",
          level: "LEVEL_200",
          semester: "SECOND",
          schoolId: seetSchool?.id,
          departmentId: mceDept?.id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Industrial Automation",
          code: "MCE302",
          creditUnit: 4,
          description: "Industrial automation systems and PLC programming",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: seetSchool?.id,
          departmentId: mceDept?.id,
        },
      }),
      // Additional EEE (Electrical) Courses
      prisma.course.create({
        data: {
          title: "Electromagnetic Fields",
          code: "EEE102",
          creditUnit: 3,
          description: "Electromagnetic field theory and applications",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: seetSchool?.id,
          departmentId: eeeDept?.id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Power Electronics",
          code: "EEE202",
          creditUnit: 4,
          description: "Power electronic devices and circuits",
          type: "DEPARTMENTAL",
          level: "LEVEL_200",
          semester: "SECOND",
          schoolId: seetSchool?.id,
          departmentId: eeeDept?.id,
        },
      }),
      // Additional CPE (Computer) Courses
      prisma.course.create({
        data: {
          title: "Computer Networks",
          code: "CPE102",
          creditUnit: 3,
          description: "Computer network protocols and architecture",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: seetSchool?.id,
          departmentId: cpeDept?.id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Database Systems",
          code: "CPE202",
          creditUnit: 4,
          description: "Database design and management systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_200",
          semester: "SECOND",
          schoolId: seetSchool?.id,
          departmentId: cpeDept?.id,
        },
      }),
      // Additional Mathematics Courses
      prisma.course.create({
        data: {
          title: "Statistics and Probability",
          code: "MTH102",
          creditUnit: 3,
          description: "Statistical methods and probability theory",
          type: "FACULTY",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: spsSchool?.id,
          departmentId: mthDept?.id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Numerical Methods",
          code: "MTH202",
          creditUnit: 3,
          description: "Numerical analysis and computational methods",
          type: "FACULTY",
          level: "LEVEL_200",
          semester: "FIRST",
          schoolId: spsSchool?.id,
          departmentId: mthDept?.id,
        },
      }),
      // Additional Physics Courses
      prisma.course.create({
        data: {
          title: "Modern Physics",
          code: "PHY102",
          creditUnit: 3,
          description: "Introduction to modern physics concepts",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: spsSchool?.id,
          departmentId: phyDept?.id,
        },
      }),
      // Additional Chemistry Courses
      prisma.course.create({
        data: {
          title: "Organic Chemistry",
          code: "CHM102",
          creditUnit: 4,
          description: "Fundamentals of organic chemistry",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: spsSchool?.id,
          departmentId: chmDept?.id,
        },
      }),
      // Additional Biology Courses
      prisma.course.create({
        data: {
          title: "Cell Biology",
          code: "BIO102",
          creditUnit: 4,
          description: "Introduction to cell structure and function",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: slsSchool?.id,
          departmentId: bioDept?.id,
        },
      }),
      // Additional Civil Engineering Courses
      prisma.course.create({
        data: {
          title: "Structural Analysis",
          code: "CIE102",
          creditUnit: 4,
          description: "Analysis of structural systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: sipetSchool?.id,
          departmentId: cieDept?.id,
        },
      }),
      // Additional Mechanical Engineering Courses
      prisma.course.create({
        data: {
          title: "Thermodynamics",
          code: "MEE102",
          creditUnit: 4,
          description: "Fundamentals of thermodynamics",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: sipetSchool?.id,
          departmentId: meeDept?.id,
        },
      }),
      // Additional General Education Courses
      prisma.course.create({
        data: {
          title: "Communication Skills",
          code: "ENG102",
          creditUnit: 2,
          description:
            "Effective communication in academic and professional settings",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: spsSchool?.id,
          departmentId: mthDept?.id, // Temporary assignment
        },
      }),
      prisma.course.create({
        data: {
          title: "Research Methods",
          code: "RES101",
          creditUnit: 2,
          description:
            "Introduction to research methodology and academic writing",
          type: "GENERAL",
          level: "LEVEL_200",
          semester: "FIRST",
          schoolId: spsSchool?.id,
          departmentId: mthDept?.id, // Temporary assignment
        },
      }),
    ]);

    return res.status(200).json({
      message: "Additional courses created successfully!",
      data: {
        coursesCreated: courses.length,
        courses: courses.map((course) => ({
          id: course.id,
          title: course.title,
          code: course.code,
          creditUnit: course.creditUnit,
          type: course.type,
          level: course.level,
          semester: course.semester,
        })),
      },
      note: "These courses supplement the existing courses created by seed-organized. Department Admins can now select and assign these courses to lecturers.",
    });
  } catch (error) {
    console.error("Course seeding error:", error);
    return res.status(500).json({
      message: "Course seeding failed",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

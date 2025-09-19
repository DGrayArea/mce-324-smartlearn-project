import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    console.log("🧹 Starting database purge...");

    // Clear existing data in proper order (respecting foreign key constraints)
    // Start with dependent tables first
    console.log("Deleting course selections...");
    await prisma.courseSelection.deleteMany();

    console.log("Deleting course registrations...");
    await prisma.courseRegistration.deleteMany();

    console.log("Deleting course assignments...");
    await prisma.courseAssignment.deleteMany();

    console.log("Deleting enrollments...");
    await prisma.enrollment.deleteMany();

    console.log("Deleting results...");
    await prisma.result.deleteMany();

    console.log("Deleting assessments...");
    await prisma.assessment.deleteMany();

    console.log("Deleting content...");
    await prisma.content.deleteMany();

    console.log("Deleting virtual classes...");
    await prisma.virtualClass.deleteMany();

    console.log("Deleting feedback...");
    await prisma.feedback.deleteMany();

    console.log("Deleting course evaluations...");
    await prisma.courseEvaluation.deleteMany();

    console.log("Deleting announcements...");
    await prisma.announcement.deleteMany();

    console.log("Deleting assignments...");
    await prisma.assignment.deleteMany();

    console.log("Deleting quizzes...");
    await prisma.quiz.deleteMany();

    console.log("Deleting chat rooms...");
    await prisma.chatRoom.deleteMany();

    console.log("Deleting courses...");
    await prisma.course.deleteMany();

    console.log("Deleting department courses...");
    await prisma.departmentCourse.deleteMany();

    // Note: courseAvailability table doesn't exist in current schema

    console.log("Deleting department admins...");
    await prisma.departmentAdmin.deleteMany();

    console.log("Deleting school admins...");
    await prisma.schoolAdmin.deleteMany();

    console.log("Deleting senate admins...");
    await prisma.senateAdmin.deleteMany();

    console.log("Deleting lecturers...");
    await prisma.lecturer.deleteMany();

    console.log("Deleting students...");
    await prisma.student.deleteMany();

    console.log("Deleting departments...");
    await prisma.department.deleteMany();

    console.log("Deleting schools...");
    await prisma.school.deleteMany();

    console.log("Deleting users...");
    await prisma.user.deleteMany();

    console.log("✅ Database purge completed successfully!");

    // 1. Create Schools
    const schools = await Promise.all([
      prisma.school.create({
        data: {
          name: "School of Electrical Engineering and Technology (SEET)",
          code: "SEET",
          description:
            "Electrical, Mechatronics, Telecommunications, and Computer Engineering programs",
        },
      }),
      prisma.school.create({
        data: {
          name: "School of Infrastructure, Processing and Information Technology (SIPET)",
          code: "SIPET",
          description:
            "Civil, Mechanical, Agricultural & Bio-Resources, Chemical, and Petroleum & Gas Engineering",
        },
      }),
      prisma.school.create({
        data: {
          name: "School of Physical Sciences (SPS)",
          code: "SPS",
          description: "Physics, Chemistry, Geology, and Mathematics programs",
        },
      }),
      prisma.school.create({
        data: {
          name: "School of Life Sciences (SLS)",
          code: "SLS",
          description:
            "Biology, Biochemistry, and related life sciences programs",
        },
      }),
    ]);

    // 2. Create Departments with proper mapping
    const departments = await Promise.all([
      // SEET School Departments
      prisma.department.create({
        data: {
          name: "Electrical Engineering",
          code: "EEE",
          schoolId: schools[0].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Mechatronics Engineering",
          code: "MCE",
          schoolId: schools[0].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Telecommunications Engineering",
          code: "TME",
          schoolId: schools[0].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Computer Engineering",
          code: "CPE",
          schoolId: schools[0].id,
        },
      }),
      // SIPET School Departments
      prisma.department.create({
        data: {
          name: "Civil Engineering",
          code: "CIE",
          schoolId: schools[1].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Mechanical Engineering",
          code: "MEE",
          schoolId: schools[1].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Agricultural & Bio-Resources Engineering",
          code: "ABE",
          schoolId: schools[1].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Chemical Engineering",
          code: "CHE",
          schoolId: schools[1].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Petroleum & Gas Engineering",
          code: "PGE",
          schoolId: schools[1].id,
        },
      }),
      // SPS School Departments
      prisma.department.create({
        data: {
          name: "Physics",
          code: "PHY",
          schoolId: schools[2].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Chemistry",
          code: "CHM",
          schoolId: schools[2].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Geology",
          code: "GEO",
          schoolId: schools[2].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Mathematics",
          code: "MTH",
          schoolId: schools[2].id,
        },
      }),
      // SLS School Departments
      prisma.department.create({
        data: {
          name: "Biology",
          code: "BIO",
          schoolId: schools[3].id,
        },
      }),
      prisma.department.create({
        data: {
          name: "Biochemistry",
          code: "BCH",
          schoolId: schools[3].id,
        },
      }),
    ]);

    // 3. Create Senate Admin
    const senateAdminUser = await prisma.user.create({
      data: {
        email: "senate.admin@university.edu",
        password: await bcrypt.hash("password123", 12),
        role: "SENATE_ADMIN",
        isActive: true,
        senateAdmin: {
          create: {
            name: "Prof. Sarah Johnson",
          },
        },
      },
    });

    // 4. Create School Admins with proper email codes
    const schoolAdmins = await Promise.all([
      prisma.user.create({
        data: {
          email: "seet.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "SCHOOL_ADMIN",
          isActive: true,
          schoolAdmin: {
            create: {
              name: "Prof. Michael Chen",
              schoolId: schools[0].id, // SEET
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "sipet.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "SCHOOL_ADMIN",
          isActive: true,
          schoolAdmin: {
            create: {
              name: "Prof. Emily Rodriguez",
              schoolId: schools[1].id, // SIPET
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "sps.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "SCHOOL_ADMIN",
          isActive: true,
          schoolAdmin: {
            create: {
              name: "Prof. James Wilson",
              schoolId: schools[2].id, // SPS
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "sls.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "SCHOOL_ADMIN",
          isActive: true,
          schoolAdmin: {
            create: {
              name: "Prof. Lisa Thompson",
              schoolId: schools[3].id, // SLS
            },
          },
        },
      }),
    ]);

    // 5. Create Department Admins with proper email codes
    const departmentAdmins = await Promise.all([
      // SEET Department Admins
      prisma.user.create({
        data: {
          email: "eee.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Robert Kim",
              departmentId: departments[0].id, // EEE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mce.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Maria Garcia",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "tme.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. David Brown",
              departmentId: departments[2].id, // TME
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "cpe.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Jennifer Lee",
              departmentId: departments[3].id, // CPE
            },
          },
        },
      }),
      // SIPET Department Admins
      prisma.user.create({
        data: {
          email: "cie.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Ahmed Hassan",
              departmentId: departments[4].id, // CIE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mee.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Patricia O'Connor",
              departmentId: departments[5].id, // MEE
            },
          },
        },
      }),
      // SPS Department Admins
      prisma.user.create({
        data: {
          email: "mth.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Thomas Anderson",
              departmentId: departments[12].id, // MTH
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "phy.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Rachel Green",
              departmentId: departments[9].id, // PHY
            },
          },
        },
      }),
    ]);

    // 6. Create Lecturers with proper email codes
    const lecturers = await Promise.all([
      // MCE (Mechatronics) Lecturers
      prisma.user.create({
        data: {
          email: "mce.lecturer1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Alice Johnson",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mce.lecturer2@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Bob Smith",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mce.lecturer3@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Carol Davis",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      // EEE Lecturers
      prisma.user.create({
        data: {
          email: "eee.lecturer1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Daniel Wilson",
              departmentId: departments[0].id, // EEE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "eee.lecturer2@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Emma Thompson",
              departmentId: departments[0].id, // EEE
            },
          },
        },
      }),
      // CPE Lecturers
      prisma.user.create({
        data: {
          email: "cpe.lecturer1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Frank Miller",
              departmentId: departments[3].id, // CPE
            },
          },
        },
      }),
      // MTH Lecturers
      prisma.user.create({
        data: {
          email: "mth.lecturer1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Grace Taylor",
              departmentId: departments[12].id, // MTH
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mth.lecturer2@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Henry Clark",
              departmentId: departments[12].id, // MTH
            },
          },
        },
      }),
    ]);

    // 7. Create Students with proper email codes
    const students = await Promise.all([
      // MCE Students
      prisma.user.create({
        data: {
          email: "mce.student1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "John Doe",
              matricNumber: "MCE/2021/001",
              level: "LEVEL_100",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mce.student2@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Jane Smith",
              matricNumber: "MCE/2021/002",
              level: "LEVEL_200",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mce.student3@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Mike Johnson",
              matricNumber: "MCE/2021/003",
              level: "LEVEL_300",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mce.student4@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Sarah Brown",
              matricNumber: "MCE/2021/004",
              level: "LEVEL_400",
              departmentId: departments[1].id, // MCE
            },
          },
        },
      }),
      // EEE Students
      prisma.user.create({
        data: {
          email: "eee.student1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Alex Wilson",
              matricNumber: "EEE/2021/001",
              level: "LEVEL_400",
              departmentId: departments[0].id, // EEE
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "eee.student2@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Lisa Davis",
              matricNumber: "EEE/2021/002",
              level: "LEVEL_200",
              departmentId: departments[0].id, // EEE
            },
          },
        },
      }),
      // CPE Students
      prisma.user.create({
        data: {
          email: "cpe.student1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Tom Anderson",
              matricNumber: "CPE/2021/001",
              level: "LEVEL_500",
              departmentId: departments[3].id, // CPE
            },
          },
        },
      }),
    ]);

    // 8. Create Courses (Senate Admin creates all courses)
    const courses = await Promise.all([
      // MCE (Mechatronics) Courses
      prisma.course.create({
        data: {
          title: "Introduction to Mechatronics",
          code: "MCE101",
          creditUnit: 3,
          description: "Fundamentals of mechatronics engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id, // SEET
          departmentId: departments[1].id, // MCE
        },
      }),
      prisma.course.create({
        data: {
          title: "Control Systems",
          code: "MCE201",
          creditUnit: 4,
          description: "Analysis and design of control systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_200",
          semester: "FIRST",
          schoolId: schools[0].id, // SEET
          departmentId: departments[1].id, // MCE
        },
      }),
      prisma.course.create({
        data: {
          title: "Robotics and Automation",
          code: "MCE301",
          creditUnit: 3,
          description: "Robotics systems and industrial automation",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id, // SEET
          departmentId: departments[1].id, // MCE
        },
      }),
      prisma.course.create({
        data: {
          title: "Advanced Mechatronics",
          code: "MCE401",
          creditUnit: 4,
          description: "Advanced topics in mechatronics engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id, // SEET
          departmentId: departments[1].id, // MCE
        },
      }),
      prisma.course.create({
        data: {
          title: "Mechatronics Project",
          code: "MCE501",
          creditUnit: 6,
          description: "Capstone project in mechatronics",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id, // SEET
          departmentId: departments[1].id, // MCE
        },
      }),
      // EEE Courses
      prisma.course.create({
        data: {
          title: "Electrical Circuit Analysis",
          code: "EEE101",
          creditUnit: 4,
          description: "Basic electrical circuit analysis",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id, // SEET
          departmentId: departments[0].id, // EEE
        },
      }),
      prisma.course.create({
        data: {
          title: "Power Systems",
          code: "EEE201",
          creditUnit: 3,
          description: "Power generation, transmission, and distribution",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id, // SEET
          departmentId: departments[0].id, // EEE
        },
      }),
      prisma.course.create({
        data: {
          title: "Digital Signal Processing",
          code: "EEE301",
          creditUnit: 3,
          description: "Digital signal processing techniques",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id, // SEET
          departmentId: departments[0].id, // EEE
        },
      }),
      // CPE Courses
      prisma.course.create({
        data: {
          title: "Computer Programming I",
          code: "CPE101",
          creditUnit: 3,
          description: "Introduction to computer programming",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id, // SEET
          departmentId: departments[3].id, // CPE
        },
      }),
      prisma.course.create({
        data: {
          title: "Data Structures and Algorithms",
          code: "CPE201",
          creditUnit: 4,
          description: "Advanced data structures and algorithm design",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id, // SEET
          departmentId: departments[3].id, // CPE
        },
      }),
      prisma.course.create({
        data: {
          title: "Software Engineering",
          code: "CPE301",
          creditUnit: 3,
          description: "Software development methodologies and practices",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id, // SEET
          departmentId: departments[3].id, // CPE
        },
      }),
      // Mathematics Courses (General/Faculty)
      prisma.course.create({
        data: {
          title: "Calculus I",
          code: "MTH101",
          creditUnit: 4,
          description: "Differential and integral calculus",
          type: "FACULTY",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[2].id, // SPS
          departmentId: departments[12].id, // MTH
        },
      }),
      prisma.course.create({
        data: {
          title: "Linear Algebra",
          code: "MTH201",
          creditUnit: 3,
          description: "Vector spaces and linear transformations",
          type: "FACULTY",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[2].id, // SPS
          departmentId: departments[12].id, // MTH
        },
      }),
      prisma.course.create({
        data: {
          title: "Differential Equations",
          code: "MTH301",
          creditUnit: 3,
          description: "Ordinary and partial differential equations",
          type: "FACULTY",
          level: "LEVEL_200",
          semester: "SECOND",
          schoolId: schools[2].id, // SPS
          departmentId: departments[12].id, // MTH
        },
      }),
      // General Education Courses
      prisma.course.create({
        data: {
          title: "Technical Writing",
          code: "ENG101",
          creditUnit: 2,
          description: "Technical communication skills",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: schools[2].id, // SPS
          departmentId: departments[12].id, // MTH (temporary)
        },
      }),
      prisma.course.create({
        data: {
          title: "Engineering Ethics",
          code: "ENG201",
          creditUnit: 2,
          description: "Professional ethics in engineering",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[2].id, // SPS
          departmentId: departments[12].id, // MTH (temporary)
        },
      }),
    ]);

    // 9. Create Department Course Selections (Department Admins select courses)
    const departmentCourses = await Promise.all([
      // MCE Department selects their courses
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[0].id, // MCE101
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[1].id, // MCE201
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[2].id, // MCE301
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[3].id, // MCE401
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[4].id, // MCE501
          isRequired: true,
        },
      }),
      // MCE also selects some general courses
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[11].id, // MTH101 (index 11)
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[12].id, // MTH201 (index 12)
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[1].id, // MCE
          courseId: courses[13].id, // ENG101 (index 13)
          isRequired: false,
        },
      }),
      // EEE Department selects their courses
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[0].id, // EEE
          courseId: courses[5].id, // EEE101
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[0].id, // EEE
          courseId: courses[6].id, // EEE201
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[0].id, // EEE
          courseId: courses[7].id, // EEE301
          isRequired: true,
        },
      }),
      // CPE Department selects their courses
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[3].id, // CPE
          courseId: courses[8].id, // CPE101
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[3].id, // CPE
          courseId: courses[9].id, // CPE201
          isRequired: true,
        },
      }),
      prisma.departmentCourse.create({
        data: {
          departmentId: departments[3].id, // CPE
          courseId: courses[10].id, // CPE301 (index 10)
          isRequired: true,
        },
      }),
    ]);

    // 10. Course Assignments - NOT CREATED AUTOMATICALLY
    // Department Admins should assign courses to lecturers through the frontend interface
    // This maintains the proper workflow: Senate Admin creates courses → Department Admin selects courses → Department Admin assigns lecturers
    const courseAssignments: any[] = [];

    return res.status(200).json({
      message: "Comprehensive seeding completed successfully!",
      data: {
        schools: schools.length,
        departments: departments.length,
        senateAdmins: 1,
        schoolAdmins: schoolAdmins.length,
        departmentAdmins: departmentAdmins.length,
        lecturers: lecturers.length,
        students: students.length,
        courses: courses.length,
        departmentCourses: departmentCourses.length,
        courseAssignments: courseAssignments.length, // 0 - to be assigned by Department Admins
      },
      note: "Course assignments should be made by Department Admins through the frontend interface",
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return res.status(500).json({
      message: "Seeding failed",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

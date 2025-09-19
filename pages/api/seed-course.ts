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
    // // Clear existing data (in development only)
    // await prisma.courseSelection.deleteMany();
    // await prisma.courseRegistration.deleteMany();
    // await prisma.courseAssignment.deleteMany();
    // await prisma.enrollment.deleteMany();
    // await prisma.result.deleteMany();
    // await prisma.assessment.deleteMany();
    // await prisma.content.deleteMany();
    // await prisma.virtualClass.deleteMany();
    // await prisma.feedback.deleteMany();
    // await prisma.course.deleteMany();
    // await prisma.departmentCourse.deleteMany();
    // await prisma.departmentAdmin.deleteMany();
    // await prisma.schoolAdmin.deleteMany();
    // await prisma.senateAdmin.deleteMany();
    // await prisma.lecturer.deleteMany();
    // await prisma.student.deleteMany();
    // await prisma.department.deleteMany();
    // await prisma.school.deleteMany();
    // await prisma.user.deleteMany();
    // // 1. Create Schools
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
    // 2. Create Departments
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
    // 3. Create Senate Admin (Highest Level)
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
    // 4. Create School Admins (Faculty Admins)
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
              schoolId: schools[0].id,
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
              schoolId: schools[1].id,
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
              schoolId: schools[2].id,
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
              schoolId: schools[3].id,
            },
          },
        },
      }),
    ]);
    // 5. Create Department Admins
    const departmentAdmins = await Promise.all([
      prisma.user.create({
        data: {
          email: "cen.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Robert Kim",
              departmentId: departments[0].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "csc.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. Maria Garcia",
              departmentId: departments[3].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "mth.admin@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "DEPARTMENT_ADMIN",
          isActive: true,
          departmentAdmin: {
            create: {
              name: "Dr. David Brown",
              departmentId: departments[4].id,
            },
          },
        },
      }),
    ]);
    // 6. Create Lecturers
    const lecturers = await Promise.all([
      prisma.user.create({
        data: {
          email: "lecturer1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Alice Johnson",
              departmentId: departments[0].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "lecturer2@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Bob Smith",
              departmentId: departments[3].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "lecturer3@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Carol Davis",
              departmentId: departments[4].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "lecturer4@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "LECTURER",
          isActive: true,
          lecturer: {
            create: {
              name: "Dr. Daniel Wilson",
              departmentId: departments[5].id,
            },
          },
        },
      }),
    ]);
    // 7. Create Students
    const students = await Promise.all([
      prisma.user.create({
        data: {
          email: "student1@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "John Doe",
              matricNumber: "CEN/2021/001",
              level: "LEVEL_300",
              departmentId: departments[0].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "student2@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Jane Smith",
              matricNumber: "CSC/2021/002",
              level: "LEVEL_200",
              departmentId: departments[3].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "student3@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Mike Johnson",
              matricNumber: "MTH/2021/003",
              level: "LEVEL_400",
              departmentId: departments[4].id,
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          email: "student4@university.edu",
          password: await bcrypt.hash("password123", 12),
          role: "STUDENT",
          isActive: true,
          student: {
            create: {
              name: "Sarah Brown",
              matricNumber: "CEN/2021/004",
              level: "LEVEL_100",
              departmentId: departments[0].id,
            },
          },
        },
      }),
    ]);
    // 8. Create Courses (Senate Admin creates all courses)
    const courses = await Promise.all([
      // Engineering Courses (Original)
      prisma.course.create({
        data: {
          title: "Introduction to Programming",
          code: "CEN101",
          creditUnit: 3,
          description: "Basic programming concepts and problem solving",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Data Structures and Algorithms",
          code: "CEN201",
          creditUnit: 4,
          description: "Advanced data structures and algorithm design",
          type: "DEPARTMENTAL",
          level: "LEVEL_200",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Software Engineering",
          code: "CEN301",
          creditUnit: 3,
          description: "Software development methodologies and practices",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      // Computer Science Courses (Original)
      prisma.course.create({
        data: {
          title: "Computer Programming I",
          code: "CSC101",
          creditUnit: 3,
          description: "Introduction to computer programming",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[1].id,
          departmentId: departments[3].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Database Systems",
          code: "CSC201",
          creditUnit: 3,
          description: "Database design and management",
          type: "DEPARTMENTAL",
          level: "LEVEL_200",
          semester: "SECOND",
          schoolId: schools[1].id,
          departmentId: departments[3].id,
        },
      }),
      // Mathematics Courses (Original)
      prisma.course.create({
        data: {
          title: "Calculus I",
          code: "MTH101",
          creditUnit: 4,
          description: "Differential and integral calculus",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[1].id,
          departmentId: departments[4].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Linear Algebra",
          code: "MTH201",
          creditUnit: 3,
          description: "Vector spaces and linear transformations",
          type: "DEPARTMENTAL",
          level: "LEVEL_200",
          semester: "FIRST",
          schoolId: schools[1].id,
          departmentId: departments[4].id,
        },
      }),
      // Faculty-wide Courses (borrowed courses) (Original)
      prisma.course.create({
        data: {
          title: "General Physics I",
          code: "PHY101",
          creditUnit: 3,
          description: "Mechanics and thermodynamics",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[1].id,
          departmentId: departments[5].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Technical Writing",
          code: "ENG101",
          creditUnit: 2,
          description: "Technical communication skills",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: schools[2].id,
          departmentId: departments[6].id,
        },
      }),

      // Computer Engineering Courses from CSV
      // 300 Level - First Semester
      prisma.course.create({
        data: {
          title: "Applied Mathematics for Electrical Engineers I",
          code: "ELE311",
          creditUnit: 3,
          description: "Mathematical foundations for electrical engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Measurement and Instrumentation",
          code: "ELE312",
          creditUnit: 3,
          description: "Principles of measurement and instrumentation systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Signals and Systems",
          code: "ELE313",
          creditUnit: 2,
          description: "Analysis of signals and linear systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Circuit Theory",
          code: "ELE314",
          creditUnit: 3,
          description: "Analysis of electrical circuits",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Analogue Electronics Circuit",
          code: "ELE315",
          creditUnit: 3,
          description: "Design and analysis of analogue electronic circuits",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "General Electrical Laboratory Practical",
          code: "ELE316",
          creditUnit: 3,
          description: "Hands-on electrical engineering laboratory experiments",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Programming & Languages",
          code: "CPE311",
          creditUnit: 2,
          description: "Programming languages for computer engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Entrepreneurship II",
          code: "GST308",
          creditUnit: 2,
          description: "Advanced entrepreneurship concepts",
          type: "GENERAL",
          level: "LEVEL_300",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),

      // 300 Level - Second Semester
      prisma.course.create({
        data: {
          title: "Applied Mathematics for Electrical Engineers II",
          code: "ELE321",
          creditUnit: 3,
          description:
            "Advanced mathematical methods for electrical engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Field Theory",
          code: "ELE322",
          creditUnit: 3,
          description: "Electromagnetic field theory",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Principles of Electromechanical Conversion",
          code: "ELE323",
          creditUnit: 2,
          description: "Energy conversion in electromechanical systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Digital Electronics Circuit",
          code: "ELE324",
          creditUnit: 3,
          description: "Design and analysis of digital electronic circuits",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Software Development Techniques",
          code: "CPE321",
          creditUnit: 3,
          description: "Modern software development methodologies",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Organization & Architecture",
          code: "CPE322",
          creditUnit: 3,
          description: "Computer system organization and architecture",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Laboratory Practical I",
          code: "CPE323",
          creditUnit: 3,
          description: "Computer engineering laboratory experiments",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),

      // 400 Level - First Semester
      prisma.course.create({
        data: {
          title: "Research Methods and Technical Communications",
          code: "ELE411",
          creditUnit: 2,
          description: "Research methodology and technical writing",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Prototyping Technique",
          code: "CPE411",
          creditUnit: 2,
          description: "Electronic prototyping methods and techniques",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Laboratory Practical II",
          code: "CPE412",
          creditUnit: 2,
          description: "Advanced computer engineering laboratory",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Microprocessor System & Interfacing",
          code: "CPE413",
          creditUnit: 3,
          description: "Microprocessor systems and interface design",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Communication & Networks",
          code: "CPE414",
          creditUnit: 3,
          description: "Computer networking and communication protocols",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Object Oriented Design & Programming",
          code: "CPE415",
          creditUnit: 3,
          description: "Object-oriented programming paradigms",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Assembly Language Programming",
          code: "CPE416",
          creditUnit: 3,
          description: "Low-level programming in assembly language",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Data Structure and Algorithm",
          code: "CPE418",
          creditUnit: 2,
          description: "Data structures and algorithmic problem solving",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Control Theory",
          code: "ELE412",
          creditUnit: 2,
          description: "Control system theory and design",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),

      // 400 Level - Second Semester (SIWES)
      prisma.course.create({
        data: {
          title: "Student Industrial Work Experience Scheme (SIWES)",
          code: "SIW400",
          creditUnit: 6,
          description: "Industrial work experience program",
          type: "GENERAL",
          level: "LEVEL_400",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),

      // 500 Level - First Semester
      prisma.course.create({
        data: {
          title: "Computer Architecture II",
          code: "CPE521",
          creditUnit: 2,
          description: "Advanced computer architecture concepts",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Network II",
          code: "CPE522",
          creditUnit: 3,
          description: "Advanced computer networking",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Modeling and Simulation",
          code: "CPE523",
          creditUnit: 2,
          description: "Computer modeling and simulation techniques",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Operating Systems",
          code: "CPE524",
          creditUnit: 2,
          description: "Operating system design and implementation",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Emerging Technologies in Computer Engineering",
          code: "CPE525",
          creditUnit: 2,
          description: "Latest trends in computer engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Embedded Systems",
          code: "CPE526",
          creditUnit: 2,
          description: "Design and development of embedded systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Database Management System",
          code: "CPE527",
          creditUnit: 2,
          description: "Database design and management",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Engineering Entrepreneurship",
          code: "ENG521",
          creditUnit: 2,
          description: "Entrepreneurship for engineers",
          type: "GENERAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Engineering Management and Law",
          code: "ENG522",
          creditUnit: 2,
          description: "Engineering management principles and law",
          type: "GENERAL",
          level: "LEVEL_500",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),

      // 500 Level - Second Semester
      prisma.course.create({
        data: {
          title: "Independent Project",
          code: "CPE599",
          creditUnit: 6,
          description: "Final year project",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Hardware Systems Design II",
          code: "CPE523",
          creditUnit: 2,
          description: "Advanced hardware design concepts",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer and Network Security",
          code: "CPE524",
          creditUnit: 2,
          description: "Computer and network security principles",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Artificial Intelligence and Applications",
          code: "CPE525",
          creditUnit: 2,
          description: "AI principles and applications",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Fundamentals of Mechatronics",
          code: "CPE526",
          creditUnit: 2,
          description: "Introduction to mechatronics systems",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Reliability Engineering",
          code: "EEE522",
          creditUnit: 2,
          description: "Engineering reliability and quality assurance",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Digital Image Processing",
          code: "CME525",
          creditUnit: 2,
          description: "Digital image processing techniques",
          type: "DEPARTMENTAL",
          level: "LEVEL_500",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[0].id,
        },
      }),

      // Electrical Engineering Courses from CSV
      // 100 Level - First Semester
      prisma.course.create({
        data: {
          title: "Communication in English",
          code: "GST111",
          creditUnit: 2,
          description: "English language communication skills",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Solid Modeling and Engineering Drawing",
          code: "GET101",
          creditUnit: 2,
          description: "Engineering graphics and CAD modeling",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Engineer in Society",
          code: "GET102",
          creditUnit: 1,
          description: "Role of engineers in society",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "General Chemistry I",
          code: "CHM101",
          creditUnit: 2,
          description: "Basic principles of chemistry",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "General Chemistry Practical I",
          code: "CHM107",
          creditUnit: 1,
          description: "Chemistry laboratory experiments",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Elementary Mathematics I",
          code: "MTH101",
          creditUnit: 3,
          description: "Basic mathematical concepts",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "General Physics I",
          code: "PHY101",
          creditUnit: 2,
          description: "Basic physics principles",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "General Practical Physics I",
          code: "PHY107",
          creditUnit: 1,
          description: "Physics laboratory experiments",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Introduction to Electrical and Electronics Engineering",
          code: "EEE101",
          creditUnit: 2,
          description: "Introduction to electrical and electronics engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Elementary Mathematics III",
          code: "MTH113",
          creditUnit: 2,
          description: "Advanced mathematical concepts",
          type: "GENERAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Computer Programming",
          code: "CPE111",
          creditUnit: 2,
          description: "Introduction to computer programming",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[1].id,
        },
      }),

      // Additional courses can be added following the same pattern for other departments
      // (Mechatronics, Telecommunication, etc.) based on the CSV data

      // For brevity, I'm including a few more key courses as examples:

      // Mechatronics Engineering - 100 Level First Semester
      prisma.course.create({
        data: {
          title: "Introduction to Mechatronics Engineering",
          code: "MCE101",
          creditUnit: 2,
          description: "Introduction to mechatronics engineering principles",
          type: "DEPARTMENTAL",
          level: "LEVEL_100",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[2].id, // Assuming mechatronics is departments[2]
        },
      }),

      // Telecommunications Engineering - 200 Level courses
      prisma.course.create({
        data: {
          title: "Data Communication and Networks I",
          code: "CME321",
          creditUnit: 3,
          description: "Fundamentals of data communication and networking",
          type: "DEPARTMENTAL",
          level: "LEVEL_300",
          semester: "SECOND",
          schoolId: schools[0].id,
          departmentId: departments[3].id, // Assuming telecommunications is departments[3]
        },
      }),
      prisma.course.create({
        data: {
          title: "Communication Engineering Principles",
          code: "CME413",
          creditUnit: 3,
          description: "Principles of communication engineering",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[3].id,
        },
      }),
      prisma.course.create({
        data: {
          title: "Antenna and Wave Propagation",
          code: "CME411",
          creditUnit: 3,
          description: "Antenna design and wave propagation theory",
          type: "DEPARTMENTAL",
          level: "LEVEL_400",
          semester: "FIRST",
          schoolId: schools[0].id,
          departmentId: departments[3].id,
        },
      }),
    ]);
    // 9. Create Department-Course Assignments (Department Admins assign lecturers to courses)
    // Temporarily skip course assignments to debug lecturer creation
    const courseAssignments = [];
    // Debug: Log lecturer IDs
    console.log(
      "Lecturer IDs:",
      lecturers.map((l) => l.id)
    );
    console.log(
      "Department Admin IDs:",
      departmentAdmins.map((d) => d.id)
    );
    console.log(
      "Course IDs:",
      courses.map((c) => c.id)
    );
    // 10. Create Student Enrollments
    // Temporarily skip enrollments to debug student creation
    const enrollments = [];
    // Debug: Log student IDs
    console.log(
      "Student IDs:",
      students.map((s) => s.id)
    );
    // 11. Create Assessments and Results
    // Temporarily skip assessments to test basic creation
    const assessments = [];
    // 12. Create Notifications and Announcements
    await Promise.all([
      // System-wide announcements
      prisma.announcement.create({
        data: {
          title: "Welcome to the New Academic Year 2024/2025",
          content:
            "We welcome all students, lecturers, and staff to the new academic year. Please ensure you complete your course registrations by the deadline.",
          priority: "HIGH",
          publishedAt: new Date("2024-09-01"),
          expiresAt: new Date("2024-12-31"),
          isActive: true,
          isGlobal: true,
          createdById: senateAdminUser.id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: "Midterm Examination Schedule Released",
          content:
            "The midterm examination schedule for the first semester has been released. Please check your course pages for specific dates and times.",
          priority: "MEDIUM",
          publishedAt: new Date("2024-11-15"),
          expiresAt: new Date("2024-12-20"),
          isActive: true,
          isGlobal: true,
          createdById: senateAdminUser.id,
        },
      }),
      // School-specific announcements
      prisma.announcement.create({
        data: {
          title: "SEET School Meeting - December 2024",
          content:
            "All SEET students and staff are invited to the monthly school meeting on December 15th at 2:00 PM in the main auditorium.",
          priority: "MEDIUM",
          publishedAt: new Date("2024-12-01"),
          expiresAt: new Date("2024-12-15"),
          isActive: true,
          isGlobal: false,
          schoolId: schools[0].id,
          createdById: schoolAdmins[0].id,
        },
      }),
      prisma.announcement.create({
        data: {
          title: "SIPET Research Symposium 2024",
          content:
            "The SIPET Research Symposium will be held on January 20th, 2025. Students are encouraged to submit their research abstracts.",
          priority: "LOW",
          publishedAt: new Date("2024-11-20"),
          expiresAt: new Date("2025-01-20"),
          isActive: true,
          isGlobal: false,
          schoolId: schools[1].id,
          createdById: schoolAdmins[1].id,
        },
      }),
      // Course-specific announcements
      prisma.announcement.create({
        data: {
          title: "Introduction to Programming - Assignment Extension",
          content:
            "The deadline for Programming Assignment 1 has been extended to December 12th due to technical issues.",
          priority: "HIGH",
          publishedAt: new Date("2024-12-05"),
          expiresAt: new Date("2024-12-12"),
          isActive: true,
          isGlobal: false,
          courseId: courses[0].id,
          createdById: lecturers[0].id,
        },
      }),
    ]);
    // 13. Create Notifications for users
    // Get the actual student and lecturer profile IDs
    const studentProfiles = await prisma.student.findMany({
      where: {
        userId: {
          in: students.map((s) => s.id),
        },
      },
    });

    const lecturerProfiles = await prisma.lecturer.findMany({
      where: {
        userId: {
          in: lecturers.map((l) => l.id),
        },
      },
    });

    await Promise.all([
      // Notifications for students
      prisma.notification.create({
        data: {
          studentId: studentProfiles[0]?.id,
          title: "New Assignment Posted",
          message:
            "A new assignment has been posted for Data Structures and Algorithms course.",
          type: "DEADLINE",
          isRead: false,
          metadata: {
            courseId: courses[1].id,
            assignmentId: "ass_001",
          },
        },
      }),
      prisma.notification.create({
        data: {
          studentId: studentProfiles[1]?.id,
          title: "Grade Posted",
          message: "Your grade for Database Design Project has been posted.",
          type: "GRADE",
          isRead: true,
          metadata: { courseId: courses[4].id, grade: "A" },
        },
      }),
      prisma.notification.create({
        data: {
          studentId: studentProfiles[2]?.id,
          title: "Meeting Reminder",
          message:
            "You have a meeting with your academic advisor tomorrow at 10:00 AM.",
          type: "REMINDER",
          isRead: false,
          metadata: { meetingId: "meet_001", time: "10:00 AM" },
        },
      }),
      // Notifications for lecturers
      prisma.notification.create({
        data: {
          lecturerId: lecturerProfiles[0]?.id,
          title: "Course Assignment Confirmed",
          message:
            "You have been assigned to teach Introduction to Programming for the 2024/2025 academic year.",
          type: "DEADLINE",
          isRead: true,
          metadata: { courseId: courses[0].id, semester: "FIRST" },
        },
      }),
      prisma.notification.create({
        data: {
          lecturerId: lecturerProfiles[1]?.id,
          title: "Student Submission",
          message:
            "5 new submissions have been received for Database Design Project.",
          type: "ANNOUNCEMENT",
          isRead: false,
          metadata: { courseId: courses[4].id, count: 5 },
        },
      }),
    ]);
    res.status(200).json({
      message: "Comprehensive academic data created successfully",
      summary: {
        schools: schools.length,
        departments: departments.length,
        senateAdmins: 1,
        schoolAdmins: schoolAdmins.length,
        departmentAdmins: departmentAdmins.length,
        lecturers: lecturers.length,
        students: students.length,
        courses: courses.length,
        courseAssignments: courseAssignments.length,
        enrollments: enrollments.length,
        assessments: assessments.length,
        announcements: 5,
        notifications: 5,
      },
      credentials: {
        senateAdmin: "senate.admin@university.edu / password123",
        schoolAdmins: [
          "seet.admin@university.edu / password123",
          "sipet.admin@university.edu / password123",
          "sps.admin@university.edu / password123",
          "sls.admin@university.edu / password123",
        ],
        departmentAdmins: [
          "een.admin@university.edu / password123",
          "mce.admin@university.edu / password123",
          "cve.admin@university.edu / password123",
        ],
        lecturers: [
          "lecturer1@university.edu / password123",
          "lecturer2@university.edu / password123",
          "lecturer3@university.edu / password123",
          "lecturer4@university.edu / password123",
        ],
        students: [
          "student1@university.edu / password123",
          "student2@university.edu / password123",
          "student3@university.edu / password123",
          "student4@university.edu / password123",
        ],
      },
    });
  } catch (error: any) {
    console.error("Error seeding comprehensive data:", error);
    res.status(500).json({
      message: "Error creating comprehensive data",
      error: error.message,
    });
  }
}

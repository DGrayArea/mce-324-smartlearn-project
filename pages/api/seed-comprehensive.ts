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
    // Clear existing data (in development only)
    await prisma.courseSelection.deleteMany();
    await prisma.courseRegistration.deleteMany();
    await prisma.courseAssignment.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.result.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.content.deleteMany();
    await prisma.virtualClass.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.course.deleteMany();
    await prisma.departmentCourse.deleteMany();
    await prisma.departmentAdmin.deleteMany();
    await prisma.schoolAdmin.deleteMany();
    await prisma.senateAdmin.deleteMany();
    await prisma.lecturer.deleteMany();
    await prisma.student.deleteMany();
    await prisma.department.deleteMany();
    await prisma.school.deleteMany();
    await prisma.user.deleteMany();

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
      // Engineering Courses
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
      // Computer Science Courses
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
      // Mathematics Courses
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
      // Faculty-wide Courses (borrowed courses)
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
          level: "LEVEL_100",
          semester: "SECOND",
          schoolId: schools[2].id,
          departmentId: departments[6].id,
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
    await Promise.all([
      // Notifications for students
      prisma.notification.create({
        data: {
          studentId: students[0].id,
          title: "New Assignment Posted",
          message:
            "A new assignment has been posted for Data Structures and Algorithms course.",
          type: "ASSIGNMENT",
          isRead: false,
          metadata: {
            courseId: courses[1].id,
            assignmentId: "ass_001",
          },
        },
      }),
      prisma.notification.create({
        data: {
          studentId: students[1].id,
          title: "Grade Posted",
          message: "Your grade for Database Design Project has been posted.",
          type: "GRADE",
          isRead: true,
          metadata: { courseId: courses[4].id, grade: "A" },
        },
      }),
      prisma.notification.create({
        data: {
          studentId: students[2].id,
          title: "Meeting Reminder",
          message:
            "You have a meeting with your academic advisor tomorrow at 10:00 AM.",
          type: "MEETING",
          isRead: false,
          metadata: { meetingId: "meet_001", time: "10:00 AM" },
        },
      }),
      // Notifications for lecturers
      prisma.notification.create({
        data: {
          lecturerId: lecturers[0].id,
          title: "Course Assignment Confirmed",
          message:
            "You have been assigned to teach Introduction to Programming for the 2024/2025 academic year.",
          type: "ASSIGNMENT",
          isRead: true,
          metadata: { courseId: courses[0].id, semester: "FIRST" },
        },
      }),
      prisma.notification.create({
        data: {
          lecturerId: lecturers[1].id,
          title: "Student Submission",
          message:
            "5 new submissions have been received for Database Design Project.",
          type: "SUBMISSION",
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

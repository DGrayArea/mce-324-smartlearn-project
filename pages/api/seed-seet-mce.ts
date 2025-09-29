import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import * as bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("[seed] START: SEET/MCE seeding...");
    // Basic seed only for SEET → Mechatronics (MCE) with 100–500L shells
    const defaultPasswordHash = await bcrypt.hash("password123", 10);

    // Create School (SEET)
    console.log("[seed] Upserting School (SEET)...");
    const seet = await prisma.school.upsert({
      where: { code: "SEET" },
      update: {},
      create: {
        name: "School of Electrical Engineering and Technology",
        code: "SEET",
      },
    });

    // Department: Mechatronics (MCE)
    console.log("[seed] Upserting Department (MCE)...");
    const mce = await prisma.department.upsert({
      where: { code: "MCE" },
      update: {},
      create: {
        name: "Mechatronics Engineering",
        code: "MCE",
        schoolId: seet.id,
      },
    });

    // Users (Senate Admin, School Admin (SEET), Department Admin (MCE), Lecturers, Students)
    console.log("[seed] Upserting Users (admins/lecturers/students)...");
    const [
      senateAdminUser,
      schoolAdminUser,
      deptAdminUser,
      lecturer1,
      lecturer2,
      lecturer3,
      lecturer4,
      lecturer5,
      lecturer6,
      student100,
      student200,
      student300,
      student400,
      student500,
    ] = await Promise.all([
      prisma.user.upsert({
        where: { email: "senate.admin@university.edu" },
        update: {},
        create: {
          email: "senate.admin@university.edu",
          password: defaultPasswordHash,
          name: "Senate Admin",
          role: "SENATE_ADMIN",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "seet.admin@university.edu" },
        update: {},
        create: {
          email: "seet.admin@university.edu",
          password: defaultPasswordHash,
          name: "SEET School Admin",
          role: "SCHOOL_ADMIN",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "mce.admin@university.edu" },
        update: {},
        create: {
          email: "mce.admin@university.edu",
          password: defaultPasswordHash,
          name: "Engr. O.A. Gray",
          role: "DEPARTMENT_ADMIN",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "folorunsho@university.edu" },
        update: {},
        create: {
          email: "folorunsho@university.edu",
          password: defaultPasswordHash,
          name: "Engr. Dr. T.A Folorunsho",
          role: "LECTURER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "jack@university.edu" },
        update: {},
        create: {
          email: "jack@university.edu",
          password: defaultPasswordHash,
          name: "Engr. Dr. K.E Jack",
          role: "LECTURER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "alkali@university.edu" },
        update: {},
        create: {
          email: "alkali@university.edu",
          password: defaultPasswordHash,
          name: "Dr. Engr. Alkali Babawuya",
          role: "LECTURER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "anunuso@university.edu" },
        update: {},
        create: {
          email: "anunuso@university.edu",
          password: defaultPasswordHash,
          name: "Engr. J.C. Anunuso",
          role: "LECTURER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "atah@university.edu" },
        update: {},
        create: {
          email: "atah@university.edu",
          password: defaultPasswordHash,
          name: "Engr. P.O Atah",
          role: "LECTURER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "bala@university.edu" },
        update: {},
        create: {
          email: "bala@university.edu",
          password: defaultPasswordHash,
          name: "Engr. Dr. J.A Bala",
          role: "LECTURER",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "isa-muby@university.edu" },
        update: {},
        create: {
          email: "isa-muby@university.edu",
          password: defaultPasswordHash,
          name: "Muhammed Isa-Mubaraq",
          role: "STUDENT",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "mce.200l@university.edu" },
        update: {},
        create: {
          email: "mce.200l@university.edu",
          password: defaultPasswordHash,
          name: "Yusuf Adedayo",
          role: "STUDENT",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "mce.300l@university.edu" },
        update: {},
        create: {
          email: "mce.300l@university.edu",
          password: defaultPasswordHash,
          name: "Ojonugwa Blessing",
          role: "STUDENT",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "mce.400l@university.edu" },
        update: {},
        create: {
          email: "mce.400l@university.edu",
          password: defaultPasswordHash,
          name: "Khalid Nurudeen",
          role: "STUDENT",
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: "mce.500l@university.edu" },
        update: {},
        create: {
          email: "mce.500l@university.edu",
          password: defaultPasswordHash,
          name: "Ajiboye AbdulMuiz",
          role: "STUDENT",
          isActive: true,
        },
      }),
    ]);

    // Senate Admin
    await prisma.senateAdmin.upsert({
      where: { userId: senateAdminUser.id },
      update: {
        name: senateAdminUser.name ?? "Senate Admin",
        adminId: "SEN-ADM-0001",
      },
      create: {
        userId: senateAdminUser.id,
        name: senateAdminUser.name ?? "Senate Admin",
        adminId: "SEN-ADM-0001",
      },
    });

    // School Admin (SEET)
    await prisma.schoolAdmin.upsert({
      where: { userId: schoolAdminUser.id },
      update: {
        name: schoolAdminUser.name ?? "SEET Admin",
        schoolId: seet.id,
        adminId: "SEET-ADM-0001",
      },
      create: {
        userId: schoolAdminUser.id,
        name: schoolAdminUser.name ?? "SEET Admin",
        schoolId: seet.id,
        adminId: "SEET-ADM-0001",
      },
    });

    // Link Department Admin
    console.log("[seed] Linking Department Admin to MCE...");
    await prisma.departmentAdmin.upsert({
      where: { userId: deptAdminUser.id },
      update: {
        departmentId: mce.id,
        name: deptAdminUser.name ?? "Department Admin",
        adminId: "MCE-ADM-0001",
      },
      create: {
        userId: deptAdminUser.id,
        departmentId: mce.id,
        name: deptAdminUser.name ?? "Department Admin",
        adminId: "MCE-ADM-0001",
      },
    });

    // Lecturers
    const lecturers = [
      lecturer1,
      lecturer2,
      lecturer3,
      lecturer4,
      lecturer5,
      lecturer6,
    ];
    console.log("[seed] Upserting Lecturers (profiles)...");
    await Promise.all(
      lecturers.map((u) =>
        prisma.lecturer.upsert({
          where: { userId: u.id },
          update: {
            departmentId: mce.id,
            name: u.name ?? "Lecturer",
            staffId: `MCE-LEC-${u.id.slice(-4).toUpperCase()}`,
          },
          create: {
            userId: u.id,
            departmentId: mce.id,
            name: u.name ?? "Lecturer",
            staffId: `MCE-LEC-${u.id.slice(-4).toUpperCase()}`,
          },
        })
      )
    );

    // Students per level with matric prefix mapping and ET suffix
    const matricPrefixByLevel: Record<string, string> = {
      LEVEL_500: "2020/1/",
      LEVEL_400: "2021/1/",
      LEVEL_300: "2022/1/",
      LEVEL_200: "2023/1/",
      LEVEL_100: "2024/1/",
    };

    const studentSeeds = [
      { user: student100, level: "LEVEL_100" },
      { user: student200, level: "LEVEL_200" },
      { user: student300, level: "LEVEL_300" },
      { user: student400, level: "LEVEL_400" },
      { user: student500, level: "LEVEL_500" },
      // Additional students per level
      {
        user: { email: "aisha.ibrahim@university.edu", name: "Aisha Ibrahim" },
        level: "LEVEL_100",
      },
      {
        user: {
          email: "michael.adeoye@university.edu",
          name: "Michael Adeoye",
        },
        level: "LEVEL_100",
      },
      {
        user: {
          email: "grace.ogunleye@university.edu",
          name: "Grace Ogunleye",
        },
        level: "LEVEL_100",
      },
      {
        user: { email: "kunle.yusuf@university.edu", name: "Kunle Yusuf" },
        level: "LEVEL_100",
      },
      {
        user: { email: "david.okoro@university.edu", name: "David Okoro" },
        level: "LEVEL_200",
      },
      {
        user: { email: "emeka.onwu@university.edu", name: "Emeka Onwu" },
        level: "LEVEL_200",
      },
      {
        user: { email: "halima.saidu@university.edu", name: "Halima Saidu" },
        level: "LEVEL_200",
      },
      {
        user: {
          email: "ibrahim.danjuma@university.edu",
          name: "Ibrahim Danjuma",
        },
        level: "LEVEL_200",
      },
      {
        user: { email: "chisom.eze@university.edu", name: "Chisom Eze" },
        level: "LEVEL_300",
      },
      {
        user: {
          email: "ruth.ugochukwu@university.edu",
          name: "Ruth Ugochukwu",
        },
        level: "LEVEL_300",
      },
      {
        user: { email: "samuel.akin@university.edu", name: "Samuel Akin" },
        level: "LEVEL_300",
      },
      {
        user: { email: "sade.oke@university.edu", name: "Sade Oke" },
        level: "LEVEL_300",
      },
      {
        user: { email: "fatima.bello@university.edu", name: "Fatima Bello" },
        level: "LEVEL_400",
      },
      {
        user: { email: "tunde.araoye@university.edu", name: "Tunde Araoye" },
        level: "LEVEL_400",
      },
      {
        user: {
          email: "nifemi.arinola@university.edu",
          name: "Nifemi Arinola",
        },
        level: "LEVEL_400",
      },
      {
        user: { email: "abdul.kareem@university.edu", name: "Abdul Kareem" },
        level: "LEVEL_400",
      },
      {
        user: { email: "zainab.adamu@university.edu", name: "Zainab Adamu" },
        level: "LEVEL_500",
      },
      {
        user: { email: "kelvin.owusu@university.edu", name: "Kelvin Owusu" },
        level: "LEVEL_500",
      },
      {
        user: {
          email: "hassan.muhammad@university.edu",
          name: "Hassan Muhammad",
        },
        level: "LEVEL_500",
      },
      {
        user: { email: "amara.okafor@university.edu", name: "Amara Okafor" },
        level: "LEVEL_500",
      },
    ];

    let counter = 1;
    const allStudents: Array<{ id: string; level: string }> = [];
    for (const s of studentSeeds) {
      console.log(`[seed] Upserting User: ${s.user.email}`);
      const user = await prisma.user.upsert({
        where: { email: s.user.email },
        update: {
          name: s.user.name ?? "Student",
          role: "STUDENT",
        },
        create: {
          email: s.user.email,
          name: s.user.name ?? "Student",
          password: await bcrypt.hash("password123", 10),
          role: "STUDENT",
        },
      });

      console.log(`[seed] Upserting Student profile: level=${s.level}`);
      const matric = `${matricPrefixByLevel[s.level]}${String(counter).padStart(5, "0")}ET`;
      const student = await prisma.student.upsert({
        where: { userId: user.id },
        update: {
          name: s.user.name ?? "Student",
          level: s.level as any,
          departmentId: mce.id,
          phone: "+1 (555) 123-4567",
          address: "123 University Ave, Campus City",
          emergencyContact: "Jane Johnson - +1 (555) 987-6543",
        },
        create: {
          userId: user.id,
          name: s.user.name ?? "Student",
          matricNumber: matric,
          level: s.level as any,
          departmentId: mce.id,
          phone: "+1 (555) 123-4567",
          address: "123 University Ave, Campus City",
          emergencyContact: "Jane Johnson - +1 (555) 987-6543",
        },
      });
      allStudents.push({ id: student.id, level: s.level });
      counter += 1;
    }

    // Build Mechatronics (MCE) course list from proj.csv-inspired mapping
    const courseDefs: Array<{
      code: string;
      title: string;
      level: any;
      semester: any;
      creditUnit: number;
    }> = [
      // 100L FIRST (<=24)
      {
        code: "GST111",
        title: "Communication in English",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "CHM101",
        title: "General Chemistry I",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "CHM107",
        title: "General Chemistry Practical I",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 1,
      },
      {
        code: "MTH101",
        title: "Elementary Mathematics I",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "MCE101",
        title: "Introduction to Mechatronics Engineering",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "PHY101",
        title: "General Physics I",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "PHY107",
        title: "General Physics Practical I",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 1,
      },
      {
        code: "MTH113",
        title: "Elementary Mathematics II",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "CPE101",
        title: "Computer Programming",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "GST112",
        title: "Nigerian People and Culture",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "GET101",
        title: "Engineering in Society",
        level: "LEVEL_100",
        semester: "FIRST",
        creditUnit: 1,
      },

      // 100L SECOND (<=24)
      {
        code: "PHY102",
        title: "General Physics II",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "CHM102",
        title: "General Chemistry II",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "CHM108",
        title: "General Chemistry Practical II",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 1,
      },
      {
        code: "MTH102",
        title: "Elementary Mathematics II",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "GET102",
        title: "Engineering Graphics & Solid Modelling",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "PHY112",
        title: "General Physics III",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "PHY108",
        title: "General Physics Practical II",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 1,
      },
      {
        code: "PHY124",
        title: "General Physics IV",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "EET111",
        title: "Probability",
        level: "LEVEL_100",
        semester: "SECOND",
        creditUnit: 2,
      },

      // 200L FIRST (<=24)
      {
        code: "ENT211",
        title: "Entrepreneurship and Innovation",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "EET201",
        title: "Applied Electricity I",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "GET201",
        title: "Engineering Graphics & Solid Modelling II",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "GET203",
        title: "Fundamentals of Thermodynamics",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "GET205",
        title: "Applied Mechanics",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "GET209",
        title: "Computing and Software Engineering",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "GET211",
        title: "Fundamentals of Fluid Mechanics",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "GET213",
        title: "Engineering Mathematics I",
        level: "LEVEL_200",
        semester: "FIRST",
        creditUnit: 3,
      },

      // 200L SECOND (<=24)
      {
        code: "GET210",
        title: "Engineering Mathematics II",
        level: "LEVEL_200",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "GST212",
        title: "Philosophy, Logic and Human Existence",
        level: "LEVEL_200",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "EET221",
        title: "Applied Electricity II",
        level: "LEVEL_200",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "GET228",
        title: "Strength of Materials",
        level: "LEVEL_200",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE211",
        title: "Introduction to Sensors and Applications",
        level: "LEVEL_200",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "IOT211",
        title: "Introduction to IoT",
        level: "LEVEL_200",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "GET204",
        title: "Students Workshop Practice",
        level: "LEVEL_200",
        semester: "SECOND",
        creditUnit: 2,
      },
      // SIWES I noted in csv but non-credit here

      // 300L FIRST (<=24)
      {
        code: "ELE311",
        title: "Applied Mathematics for Electrical Engineers I",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "ELE312",
        title: "Measurements and Instrumentation",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "ELE313",
        title: "Signals and Systems",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "ELE314",
        title: "Circuit Theory",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "ELE315",
        title: "Analogue Electronic Circuits",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "ELE316",
        title: "General Electrical Laboratory Practical",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "CPE311",
        title: "Computer Programming & Languages",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "GST308",
        title: "Entrepreneurship II",
        level: "LEVEL_300",
        semester: "FIRST",
        creditUnit: 3,
      },

      // 300L SECOND (<=24) - ≥5 MCE courses
      {
        code: "MCE321",
        title: "Sensors and Actuators",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE322",
        title: "Control Engineering II",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE323",
        title: "Introduction to Robotics",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE324",
        title: "Computer Software Engineering",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "MCE325",
        title: "Mechatronics Systems Laboratory I",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "ELE321",
        title: "Applied Mathematics for Electrical Engineers II",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "ELE322",
        title: "Fields Theory",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "EEE321",
        title: "Numerical Methods I",
        level: "LEVEL_300",
        semester: "SECOND",
        creditUnit: 2,
      },

      // 400L FIRST (<=24)
      {
        code: "ELE411",
        title: "Research Methods and Technical Communications",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "MCE401",
        title: "Fluid Power Systems II",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "MCE402",
        title: "Computer Aided Design and Manufacturing",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "MCE403",
        title: "Mechatronics Systems Design",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "MCE404",
        title: "MEMS and VLSI",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "MCE405",
        title: "Digital Image Processing Systems and Applications",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "MCE406",
        title: "Mechatronics Laboratory II",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "MCE407",
        title: "Mechatronics Capstone Project",
        level: "LEVEL_400",
        semester: "FIRST",
        creditUnit: 2,
      },

      // 400L SECOND - SIWES only
      {
        code: "SIW400",
        title: "Student Industrial Work Experience Scheme (SIWES)",
        level: "LEVEL_400",
        semester: "SECOND",
        creditUnit: 6,
      },

      // 500L FIRST (<=24) - ≥5 MCE courses
      {
        code: "MCE501",
        title: "Advanced Mechatronics Systems",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "MCE502",
        title: "Robotics and Automation",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "MCE503",
        title: "Industrial Control Systems",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 3,
      },
      {
        code: "MCE504",
        title: "Mechatronics Project Management",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "MCE505",
        title: "Advanced Sensors and Instrumentation",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "CPE521",
        title: "Independent Project",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 6,
      },
      {
        code: "EEE522",
        title: "Reliability Engineering",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 2,
      },
      {
        code: "ENT501",
        title: "Engineering Entrepreneurship",
        level: "LEVEL_500",
        semester: "FIRST",
        creditUnit: 2,
      },

      // 500L SECOND (<=24) - ≥5 MCE courses
      {
        code: "MCE526",
        title: "Advanced Control Systems",
        level: "LEVEL_500",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE527",
        title: "Mechatronics System Integration",
        level: "LEVEL_500",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE528",
        title: "Smart Manufacturing Systems",
        level: "LEVEL_500",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE529",
        title: "Mechatronics Design Project",
        level: "LEVEL_500",
        semester: "SECOND",
        creditUnit: 3,
      },
      {
        code: "MCE530",
        title: "Industrial Automation",
        level: "LEVEL_500",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "DBM501",
        title: "Database Management Systems",
        level: "LEVEL_500",
        semester: "SECOND",
        creditUnit: 2,
      },
      {
        code: "MGT501",
        title: "Engineering Management and Law",
        level: "LEVEL_500",
        semester: "SECOND",
        creditUnit: 2,
      },
    ];

    // Rebalance courses per your rules and log summary
    function isMce(code: string): boolean {
      return code.toUpperCase().startsWith("MCE");
    }
    function pick<T>(arr: T[], n: number): T[] {
      return arr.slice(0, Math.max(0, Math.min(n, arr.length)));
    }
    function ensureCount<T>(arr: T[], target: number, filler: T[]): T[] {
      if (arr.length >= target) return arr.slice(0, target);
      const need = target - arr.length;
      return [
        ...arr,
        ...pick(
          filler.filter((x) => !arr.includes(x)),
          need
        ),
      ];
    }

    const levelsAll = [
      "LEVEL_100",
      "LEVEL_200",
      "LEVEL_300",
      "LEVEL_400",
      "LEVEL_500",
    ];
    const semestersAll = ["FIRST", "SECOND"] as const;

    console.log("[seed] Balancing course lists per level/semester...");
    const grouped: Record<
      string,
      {
        code: string;
        title: string;
        level: any;
        semester: any;
        creditUnit: number;
      }[]
    > = {};
    for (const c of courseDefs) {
      const key = `${c.level}:${c.semester}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    }

    const balanced: typeof courseDefs = [];
    for (const L of levelsAll) {
      for (const S of semestersAll) {
        const key = `${L}:${S}`;
        let list = (grouped[key] || []).slice();
        const mceList = list.filter((c) => isMce(c.code));
        const nonMceList = list.filter((c) => !isMce(c.code));

        let targetTotal = 8; // aim for 8 (within 7-9)
        if (L === "LEVEL_400" && S === "SECOND") {
          // SIWES only; keep as-is
          balanced.push(...list);
          console.log(`[seed] ${key} → SIWES only: ${list.length} course(s)`);
          continue;
        }

        if (
          (L === "LEVEL_100" || L === "LEVEL_200" || L === "LEVEL_300") &&
          S === "FIRST"
        ) {
          // Exactly 1 MCE course, then add non-MCE to reach targetTotal
          const pickedMce = pick(mceList, 1);
          const remainingSlots = targetTotal - pickedMce.length;
          const pickedNonMce = pick(nonMceList, remainingSlots);
          list = [...pickedMce, ...pickedNonMce];
        } else if (
          (L === "LEVEL_300" && S === "SECOND") ||
          (L === "LEVEL_400" && S === "FIRST") ||
          (L === "LEVEL_500" && (S === "FIRST" || S === "SECOND"))
        ) {
          // At least 5 MCE courses, then add non-MCE to reach targetTotal
          const pickedMce = pick(mceList, Math.min(5, mceList.length));
          const remainingSlots = targetTotal - pickedMce.length;
          const pickedNonMce = pick(nonMceList, remainingSlots);
          list = [...pickedMce, ...pickedNonMce];
          console.log(
            `[seed] ${key} → MCE=${pickedMce.length}, non-MCE=${pickedNonMce.length}, total=${list.length}`
          );
        } else if (L === "LEVEL_200" && S === "SECOND") {
          // 200L SECOND: 1 MCE course + non-MCE to reach targetTotal
          const pickedMce = pick(mceList, 1);
          const remainingSlots = targetTotal - pickedMce.length;
          const pickedNonMce = pick(nonMceList, remainingSlots);
          list = [...pickedMce, ...pickedNonMce];
        } else {
          // Other cases: trim to targetTotal if oversized
          if (list.length > targetTotal) list = list.slice(0, targetTotal);
        }

        // Ensure credit total <= 24 by trimming from end if needed
        const sum = (arr: typeof list) =>
          arr.reduce((a, b) => a + (b.creditUnit || 0), 0);
        while (sum(list) > 24 && list.length > 0) {
          list.pop();
        }
        // If under 7, try adding more non-MCE fillers
        while (list.length < 7 && nonMceList.length > 0) {
          const next = nonMceList.find((x) => !list.includes(x));
          if (!next) break;
          if (sum([...list, next]) <= 24) list.push(next);
          else break;
        }

        balanced.push(...list);
        console.log(
          `[seed] ${key} → total=${list.length}, MCE=${list.filter((c) => isMce(c.code)).length}, CU=${sum(list)}`
        );
      }
    }

    // Use balanced list for upsert
    console.log("[seed] Upserting balanced courses to DB...");
    await Promise.all(
      balanced.map((c) =>
        prisma.course.upsert({
          where: { code: c.code },
          update: {
            title: c.title,
            creditUnit: c.creditUnit,
            type: "DEPARTMENTAL",
            level: c.level,
            semester: c.semester,
            departmentId: mce.id,
            isActive: true,
          },
          create: {
            code: c.code,
            title: c.title,
            creditUnit: c.creditUnit,
            type: "DEPARTMENTAL",
            level: c.level,
            semester: c.semester,
            departmentId: mce.id,
            isActive: true,
          },
        })
      )
    );

    // Deactivate courses that are not in the balanced list
    const balancedCodes = new Set(balanced.map((c) => c.code));
    await prisma.course.updateMany({
      where: {
        departmentId: mce.id,
        code: { notIn: Array.from(balancedCodes) },
      },
      data: { isActive: false },
    });

    // --------------------
    // Historical data backfill for 200L-500L: Enrollments + Results (CA/Exam/Total/Grade)
    // Rules:
    // - 100L: no history/CGPA
    // - 400L 2nd semester (SIWES) has no grade contribution
    // - Sessions: current is 2024/2025; earlier sessions counted backwards
    // - 500L: 2019/2020 → 2023/2024 (100–400L)
    // - 400L: 2020/2021 → 2023/2024 (100–300L)
    // - 300L: 2021/2022 → 2023/2024 (100–200L)
    // - 200L: 2023/2024 (100L)

    function sessionForOffset(startYear: number, offset: number): string {
      const from = startYear + offset;
      const to = from + 1;
      return `${from}/${to}`;
    }

    function gradeFromTotal(total: number): string {
      if (total >= 70) return "A";
      if (total >= 60) return "B";
      if (total >= 50) return "C";
      if (total >= 45) return "D";
      if (total >= 40) return "E";
      return "F";
    }

    async function backfillForStudent(
      studentUserId: string,
      currentLevel: any
    ) {
      const student = await prisma.student.findFirst({
        where: { userId: studentUserId },
      });
      if (!student) return;
      console.log(
        `[seed] Backfill start for student=${student.id}, currentLevel=${currentLevel}`
      );

      // Map target sessions by level for this student
      // Determine how many prior levels to backfill
      const levelOrder = [
        "LEVEL_100",
        "LEVEL_200",
        "LEVEL_300",
        "LEVEL_400",
        "LEVEL_500",
      ];
      const currentIdx = levelOrder.indexOf(currentLevel);
      if (currentIdx <= 0) return;

      // Determine starting academic year based on level:
      // 500L → start 2019/2020, 400L → 2020/2021, 300L → 2021/2022, 200L → 2023/2024
      const startYearByLevel: Record<string, number> = {
        LEVEL_500: 2019,
        LEVEL_400: 2020,
        LEVEL_300: 2021,
        LEVEL_200: 2023,
        LEVEL_100: 2024,
      };

      const startYear = startYearByLevel[currentLevel] ?? 2024;

      // For each prior index from 0 .. currentIdx-1
      for (let i = 0; i < currentIdx; i++) {
        const level = levelOrder[i];
        const session = sessionForOffset(startYear, i);
        console.log(`[seed]  → Session ${session} for level ${level}`);

        // Fetch courses for this historical level
        const firstSemCourses = await prisma.course.findMany({
          where: {
            departmentId: mce.id,
            level: level as any,
            semester: "FIRST",
            isActive: true,
          },
        });
        const secondSemCourses = await prisma.course.findMany({
          where: {
            departmentId: mce.id,
            level: level as any,
            semester: "SECOND",
            isActive: true,
          },
        });

        // Create enrollments and results for FIRST semester
        for (const c of firstSemCourses) {
          await prisma.enrollment.upsert({
            where: {
              studentId_courseId_academicYear_semester: {
                studentId: student.id,
                courseId: c.id,
                academicYear: session,
                semester: "FIRST",
              },
            },
            update: { isActive: false },
            create: {
              studentId: student.id,
              courseId: c.id,
              academicYear: session,
              semester: "FIRST",
              isActive: false,
            },
          });

          // Random but reasonable CA/Exam totals (avoid F < 40)
          let ca = Math.floor(18 + Math.random() * 22); // 18-39
          let exam = Math.floor(28 + Math.random() * 45); // 28-72
          let total = Math.min(100, ca + exam);
          if (total < 40) {
            const boost = 40 - total;
            exam = Math.min(72, exam + boost);
            total = Math.min(100, ca + exam);
          }
          const grade = gradeFromTotal(total);

          await prisma.result.upsert({
            where: {
              studentId_courseId_academicYear_semester: {
                studentId: student.id,
                courseId: c.id,
                academicYear: session,
                semester: "FIRST",
              },
            },
            update: { caScore: ca, examScore: exam, totalScore: total, grade },
            create: {
              studentId: student.id,
              courseId: c.id,
              academicYear: session,
              semester: "FIRST",
              caScore: ca,
              examScore: exam,
              totalScore: total,
              grade,
            },
          });
        }

        // Create enrollments and results for SECOND semester
        for (const c of secondSemCourses) {
          const isSiwes = c.code.toUpperCase().includes("SIW");
          await prisma.enrollment.upsert({
            where: {
              studentId_courseId_academicYear_semester: {
                studentId: student.id,
                courseId: c.id,
                academicYear: session,
                semester: "SECOND",
              },
            },
            update: { isActive: false },
            create: {
              studentId: student.id,
              courseId: c.id,
              academicYear: session,
              semester: "SECOND",
              isActive: false,
            },
          });

          if (!isSiwes) {
            let ca = Math.floor(18 + Math.random() * 22);
            let exam = Math.floor(28 + Math.random() * 45);
            let total = Math.min(100, ca + exam);
            if (total < 40) {
              const boost = 40 - total;
              exam = Math.min(72, exam + boost);
              total = Math.min(100, ca + exam);
            }
            const grade = gradeFromTotal(total);

            await prisma.result.upsert({
              where: {
                studentId_courseId_academicYear_semester: {
                  studentId: student.id,
                  courseId: c.id,
                  academicYear: session,
                  semester: "SECOND",
                },
              },
              update: {
                caScore: ca,
                examScore: exam,
                totalScore: total,
                grade,
              },
              create: {
                studentId: student.id,
                courseId: c.id,
                academicYear: session,
                semester: "SECOND",
                caScore: ca,
                examScore: exam,
                totalScore: total,
                grade,
              },
            });
          }
        }
      }
      console.log(`[seed] Backfill done for student=${student.id}`);
    }

    // Backfill for students by level (200L-500L only)
    console.log("[seed] Historical backfill for students (200–500L)...");
    const backfillPromises = allStudents
      .filter((s) => s.level !== "LEVEL_100")
      .map((s) => backfillForStudent(s.id, s.level));
    await Promise.all(backfillPromises);
    console.log("[seed] COMPLETE: SEET/MCE seeding finished.");

    return res.status(200).json({
      message: "SEET/MCE seed completed",
      details: {
        school: seet.name,
        department: mce.name,
        users: {
          senateAdmin: 1,
          schoolAdmin: 1,
          departmentAdmin: 1,
          lecturers: 6,
          students: 5,
        },
        courses: courseDefs.length,
        levels: ["100L", "200L", "300L", "400L", "500L"],
      },
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return res
      .status(500)
      .json({ message: "Seed failed", error: error?.message });
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { ResultStatus, UserRole } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Get user with admin profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      departmentAdmin: true,
      schoolAdmin: true,
      senateAdmin: true,
    },
  });

  if (!user?.departmentAdmin && !user?.schoolAdmin && !user?.senateAdmin) {
    return res.status(403).json({
      message: "Only admins can manage result approvals",
    });
  }

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res, user);
      case "PUT":
        return handlePut(req, res, user);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Result approval API error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// GET: Fetch results pending approval
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { academicYear, semester, status, level } = req.query;

  // Determine admin level and department
  let adminId: string | null = null;
  let adminRole: UserRole | null = null;
  let departmentId: string | null = null;

  if (user.departmentAdmin) {
    adminId = user.departmentAdmin.id;
    adminRole = "DEPARTMENT_ADMIN";
    departmentId = user.departmentAdmin.departmentId;
  } else if (user.schoolAdmin) {
    adminId = user.schoolAdmin.id;
    adminRole = "SCHOOL_ADMIN";
    // School admins can see all departments in their school
    departmentId = null; // Will be filtered by school
  } else if (user.senateAdmin) {
    adminId = user.senateAdmin.id;
    adminRole = "SENATE_ADMIN";
    // Senate admins can see all results
    departmentId = null;
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

  // Filter based on admin level - admins view student results as a whole
  if (user.departmentAdmin) {
    // Department admins see all students in their department across all courses
    whereClause.student = { departmentId: user.departmentAdmin.departmentId };
  } else if (user.schoolAdmin) {
    // School admins see all students in their school across all courses
    whereClause.student = {
      department: { schoolId: user.schoolAdmin.schoolId },
    };
  }
  // Senate admins can see all results across all students and courses

  // Filter by approval level
  if (level && level !== "ALL") {
    whereClause.approvals = {
      some: {
        level: level as UserRole,
      },
    };
  }

  try {
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

    // Calculate statistics
    const total = results.length;
    const pending = results.filter((r) => r.status === "PENDING").length;
    const departmentApproved = results.filter(
      (r) => r.status === "DEPARTMENT_APPROVED"
    ).length;
    const facultyApproved = results.filter(
      (r) => r.status === "FACULTY_APPROVED"
    ).length;
    const senateApproved = results.filter(
      (r) => r.status === "SENATE_APPROVED"
    ).length;
    const rejected = results.filter((r) => r.status === "REJECTED").length;

    return res.status(200).json({
      results,
      statistics: {
        total,
        pending,
        departmentApproved,
        facultyApproved,
        senateApproved,
        rejected,
      },
      adminInfo: {
        role: adminRole,
        departmentId,
      },
    });
  } catch (error) {
    console.error("Error fetching results for approval:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PUT: Approve or reject results
async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { resultIds, action, comments } = req.body;

  if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
    return res.status(400).json({ message: "Result IDs are required" });
  }

  if (!action || (action !== "approve" && action !== "reject")) {
    return res.status(400).json({ message: "Invalid action specified" });
  }

  // Determine admin level
  let adminId: string | null = null;
  let adminRole: UserRole | null = null;
  let newStatus: ResultStatus;

  if (user.departmentAdmin) {
    adminId = user.departmentAdmin.id;
    adminRole = "DEPARTMENT_ADMIN";
    newStatus = action === "approve" ? "DEPARTMENT_APPROVED" : "REJECTED";
  } else if (user.schoolAdmin) {
    adminId = user.schoolAdmin.id;
    adminRole = "SCHOOL_ADMIN";
    newStatus = action === "approve" ? "FACULTY_APPROVED" : "REJECTED";
  } else if (user.senateAdmin) {
    adminId = user.senateAdmin.id;
    adminRole = "SENATE_ADMIN";
    newStatus = action === "approve" ? "SENATE_APPROVED" : "REJECTED";
  } else {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    // If rejecting, allow changes at department/school level
    if (
      action === "reject" &&
      (adminRole === "DEPARTMENT_ADMIN" || adminRole === "SCHOOL_ADMIN")
    ) {
      // Reset status to PENDING to allow lecturer to make changes
      newStatus = "PENDING";
    }

    const updatedResults = await prisma.$transaction(
      resultIds.map((resultId: string) =>
        prisma.result.update({
          where: { id: resultId },
          data: {
            status: newStatus,
            // If rejected by department/school, reset to allow changes
            ...(action === "reject" &&
              (adminRole === "DEPARTMENT_ADMIN" ||
                adminRole === "SCHOOL_ADMIN") && {
                caScore: null,
                examScore: null,
                totalScore: null,
                grade: null,
              }),
          },
          include: {
            student: { select: { name: true, matricNumber: true } },
            course: { select: { title: true, code: true } },
          },
        })
      )
    );

    // Create approval records
    const approvalRecords = resultIds.map((resultId: string) => ({
      resultId,
      level: adminRole!,
      status: newStatus,
      comments: comments || null,
      ...(user.departmentAdmin && { departmentAdminId: adminId }),
      ...(user.schoolAdmin && { schoolAdminId: adminId }),
      ...(user.senateAdmin && { senateAdminId: adminId }),
    }));

    await prisma.resultApproval.createMany({
      data: approvalRecords,
    });

    return res.status(200).json({
      message: `${resultIds.length} result(s) ${action === "approve" ? "approved" : "rejected"} successfully.`,
      updatedResults,
    });
  } catch (error) {
    console.error(`Error during batch ${action} of results:`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

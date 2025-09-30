import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session?.user as any)?.id;

  if (!session || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (
    !user ||
    !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(user.role)
  ) {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }

  if (req.method === "GET") {
    try {
      const { level, status, academicYear, semester } = req.query;

      // Build where clause based on user role and query parameters
      let whereClause: any = {};

      // Filter by approval level based on user role
      if (user.role === "DEPARTMENT_ADMIN") {
        whereClause = {
          OR: [
            { level: "DEPARTMENT_ADMIN", status: "PENDING" },
            { level: "DEPARTMENT_ADMIN", status: "DEPARTMENT_APPROVED" },
          ],
        };
      } else if (user.role === "SCHOOL_ADMIN") {
        whereClause = {
          OR: [
            { level: "SCHOOL_ADMIN", status: "DEPARTMENT_APPROVED" },
            { level: "SCHOOL_ADMIN", status: "FACULTY_APPROVED" },
          ],
        };
      } else if (user.role === "SENATE_ADMIN") {
        whereClause = {
          OR: [
            { level: "SENATE_ADMIN", status: "FACULTY_APPROVED" },
            { level: "SENATE_ADMIN", status: "SENATE_APPROVED" },
          ],
        };
      }

      // Add additional filters
      if (level) {
        whereClause.level = level;
      }
      if (status) {
        whereClause.status = status;
      }

      // Get result approvals with related data
      const approvals = await prisma.resultApproval.findMany({
        where: whereClause,
        include: {
          result: {
            include: {
              student: {
                include: {
                  user: true,
                  department: true,
                },
              },
              course: {
                include: {
                  department: true,
                },
              },
            },
          },
          departmentAdmin: {
            include: {
              user: true,
            },
          },
          schoolAdmin: {
            include: {
              user: true,
            },
          },
          senateAdmin: {
            include: {
              user: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      });

      // Filter by academic year and semester if provided
      let filteredApprovals = approvals;
      if (academicYear) {
        filteredApprovals = filteredApprovals.filter(
          (approval) => approval.result.academicYear === academicYear
        );
      }
      if (semester) {
        filteredApprovals = filteredApprovals.filter(
          (approval) => approval.result.semester === semester
        );
      }

      res.status(200).json({
        success: true,
        approvals: filteredApprovals,
        userRole: user.role,
      });
    } catch (error) {
      console.error("Error fetching result approvals:", error);
      res.status(500).json({
        message: "Error fetching result approvals",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { resultId, action, comments } = req.body;

      if (!resultId || !action) {
        return res.status(400).json({
          message: "Result ID and action are required",
        });
      }

      // Get the result
      const result = await prisma.result.findUnique({
        where: { id: resultId },
        include: {
          approvals: true,
        },
      });

      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }

      // Determine the approval level based on user role
      let approvalLevel: string;
      let newStatus: string;
      let nextLevel: string;

      if (user.role === "DEPARTMENT_ADMIN") {
        approvalLevel = "DEPARTMENT_ADMIN";
        newStatus = action === "approve" ? "DEPARTMENT_APPROVED" : "REJECTED";
        nextLevel = "SCHOOL_ADMIN";
      } else if (user.role === "SCHOOL_ADMIN") {
        approvalLevel = "SCHOOL_ADMIN";
        newStatus = action === "approve" ? "FACULTY_APPROVED" : "REJECTED";
        nextLevel = "SENATE_ADMIN";
      } else if (user.role === "SENATE_ADMIN") {
        approvalLevel = "SENATE_ADMIN";
        newStatus = action === "approve" ? "SENATE_APPROVED" : "REJECTED";
        nextLevel = null;
      }

      // Update or create the approval record
      const approvalData = {
        resultId,
        level: approvalLevel as any,
        status: newStatus as any,
        comments: comments || null,
        ...(user.role === "DEPARTMENT_ADMIN" && { departmentAdminId: userId }),
        ...(user.role === "SCHOOL_ADMIN" && { schoolAdminId: userId }),
        ...(user.role === "SENATE_ADMIN" && { senateAdminId: userId }),
      };

      await prisma.resultApproval.upsert({
        where: {
          resultId_level: {
            resultId,
            level: approvalLevel as any,
          },
        },
        update: {
          status: newStatus as any,
          comments: comments || null,
        },
        create: approvalData,
      });

      // Update the main result status
      await prisma.result.update({
        where: { id: resultId },
        data: { status: newStatus as any },
      });

      // If approved and there's a next level, create the next approval record
      if (action === "approve" && nextLevel) {
        await prisma.resultApproval.create({
          data: {
            resultId,
            level: nextLevel as any,
            status: "PENDING",
          },
        });
      }

      // Send notifications to relevant users
      if (action === "approve") {
        // Notify student about approval
        await prisma.notification.create({
          data: {
            userId: result.student.userId,
            type: "GRADE",
            title: "Result Approved",
            message: `Your result for ${result.course.title} has been approved at ${approvalLevel} level.`,
            data: {
              resultId,
              level: approvalLevel,
              status: newStatus,
            },
            isRead: false,
          },
        });

        // If this is the final approval, notify student
        if (user.role === "SENATE_ADMIN") {
          await prisma.notification.create({
            data: {
              userId: result.student.userId,
              type: "GRADE",
              title: "Result Finalized",
              message: `Your result for ${result.course.title} has been finalized and is now available.`,
              data: {
                resultId,
                status: "SENATE_APPROVED",
              },
              isRead: false,
            },
          });
        }
      } else {
        // Notify student about rejection
        await prisma.notification.create({
          data: {
            userId: result.student.userId,
            type: "GRADE",
            title: "Result Rejected",
            message: `Your result for ${result.course.title} has been rejected at ${approvalLevel} level. ${comments ? `Reason: ${comments}` : ""}`,
            data: {
              resultId,
              level: approvalLevel,
              status: "REJECTED",
              comments,
            },
            isRead: false,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: `Result ${action}d successfully`,
        newStatus,
        approvalLevel,
      });
    } catch (error) {
      console.error("Error processing result approval:", error);
      res.status(500).json({
        message: "Error processing result approval",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

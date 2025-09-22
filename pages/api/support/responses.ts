import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        student: true,
        lecturer: true,
        departmentAdmin: true,
        schoolAdmin: true,
        senateAdmin: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.method === "GET") {
      // Get support ticket responses
      const { ticketId, page = "1", limit = "20" } = req.query;

      if (!ticketId || typeof ticketId !== "string") {
        return res.status(400).json({ message: "Ticket ID is required" });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Check if user has access to this ticket
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            include: {
              student: {
                include: {
                  department: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Check access permissions
      let hasAccess = false;

      if (currentUser.role === "STUDENT" && currentUser.student) {
        hasAccess = ticket.userId === session.user.id;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        hasAccess =
          ticket.assignedToId === session.user.id ||
          (ticket.user.student && ticket.user.student.departmentId === currentUser.lecturer.departmentId);
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        hasAccess =
          ticket.assignedToId === session.user.id ||
          (ticket.user.student && ticket.user.student.departmentId ===
            currentUser.departmentAdmin.departmentId);
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        hasAccess =
          ticket.assignedToId === session.user.id ||
          (ticket.user.student && ticket.user.student.department.schoolId ===
            currentUser.schoolAdmin.schoolId);
      } else if (currentUser.role === "SENATE_ADMIN") {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this ticket" });
      }

      const responses = await prisma.supportResponse.findMany({
        where: { ticketId },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limitNum,
      });

      const totalResponses = await prisma.supportResponse.count({
        where: { ticketId },
      });

      return res.status(200).json({
        responses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResponses,
          pages: Math.ceil(totalResponses / limitNum),
        },
      });
    } else if (req.method === "POST") {
      // Create a support ticket response
      const { ticketId, content, isInternal } = req.body;

      if (!ticketId || !content) {
        return res.status(400).json({
          message: "Ticket ID and content are required",
        });
      }

      // Check if ticket exists and user has access
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            include: {
              student: {
                include: {
                  department: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Check access permissions
      let hasAccess = false;

      if (currentUser.role === "STUDENT" && currentUser.student) {
        hasAccess = ticket.userId === session.user.id;
      } else if (
        [
          "LECTURER",
          "DEPARTMENT_ADMIN",
          "SCHOOL_ADMIN",
          "SENATE_ADMIN",
        ].includes(currentUser.role)
      ) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this ticket" });
      }

      // Students cannot create internal responses
      if (isInternal && currentUser.role === "STUDENT") {
        return res
          .status(403)
          .json({ message: "Students cannot create internal responses" });
      }

      const response = await prisma.supportResponse.create({
        data: {
          ticketId,
          message: content,
          userId: session.user.id,
          isInternal: isInternal || false,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // Update ticket status if it's a staff response
      if (
        [
          "LECTURER",
          "DEPARTMENT_ADMIN",
          "SCHOOL_ADMIN",
          "SENATE_ADMIN",
        ].includes(currentUser.role)
      ) {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
          },
        });
      }

      return res.status(201).json({ response });
    } else if (req.method === "PUT") {
      // Update a support ticket response
      const { responseId, content } = req.body;

      if (!responseId || !content) {
        return res.status(400).json({
          message: "Response ID and content are required",
        });
      }

      const response = await prisma.supportResponse.findUnique({
        where: { id: responseId },
        include: {
          ticket: {
          },
        },
      });

      if (!response) {
        return res.status(404).json({ message: "Support response not found" });
      }

      // Check permissions
      let canUpdate = false;

      // Authors can update their own responses
      if (response.userId === session.user.id) {
        canUpdate = true;
      } else if (
        ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
          currentUser.role
        )
      ) {
        // Admins can update any response
        canUpdate = true;
      }

      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedResponse = await prisma.supportResponse.update({
        where: { id: responseId },
        data: { message: content },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(200).json({ response: updatedResponse });
    } else if (req.method === "DELETE") {
      // Delete a support ticket response
      const { responseId } = req.query;

      if (!responseId || typeof responseId !== "string") {
        return res.status(400).json({ message: "Response ID is required" });
      }

      const response = await prisma.supportResponse.findUnique({
        where: { id: responseId },
        include: {
          ticket: {
          },
        },
      });

      if (!response) {
        return res.status(404).json({ message: "Support response not found" });
      }

      // Check permissions
      let canDelete = false;

      // Authors can delete their own responses
      if (response.userId === session.user.id) {
        canDelete = true;
      } else if (
        ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
          currentUser.role
        )
      ) {
        // Admins can delete any response
        canDelete = true;
      }

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.supportResponse.delete({
        where: { id: responseId },
      });

      return res
        .status(200)
        .json({ message: "Support response deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in support responses API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

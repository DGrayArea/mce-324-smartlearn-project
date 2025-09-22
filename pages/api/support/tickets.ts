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
      // Get support tickets
      const {
        status,
        priority,
        category,
        assignedTo,
        page = "1",
        limit = "20",
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let whereClause: any = {};

      // Filter by status
      if (status && typeof status === "string") {
        whereClause.status = status;
      }

      // Filter by priority
      if (priority && typeof priority === "string") {
        whereClause.priority = priority;
      }

      // Filter by category
      if (category && typeof category === "string") {
        whereClause.category = category;
      }

      // Filter by assigned user
      if (assignedTo && typeof assignedTo === "string") {
        whereClause.assignedToId = assignedTo;
      }

      // Role-based access
      if (currentUser.role === "STUDENT" && currentUser.student) {
        // Students can only see their own tickets
        whereClause.studentId = currentUser.student.id;
      } else if (currentUser.role === "LECTURER" && currentUser.lecturer) {
        // Lecturers can see tickets assigned to them or from their students
        whereClause.OR = [
          { assignedToId: session.user.id },
          {
            student: {
              departmentId: currentUser.lecturer.departmentId,
            },
          },
        ];
      } else if (
        currentUser.role === "DEPARTMENT_ADMIN" &&
        currentUser.departmentAdmin
      ) {
        // Department admins can see tickets for their department
        whereClause.OR = [
          { assignedToId: session.user.id },
          {
            student: {
              departmentId: currentUser.departmentAdmin.departmentId,
            },
          },
        ];
      } else if (
        currentUser.role === "SCHOOL_ADMIN" &&
        currentUser.schoolAdmin
      ) {
        // School admins can see tickets for their school
        whereClause.OR = [
          { assignedToId: session.user.id },
          {
            student: {
              department: {
                schoolId: currentUser.schoolAdmin.schoolId,
              },
            },
          },
        ];
      }
      // Senate admins can see all tickets (no additional filter)

      const tickets = await prisma.supportTicket.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true, role: true },
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: limitNum,
      });

      const totalTickets = await prisma.supportTicket.count({
        where: whereClause,
      });

      // Get ticket statistics
      const ticketStats = await prisma.supportTicket.groupBy({
        by: ["status", "priority"],
        _count: { id: true },
        where: whereClause,
      });

      return res.status(200).json({
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalTickets,
          pages: Math.ceil(totalTickets / limitNum),
        },
        stats: ticketStats,
      });
    } else if (req.method === "POST") {
      // Create a support ticket
      const { title, description, category, priority, attachments } = req.body;

      if (!title || !description || !category) {
        return res.status(400).json({
          message: "Title, description, and category are required",
        });
      }

      if (!currentUser.student) {
        return res
          .status(403)
          .json({ message: "Only students can create support tickets" });
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          title,
          description,
          category,
          priority: priority || "MEDIUM",
          status: "OPEN",
          userId: session.user.id,
        } as any,
      });

      return res.status(201).json({ ticket });
    } else if (req.method === "PUT") {
      // Update a support ticket
      const {
        ticketId,
        title,
        description,
        status,
        priority,
        assignedToId,
        resolution,
      } = req.body;

      if (!ticketId) {
        return res.status(400).json({ message: "Ticket ID is required" });
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: true,
        },
      });

      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Check permissions
      let canUpdate = false;

      // Students can update their own tickets (limited fields)
      if (currentUser.role === "STUDENT" && currentUser.student) {
        if (ticket.userId === currentUser.student.userId) {
          canUpdate = true;
        }
      } else if (
        [
          "LECTURER",
          "DEPARTMENT_ADMIN",
          "SCHOOL_ADMIN",
          "SENATE_ADMIN",
        ].includes(currentUser.role)
      ) {
        // Staff can update tickets in their scope
        canUpdate = true;
      }

      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData: any = {};

      // Students can only update title and description
      if (currentUser.role === "STUDENT") {
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
      } else {
        // Staff can update all fields
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
        if (resolution !== undefined) updateData.resolution = resolution;
      }

      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          student: {
            select: { id: true, name: true, studentId: true },
          },
          assignedTo: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return res.status(200).json({ ticket: updatedTicket });
    } else if (req.method === "DELETE") {
      // Delete a support ticket
      const { ticketId } = req.query;

      if (!ticketId || typeof ticketId !== "string") {
        return res.status(400).json({ message: "Ticket ID is required" });
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: true,
        },
      });

      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Check permissions
      let canDelete = false;

      // Students can delete their own tickets
      if (currentUser.role === "STUDENT" && currentUser.student) {
        if (ticket.userId === currentUser.student.userId) {
          canDelete = true;
        }
      } else if (
        ["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
          currentUser.role
        )
      ) {
        // Admins can delete tickets in their scope
        canDelete = true;
      }

      if (!canDelete) {
        return res.status(403).json({ message: "Access denied" });
      }

      await prisma.supportTicket.delete({
        where: { id: ticketId },
      });

      return res
        .status(200)
        .json({ message: "Support ticket deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in support tickets API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

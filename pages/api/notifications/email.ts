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

    if (req.method === "POST") {
      const { 
        type, 
        recipientId, 
        recipientEmail, 
        subject, 
        content, 
        template,
        data 
      } = req.body;

      // Validate required fields
      if (!type || !subject || !content) {
        return res.status(400).json({ 
          message: "Missing required fields: type, subject, content" 
        });
      }

      // Check if user has permission to send emails
      const hasPermission = [
        "DEPARTMENT_ADMIN",
        "SCHOOL_ADMIN", 
        "SENATE_ADMIN"
      ].includes(currentUser.role);

      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Send email notification
      const emailResult = await sendEmailNotification({
        type,
        recipientId,
        recipientEmail,
        subject,
        content,
        template,
        data,
        senderId: currentUser.id,
      });

      return res.status(200).json({
        success: true,
        message: "Email notification sent successfully",
        emailId: emailResult.id,
      });
    }

    if (req.method === "GET") {
      const { type, status, page = "1", limit = "20" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let whereClause: any = {};

      if (type) {
        whereClause.type = type;
      }

      if (status) {
        whereClause.status = status;
      }

      // Get email notifications
      const emailNotifications = await prisma.emailNotification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true },
          },
          recipient: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      const total = await prisma.emailNotification.count({
        where: whereClause,
      });

      return res.status(200).json({
        emailNotifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Error handling email notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function sendEmailNotification({
  type,
  recipientId,
  recipientEmail,
  subject,
  content,
  template,
  data,
  senderId,
}: {
  type: string;
  recipientId?: string;
  recipientEmail?: string;
  subject: string;
  content: string;
  template?: string;
  data?: any;
  senderId: string;
}) {
  // Get recipient information
  let recipient = null;
  if (recipientId) {
    recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true, role: true },
    });
  } else if (recipientEmail) {
    recipient = await prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  if (!recipient) {
    throw new Error("Recipient not found");
  }

  // Generate email content based on template
  let emailContent = content;
  if (template && data) {
    emailContent = generateEmailFromTemplate(template, data);
  }

  // Create email notification record
  const emailNotification = await prisma.emailNotification.create({
    data: {
      type,
      subject,
      content: emailContent,
      template: template || null,
      data: data ? JSON.stringify(data) : null,
      senderId,
      recipientId: recipient.id,
      status: "PENDING",
      scheduledAt: new Date(),
    },
  });

  // Simulate email sending (in production, integrate with email service)
  try {
    await simulateEmailSending(emailNotification);
    
    // Update status to sent
    await prisma.emailNotification.update({
      where: { id: emailNotification.id },
      data: { 
        status: "SENT",
        sentAt: new Date(),
      },
    });

    // Create in-app notification for recipient
    // Get user's role-specific ID
    const user = await prisma.user.findUnique({
      where: { id: recipient.id },
      include: { student: true, lecturer: true }
    });

    if (user) {
      const notificationData: any = {
        title: "Email Notification Sent",
        message: `You have received an email: ${subject}`,
        type: "ANNOUNCEMENT" as const,
        isRead: false,
        metadata: JSON.stringify({
          emailId: emailNotification.id,
          type,
        }),
      };

      if (user.student) {
        notificationData.studentId = user.student.id;
      } else if (user.lecturer) {
        notificationData.lecturerId = user.lecturer.id;
      }

      await prisma.notification.create({
        data: notificationData,
      });
    }

  } catch (error) {
    // Update status to failed
    await prisma.emailNotification.update({
      where: { id: emailNotification.id },
      data: { 
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }

  return emailNotification;
}

function generateEmailFromTemplate(template: string, data: any): string {
  // Simple template engine
  let content = template;
  
  // Replace placeholders with data
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), data[key] || '');
  });

  return content;
}

async function simulateEmailSending(emailNotification: any) {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate occasional failures (5% failure rate)
  if (Math.random() < 0.05) {
    throw new Error("Email service temporarily unavailable");
  }
  
  // Log email sending
  console.log(`Email sent: ${emailNotification.subject} to ${emailNotification.recipientId}`);
}


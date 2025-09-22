import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "POST":
      return handleContactForm(req, res);
    default:
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handleContactForm(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, email, subject, message, category = "GENERAL" } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "Name, email, subject, and message are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    // Create a support ticket for the contact form submission
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: `CONTACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        userId: "anonymous", // We'll need to handle anonymous users differently
        title: `Contact Form: ${subject}`,
        description: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        category: category,
        priority: "MEDIUM",
        status: "OPEN",
      },
    });

    // In a real application, you would send an email notification here
    console.log(`Contact form submission from ${name} (${email}): ${subject}`);
    console.log(`Created support ticket: ${ticket.ticketNumber}`);

    return res.status(200).json({
      message:
        "Your message has been sent successfully. We'll get back to you soon!",
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

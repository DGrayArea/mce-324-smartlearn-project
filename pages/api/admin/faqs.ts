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

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (
    !user ||
    !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
      user.role || ""
    )
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    switch (req.method) {
      case "GET":
        return handleGet(req, res);
      case "POST":
        return handlePost(req, res, session.user.id);
      case "PUT":
        return handlePut(req, res, session.user.id);
      case "DELETE":
        return handleDelete(req, res, session.user.id);
      default:
        return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("FAQ management error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Get all FAQs
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { category, published } = req.query;

    const whereClause: any = {};

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (published && published !== "ALL") {
      whereClause.isPublished = published === "true";
    }

    const faqs = await prisma.fAQ.findMany({
      where: whereClause,
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    });

    // Group FAQs by category
    const faqsByCategory = faqs.reduce(
      (acc, faq) => {
        if (!acc[faq.category]) {
          acc[faq.category] = [];
        }
        acc[faq.category].push(faq);
        return acc;
      },
      {} as Record<string, any[]>
    );

    return res.status(200).json({
      faqs,
      faqsByCategory,
      totalCount: faqs.length,
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return res.status(500).json({
      message: "Failed to fetch FAQs",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Create new FAQ
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      question,
      answer,
      category,
      order = 0,
      isPublished = true,
      tags = [],
    } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({
        message: "Question, answer, and category are required",
      });
    }

    const newFAQ = await prisma.fAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        order,
        isPublished,
        tags,
      },
    });

    return res.status(201).json({
      message: "FAQ created successfully",
      faq: newFAQ,
    });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return res.status(500).json({
      message: "Failed to create FAQ",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Update FAQ
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { id } = req.query;
    const { question, answer, category, order, isPublished, tags } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "FAQ ID is required" });
    }

    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFAQ) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    const updateData: any = {};

    if (question !== undefined) updateData.question = question.trim();
    if (answer !== undefined) updateData.answer = answer.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (order !== undefined) updateData.order = order;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (tags !== undefined) updateData.tags = tags;

    const updatedFAQ = await prisma.fAQ.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      message: "FAQ updated successfully",
      faq: updatedFAQ,
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return res.status(500).json({
      message: "Failed to update FAQ",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

// Delete FAQ
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "FAQ ID is required" });
    }

    const existingFAQ = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFAQ) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    await prisma.fAQ.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return res.status(500).json({
      message: "Failed to delete FAQ",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

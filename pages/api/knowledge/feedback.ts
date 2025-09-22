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

  const { method } = req;

  switch (method) {
    case "POST":
      return handlePost(req, res, session.user.id);
    default:
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { articleId, helpful } = req.body;

    if (!articleId || helpful === undefined) {
      return res.status(400).json({
        message: "Article ID and helpful status are required",
      });
    }

    // Check if article exists
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Only allow feedback on published articles
    if (article.status !== "PUBLISHED") {
      return res
        .status(403)
        .json({ message: "Cannot provide feedback on unpublished articles" });
    }

    // Update article feedback counts
    const updateData = helpful
      ? { helpful: { increment: 1 } }
      : { notHelpful: { increment: 1 } };

    await prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: updateData,
    });

    return res.status(200).json({
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    console.error("Error recording article feedback:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

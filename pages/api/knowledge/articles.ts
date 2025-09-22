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
    case "GET":
      return handleGet(req, res, session.user.id);
    case "POST":
      return handlePost(req, res, session.user.id);
    case "PUT":
      return handlePut(req, res, session.user.id);
    case "DELETE":
      return handleDelete(req, res, session.user.id);
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      category,
      status,
      search,
      featured,
      limit = "20",
      offset = "0",
      articleId,
    } = req.query;

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If requesting a specific article
    if (articleId) {
      const article = await prisma.knowledgeArticle.findUnique({
        where: { id: articleId as string },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          relatedArticles: {
            include: {
              related: {
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      // Only show published articles to non-admin users
      if (user.role === "STUDENT" && article.status !== "PUBLISHED") {
        return res.status(403).json({ message: "Article not available" });
      }

      // Increment view count
      await prisma.knowledgeArticle.update({
        where: { id: articleId as string },
        data: { viewCount: { increment: 1 } },
      });

      return res.status(200).json({ article });
    }

    // Build where clause
    const where: any = {};

    // Status filter - only show published to students
    if (user.role === "STUDENT") {
      where.status = "PUBLISHED";
    } else if (status) {
      where.status = status;
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Featured filter
    if (featured === "true") {
      where.isFeatured = true;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { content: { contains: search as string, mode: "insensitive" } },
        { summary: { contains: search as string, mode: "insensitive" } },
        { tags: { has: search as string } },
      ];
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        _count: {
          select: {
            relatedArticles: true,
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { order: "asc" },
        { publishedAt: "desc" },
      ],
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.knowledgeArticle.count({ where });

    return res.status(200).json({
      articles,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + articles.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching knowledge articles:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { title, content, summary, category, tags, isFeatured, order } =
      req.body;

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only admins can create knowledge articles
    if (
      !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
        user.role || ""
      )
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (!title || !content || !category) {
      return res.status(400).json({
        message: "Title, content, and category are required",
      });
    }

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        content,
        summary,
        category,
        tags: tags || [],
        isFeatured: isFeatured || false,
        order: order || 0,
        authorId: userId,
        status: "DRAFT",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({ article });
  } catch (error) {
    console.error("Error creating knowledge article:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { articleId } = req.query;
    const {
      title,
      content,
      summary,
      category,
      tags,
      status,
      isFeatured,
      order,
    } = req.body;

    if (!articleId) {
      return res.status(400).json({ message: "Article ID is required" });
    }

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if article exists and user has permission
    const existingArticle = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId as string },
      select: { authorId: true },
    });

    if (!existingArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Only admins can edit articles
    if (
      !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
        user.role || ""
      )
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (order !== undefined) updateData.order = order;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "PUBLISHED") {
        updateData.publishedAt = new Date();
      }
    }

    const article = await prisma.knowledgeArticle.update({
      where: { id: articleId as string },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({ article });
  } catch (error) {
    console.error("Error updating knowledge article:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { articleId } = req.query;

    if (!articleId) {
      return res.status(400).json({ message: "Article ID is required" });
    }

    // Get user role for access control
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only admins can delete articles
    if (
      !["DEPARTMENT_ADMIN", "SCHOOL_ADMIN", "SENATE_ADMIN"].includes(
        user.role || ""
      )
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    // Check if article exists
    const existingArticle = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId as string },
    });

    if (!existingArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    await prisma.knowledgeArticle.delete({
      where: { id: articleId as string },
    });

    return res.status(200).json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting knowledge article:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

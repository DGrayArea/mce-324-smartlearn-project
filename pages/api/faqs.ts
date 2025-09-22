import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { category } = req.query;

    const whereClause: any = {
      isPublished: true, // Only show published FAQs
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    const faqs = await prisma.fAQ.findMany({
      where: whereClause,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
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

    // Get unique categories
    const categories = [...new Set(faqs.map((faq) => faq.category))].sort();

    return res.status(200).json({
      faqs,
      faqsByCategory,
      categories,
      totalCount: faqs.length,
    });
  } catch (error) {
    console.error("Error fetching public FAQs:", error);
    return res.status(500).json({
      message: "Failed to fetch FAQs",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
    });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (req.method === "POST") {
      // Vote on a communication
      const { communicationId, type } = req.body;

      if (!communicationId || !type || !["UPVOTE", "DOWNVOTE"].includes(type)) {
        return res.status(400).json({
          message:
            "Missing or invalid fields: communicationId, type (UPVOTE/DOWNVOTE)",
        });
      }

      // Check if user has already voted
      const existingVote = await prisma.communicationVote.findUnique({
        where: {
          communicationId_userId: {
            communicationId,
            userId: session.user.id,
          },
        },
      });

      if (existingVote) {
        if (existingVote.type === type) {
          // Remove vote if same type
          await prisma.communicationVote.delete({
            where: { id: existingVote.id },
          });
          return res.status(200).json({ message: "Vote removed" });
        } else {
          // Update vote if different type
          await prisma.communicationVote.update({
            where: { id: existingVote.id },
            data: { type: type as any },
          });
          return res.status(200).json({ message: "Vote updated" });
        }
      } else {
        // Create new vote
        await prisma.communicationVote.create({
          data: {
            communicationId,
            userId: session.user.id,
            type: type as any,
          },
        });
        return res.status(201).json({ message: "Vote created" });
      }
    }

    if (req.method === "DELETE") {
      // Remove vote
      const { communicationId } = req.query;

      if (!communicationId || typeof communicationId !== "string") {
        return res
          .status(400)
          .json({ message: "Communication ID is required" });
      }

      await prisma.communicationVote.deleteMany({
        where: {
          communicationId,
          userId: session.user.id,
        },
      });

      return res.status(200).json({ message: "Vote removed" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error: any) {
    console.error("Communication vote error:", error);
    return res.status(500).json({
      message: "Error processing vote",
      error: error?.message,
    });
  }
}

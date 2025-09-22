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
    if (req.method === "GET") {
      // Get current academic session info
      const currentSession = {
        academicYear: "2024/2025",
        currentSemester: "FIRST",
        sessionStartDate: "2024-09-01",
        sessionEndDate: "2025-08-31",
        firstSemesterStart: "2024-09-01",
        firstSemesterEnd: "2025-01-31",
        secondSemesterStart: "2025-02-01",
        secondSemesterEnd: "2025-08-31",
        isRegistrationOpen: true,
        registrationDeadline: "2024-10-15",
      };

      res.status(200).json({ session: currentSession });
    } else if (req.method === "POST") {
      // Start new academic session
      const {
        academicYear,
        sessionStartDate,
        sessionEndDate,
        firstSemesterStart,
        firstSemesterEnd,
        secondSemesterStart,
        secondSemesterEnd,
        registrationDeadline,
      } = req.body;

      if (!academicYear || !sessionStartDate || !sessionEndDate) {
        return res.status(400).json({
          message: "Academic year, session start and end dates are required",
        });
      }

      // In a real system, you would save this to a sessions table
      // For now, we'll just return success
      res.status(201).json({
        message: "New academic session created successfully",
        session: {
          academicYear,
          sessionStartDate,
          sessionEndDate,
          firstSemesterStart,
          firstSemesterEnd,
          secondSemesterStart,
          secondSemesterEnd,
          registrationDeadline,
        },
      });
    } else if (req.method === "PUT") {
      // Update current session settings
      const { currentSemester, isRegistrationOpen, registrationDeadline } =
        req.body;

      // In a real system, you would update the current session
      res.status(200).json({
        message: "Session settings updated successfully",
        updates: {
          currentSemester,
          isRegistrationOpen,
          registrationDeadline,
        },
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error: any) {
    console.error("Error in sessions API:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case "POST":
      return handleRequestReset(req, res);
    case "PUT":
      return handleResetPassword(req, res);
    case "GET":
      return handleVerifyToken(req, res);
    default:
      res.setHeader("Allow", ["POST", "PUT", "GET"]);
      return res.status(405).json({ message: `Method ${method} not allowed` });
  }
}

async function handleRequestReset(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Invalidate any existing reset tokens for this user
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Create new password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    // TODO: Send email with reset link
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);

    return res.status(200).json({
      message: "If the email exists, a password reset link has been sent.",
      // Remove this in production
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleResetPassword(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Find valid reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordReset) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    if (passwordReset.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Reset token has already been used" });
    }

    if (passwordReset.expiresAt < new Date()) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    // Hash new password (you should use bcrypt in production)
    const hashedPassword = crypto
      .createHash("sha256")
      .update(newPassword)
      .digest("hex");

    // Update user password
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    });

    // Mark reset token as used
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleVerifyToken(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Find reset token
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token: token as string },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!passwordReset) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    if (passwordReset.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Reset token has already been used" });
    }

    if (passwordReset.expiresAt < new Date()) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    return res.status(200).json({
      valid: true,
      user: {
        name: passwordReset.user.name,
        email: passwordReset.user.email,
      },
    });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

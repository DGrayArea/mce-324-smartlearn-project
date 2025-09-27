import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (session) {
      // User is authenticated, redirect to dashboard
      res.redirect(302, "/dashboard");
    } else {
      // User is not authenticated, redirect to login
      res.redirect(302, "/login");
    }
  } catch (error) {
    console.error("Auth callback error:", error);
    res.redirect(302, "/login");
  }
}

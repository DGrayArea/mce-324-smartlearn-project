import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    // Allow unauthenticated for demo; return limited info
  }

  try {
    const { question, issueType } = req.body as {
      question?: string;
      issueType?: string;
    };
    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    // Simple keyword search across Knowledge Articles and FAQs
    const query = question.trim();

    // 1) User-friendly responses by issue type
    const canned: Record<string, string> = {
      ACCOUNT: [
        "Account & Profile Help",
        "• To update your profile: Go to your dashboard and click on your profile settings",
        "• To change your password: Use the 'Change Password' option in your profile settings",
        "• If you forgot your password: Click 'Forgot Password' on the login page and follow the instructions",
        "• If you're locked out: Contact your Department Administrator for assistance",
        "• Your profile contains your personal information, academic details, and account preferences",
      ].join("\n"),
      COURSE_REG: [
        "Course Registration Guide",
        "• Navigate to the 'Courses' section in your dashboard",
        "• Browse available courses and select the ones you want to register for",
        "• You can register for up to 24 Credit Units (CU) per semester",
        "• After selecting courses, submit your registration for approval",
        "• Your registration status will be visible on the Courses page",
        "• You'll receive notifications about approval status and any required actions",
        "• If you need to make changes, contact your academic advisor before the deadline",
      ].join("\n"),
      CONTENT_DOWNLOAD: [
        "Downloading Course Materials",
        "• Go to the 'Content Library' or 'Materials' section in your dashboard",
        "• Browse through available course materials organized by course",
        "• Click on any material to download it to your device",
        "• Materials may include lecture notes, assignments, readings, and multimedia content",
        "• If you can't find a specific material, check with your lecturer or course coordinator",
        "• Ensure you have a stable internet connection for large file downloads",
      ].join("\n"),
      VIRTUAL_MEETING: [
        "Virtual Meetings & Classes",
        "• Check the 'Meetings' section in your dashboard for scheduled sessions",
        "• You'll receive notifications when new meetings are scheduled",
        "• Click on meeting links to join Zoom or Google Meet sessions",
        "• Make sure your camera and microphone are working before joining",
        "• Join meetings a few minutes early to test your connection",
        "• If you miss a meeting, check if recordings are available in the course materials",
      ].join("\n"),
      CHAT_QA: [
        "Course Communication & Q&A",
        "• Use the 'Course Communication' section to ask questions and participate in discussions",
        "• You can ask questions about course content, assignments, or general topics",
        "• Vote on helpful answers from other students and lecturers",
        "• Check for unread messages and respond to questions from your peers",
        "• Be respectful and constructive in your communications",
        "• Use this feature to collaborate with classmates and get help from instructors",
      ].join("\n"),
      GRADES_RESULTS: [
        "Grades & Results Information",
        "• View your grades in the 'Grade History' section of your dashboard",
        "• Grades go through an approval process: Department → School → Senate",
        "• You'll see your grades only after they're fully approved by the Senate",
        "• Check the status of your results in the grade history page",
        "• If you have concerns about a grade, contact your lecturer or academic advisor",
        "• Grade notifications will be sent to you when results are finalized",
      ].join("\n"),
      NOTIFICATIONS: [
        "Notifications & Alerts",
        "• All your notifications appear in the 'Notifications' section",
        "• You can mark individual notifications as read or mark all as read",
        "• Notification types include: grades, course registration updates, virtual class reminders, announcements, deadlines, and general reminders",
        "• Check your notifications regularly to stay updated on important information",
        "• You can filter notifications by type to find specific information quickly",
        "• Important notifications will be highlighted and require your attention",
      ].join("\n"),
      SUPPORT_TICKET: [
        "Support & Help Tickets",
        "• Go to the 'Support' section and click on the 'Tickets' tab",
        "• Create a new ticket to report issues or ask for help",
        "• Provide detailed information about your problem or question",
        "• Support staff will respond to your ticket and help resolve the issue",
        "• You can track the status of your tickets and view responses",
        "• Use this for technical problems, academic questions, or general assistance",
      ].join("\n"),
      TECHNICAL: [
        "Technical Support & Tips",
        "• Use a modern web browser (Chrome, Firefox, Safari, or Edge) for the best experience",
        "• If the interface looks unusual, try refreshing the page (Ctrl+F5 or Cmd+Shift+R)",
        "• Ensure your internet connection is stable for uploading files or joining meetings",
        "• Check that your browser allows pop-ups for meeting links and downloads",
        "• Clear your browser cache if you experience persistent issues",
        "• Contact technical support if problems continue after trying these steps",
      ].join("\n"),
      GENERAL: [
        "General Help & Resources",
        "• Explore the 'Knowledge Base' for detailed guides and tutorials",
        "• Download the User Manual for comprehensive platform information",
        "• Use the AI Assistant (this chat) for quick answers to common questions",
        "• Create a support ticket if you need personalized assistance",
        "• Check the FAQ section for answers to frequently asked questions",
        "• Contact your academic advisor for course-specific guidance",
      ].join("\n"),
      RESULT_APPROVAL: [
        "Result Approval Process (For Administrators)",
        "• Review pending results in the 'Result Approvals' section",
        "• Check student submissions and lecturer recommendations",
        "• Approve or request changes to submitted results",
        "• Results follow this approval chain: Department → School → Senate",
        "• Ensure all required documentation is complete before approval",
        "• Communicate with other administrators about approval decisions",
      ].join("\n"),
      CONTENT_UPLOAD: [
        "Content Upload Guide (For Lecturers)",
        "• Access the 'Content Library' section in your dashboard",
        "• Click 'Upload Content' to add new materials for your courses",
        "• Supported formats include PDF, Word documents, images, and videos",
        "• Organize content by course and add descriptions for students",
        "• Edit or delete content as needed throughout the semester",
        "• Monitor download statistics to see which materials are most accessed",
      ].join("\n"),
    };

    if (issueType && canned[issueType]) {
      const manualPath = "/User Manual Second draft.pdf";
      const answer = `${canned[issueType]}\n\n📖 Download the complete User Manual for detailed instructions: ${manualPath}`;
      return res.status(200).json({ answer, manual: manualPath });
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: query.split(/\s+/).filter(Boolean) } },
        ],
      },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        category: true,
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const faqs = await prisma.fAQ.findMany({
      where: {
        isPublished: true,
        OR: [
          { question: { contains: query, mode: "insensitive" } },
          { answer: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: query.split(/\s+/).filter(Boolean) } },
        ],
      },
      select: { id: true, question: true, answer: true, category: true },
      take: 3,
      orderBy: { updatedAt: "desc" },
    });

    // 2) Keyword-to-issueType mapping if user didn't choose one
    const keywordMap: { key: string; type: keyof typeof canned }[] = [
      { key: "register", type: "COURSE_REG" },
      { key: "course", type: "COURSE_REG" },
      { key: "enroll", type: "COURSE_REG" },
      { key: "download", type: "CONTENT_DOWNLOAD" },
      { key: "material", type: "CONTENT_DOWNLOAD" },
      { key: "content", type: "CONTENT_DOWNLOAD" },
      { key: "meeting", type: "VIRTUAL_MEETING" },
      { key: "zoom", type: "VIRTUAL_MEETING" },
      { key: "chat", type: "CHAT_QA" },
      { key: "q&a", type: "CHAT_QA" },
      { key: "question", type: "CHAT_QA" },
      { key: "grade", type: "GRADES_RESULTS" },
      { key: "result", type: "GRADES_RESULTS" },
      { key: "approval", type: "RESULT_APPROVAL" },
      { key: "notification", type: "NOTIFICATIONS" },
      { key: "ticket", type: "SUPPORT_TICKET" },
      { key: "support", type: "SUPPORT_TICKET" },
      { key: "password", type: "ACCOUNT" },
      { key: "profile", type: "ACCOUNT" },
      { key: "upload", type: "CONTENT_UPLOAD" },
      { key: "technical", type: "TECHNICAL" },
    ];

    let inferred: keyof typeof canned | undefined;
    if (!issueType) {
      const lower = query.toLowerCase();
      const hit = keywordMap.find((m) => lower.includes(m.key));
      if (hit) inferred = hit.type;
    }

    // 3) Compose a concise answer
    const lines: string[] = [];
    if (articles.length > 0) {
      lines.push("Here are some relevant Knowledge Base articles:");
      for (const a of articles) {
        const snippet = (a.summary || a.content || "").slice(0, 200);
        lines.push(
          `• ${a.title} — ${snippet}${snippet.length === 200 ? "…" : ""}`
        );
      }
    }
    if (faqs.length > 0) {
      lines.push(
        articles.length > 0 ? "\nRelated FAQs:" : "Here are some related FAQs:"
      );
      for (const f of faqs) {
        const snippet = (f.answer || "").slice(0, 200);
        lines.push(
          `• ${f.question} — ${snippet}${snippet.length === 200 ? "…" : ""}`
        );
      }
    }

    // Always offer the user manual link for broader help
    const manualPath = "/User Manual Second draft.pdf";
    lines.push(
      "\n📖 Download the complete User Manual for detailed instructions:"
    );
    lines.push(manualPath);

    let answer: string;
    if (issueType && canned[issueType]) {
      answer = `${canned[issueType]}\n\n📖 Download the complete User Manual for detailed instructions: ${manualPath}`;
    } else if (inferred && canned[inferred]) {
      answer = `${canned[inferred]}\n\n📖 Download the complete User Manual for detailed instructions: ${manualPath}`;
    } else if (articles.length === 0 && faqs.length === 0) {
      answer = [
        "Quick Start Guide",
        "• Courses: Navigate to the Courses section to register (up to 24 Credit Units) and submit for approval",
        "• Content: Download materials from the Content Library or Materials section",
        "• Meetings: Join virtual sessions from the Meetings page; you'll receive notification links",
        "• Chat/Q&A: Use Course Communication to ask questions and participate in discussions",
        "• Grades: View your results in Grade History after Senate approval",
        "• Notifications: Check and manage your alerts in the Notifications section",
        "• Help: Create a support ticket in the Support section for personalized assistance",
        `📖 Download the complete User Manual for detailed instructions: ${manualPath}`,
      ].join("\n");
    } else {
      answer = lines.join("\n");
    }

    return res.status(200).json({ answer, articles, faqs, manual: manualPath });
  } catch (error) {
    console.error("Assistant QA error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

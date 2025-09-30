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

    // 1) Canned responses by issue type (plug-and-play demo)
    // These reflect actual flows/routes implemented in the app
    const canned: Record<string, string> = {
      ACCOUNT: [
        "Account & Profile",
        "• Update profile: /dashboard/profile",
        "• Change password: /api/user/change-password (via Profile UI)",
        "• Forgot password: /api/auth/password-reset (Login → Forgot Password)",
        "If locked out, contact your Department Admin.",
      ].join("\n"),
      COURSE_REG: [
        "Course Registration",
        "• UI: /dashboard/courses",
        "• List available courses: GET /api/course/available",
        "• Save selections: POST /api/student/course-selection (≤ 24 CU)",
        "• Submit registration: POST /api/student/register",
        "• Department approval: POST /api/admin/course-registration-approval",
        "Status is visible in the Courses page cards and via notifications.",
      ].join("\n"),
      CONTENT_DOWNLOAD: [
        "Downloading Course Materials",
        "• Lecturers upload: /dashboard/content-library → POST /api/lecturer/content",
        "• Students access: /dashboard/content or course materials tabs",
        "• Download endpoints: /api/lecturer/content/download and /api/student/content/download (tracks downloadCount)",
        "We fetch as Blob to avoid Cloudinary redirect issues.",
      ].join("\n"),
      VIRTUAL_MEETING: [
        "Virtual Meetings",
        "• Create/schedule: /dashboard/virtual-meetings → POST /api/lecturer/meetings",
        "• Auto-notifies enrolled students (Notification type: VIRTUAL_CLASS)",
        "• Students join from /dashboard/meetings; links use Zoom/Meet.",
      ].join("\n"),
      CHAT_QA: [
        "Chat & Q&A",
        "• UI: /dashboard/course-communication",
        "• Messages: POST /api/course/communications (roles: student/lecturer/admin)",
        "• Votes: POST /api/course/communications/vote",
        "• Features: unread sorting, optimistic sending, typing indicator, read ticks.",
      ].join("\n"),
      GRADES_RESULTS: [
        "Grades & Results",
        "• Lecturer entry: POST /api/lecturer/results",
        "• Approval chain: Department → School → Senate",
        "• Admin UI: /dashboard/result-approvals (GET/POST /api/admin/result-approvals)",
        "• Student view: /dashboard/grade-history (GET /api/student/grade-history)",
      ].join("\n"),
      NOTIFICATIONS: [
        "Notifications",
        "• UI: /dashboard/notifications",
        "• Fetch: GET /api/notifications | Mark read: PATCH /api/notifications/[id]",
        "• Mark all read: POST /api/notifications/mark-all-read",
        "Types include: GRADE, COURSE_REGISTRATION, VIRTUAL_CLASS, ANNOUNCEMENT, DEADLINE, REMINDER.",
      ].join("\n"),
      SUPPORT_TICKET: [
        "Support Tickets",
        "• UI: /dashboard/support → Tickets tab",
        "• Create/list: POST/GET /api/support/tickets",
        "• Respond: POST /api/support/responses",
        "Use this for technical/academic assistance.",
      ].join("\n"),
      TECHNICAL: [
        "Technical Tips",
        "• Use a modern browser; hard-refresh Cmd/Ctrl+Shift+R if UI looks off",
        "• Ensure network allows Cloudinary/Zoom domains",
        "• Uploads: check file size/type; errors are logged to console and toasts",
      ].join("\n"),
      GENERAL: [
        "General Help",
        "• Knowledge Base: /dashboard/knowledge-base (Download User Manual button)",
        "• If blocked, open a ticket in /dashboard/support",
      ].join("\n"),
      RESULT_APPROVAL: [
        "Result Approval (Admins)",
        "• Review & act: /dashboard/result-approvals",
        "• Endpoint: GET/POST /api/admin/result-approvals",
        "Statuses: PENDING → DEPARTMENT_APPROVED → FACULTY_APPROVED → SENATE_APPROVED",
      ].join("\n"),
      CONTENT_UPLOAD: [
        "Content Upload (Lecturers)",
        "• UI: /dashboard/content-library",
        "• Upload: POST /api/lecturer/content (form-data to Cloudinary)",
        "• Edit/Delete: PUT/DELETE /api/lecturer/content",
        "• Download tracking via /api/*/content/download",
      ].join("\n"),
    };

    if (issueType && canned[issueType]) {
      const manualPath =
        "/" + encodeURIComponent("User Manual Second draft.pdf");
      const answer = `${canned[issueType]}\n\nUser Manual: ${manualPath}`;
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
    const manualPath = "/" + encodeURIComponent("User Manual Second draft.pdf");
    lines.push("\nYou can also download the full User Manual:");
    lines.push(manualPath);

    let answer: string;
    if (issueType && canned[issueType]) {
      answer = `${canned[issueType]}\n\nUser Manual: ${manualPath}`;
    } else if (inferred && canned[inferred]) {
      answer = `${canned[inferred]}\n\nUser Manual: ${manualPath}`;
    } else if (articles.length === 0 && faqs.length === 0) {
      answer = [
        "Quick Start",
        "• Courses: register (≤ 24 CU) and submit for approval",
        "• Content: download via Content Library/Materials",
        "• Meetings: join from Meetings; links sent via notifications",
        "• Chat/Q&A: use Course Communication",
        "• Grades: visible after Senate approval in Grade History",
        "• Notifications: filter/mark read in Notifications",
        "• Help: create a ticket in Support → Tickets",
        `User Manual: ${manualPath}`,
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

## Group Technical Contributions (Based on this repository)

Context: Class split into 10 groups (~12 members per group). Each group owns a functional module. Below maps the actual implementation in this codebase to the project brief and breaks work into 12 developer-sized contributions per group. For each contribution, we list representative libraries/packages and the exact engineering process so any member can claim and explain their work.

Core stack used across modules

- Next.js (pages router), TypeScript, React, SWR
- Auth: NextAuth.js (credentials, JWT, session), middleware
- Database: Prisma ORM, PostgreSQL
- UI: Tailwind CSS, shadcn/ui, lucide-react icons
- Storage: Cloudinary (lecturer documents)
- Export/Reporting: xlsx (Excel), CSV, JSON
- Utils: Zod-like manual validation, URLSearchParams, fetch

Repository highlights referenced below

- API routes under `pages/api/*`
- Dashboards under `pages/dashboard/*`
- GPA/CGPA and approvals in `lib/gpa-calculator.ts`, `pages/api/admin/result-approval.ts`
- Exports: `pages/api/lecturer/export-students.ts`, `pages/api/admin/export-students.ts`, `pages/api/admin/export-transcripts.ts`
- Course registration and availability: `pages/api/student/course-selection.ts`, `pages/api/course/available.ts`, `pages/dashboard/courses.tsx`
- Quizzes: `pages/api/lecturer/quizzes.ts`, `pages/api/student/quiz.ts`, `pages/dashboard/student/quiz/[quizId].tsx`
- Support tickets/FAQ: `pages/api/support/*`, `pages/api/faqs` and UI pages

---

### Group 1 — Student Information Management System

Responsibilities: Registration/login/logout, profile, role-based access, password reset, user data.

Member-sized contributions (12)

1. Implement NextAuth configuration and providers
   - Packages: `next-auth`, `bcrypt` (if used for hashing)
   - Files: `pages/api/auth/[...nextauth].ts`, `middleware.ts`
   - Process: session/JWT callbacks, role embedding, cookie options, CSRF-safe credential login.
2. Session-aware dashboard guard via middleware
   - Packages: `next/server`, NextAuth
   - Files: `middleware.ts`
   - Process: route matching, redirects to `/login`, role-based route gating.
3. User model wiring in Prisma and seeding
   - Packages: `@prisma/client`, `prisma`
   - Files: `prisma/schema.prisma`, seed endpoints (`/api/seed-*`)
   - Process: enums for `UserRole`, relations to Student/Lecturer/Admin, migrations.
4. Profile endpoint and UI
   - Files: `pages/api/user/profile.ts`, `pages/dashboard/profile.tsx`
   - Process: GET/PUT profile, optimistic UI with SWR, toast feedback.
5. Password reset flow (request + reset)
   - Files: `pages/api/auth/password-reset.ts`, `/auth/forgot-password`, `/auth/reset-password`
   - Process: token issuance, expiry checks, secure reset, form validation.
6. Login/Registration forms (shadcn/ui)
   - Files: `components/auth/LoginForm.tsx`, `RegisterForm.tsx`
   - Process: form state, error toasts, server error handling, redirect on success.
7. Role-based layout rendering
   - Files: `components/layout/DashboardLayout.tsx`, sidebar
   - Process: reading `session.user.role`, conditional nav items.
8. Audit login logs (optional)
   - Files: `prisma/schema.prisma` login logs table, `pages/api/analytics/logs.ts`
   - Process: append-on-login, basic activity views.
9. Email template placeholders (future integration)
   - Files: `pages/dashboard/email-notifications.tsx`
   - Process: UI skeleton with toasts and validations.
10. User activation/soft delete support

- Files: `User.isActive` in schema, respected in queries
- Process: filter inactive in admin exports and dashboards.

11. Access helpers for client

- Files: `lib/layoutWrappers.ts`, `contexts/AuthContext`
- Process: HOCs and contexts for auth state.

12. ESLint/TypeScript hardening

- Process: fix missing deps warnings, strict types on API handlers.

---

### Group 2 — Course Registration System

Responsibilities: Course listing by department/semester/level, student selection, credit limits, approval workflow.

Member-sized contributions (12)

1. Available courses API
   - Files: `pages/api/course/available.ts`
   - Process: filter by department, level, semester; admin availability flags.
2. Student course selection endpoint (batch, both semesters)
   - Files: `pages/api/student/course-selection.ts`
   - Process: checkbox selection, 24-credit validation per semester, transactional upserts.
3. Course registration submission for approval
   - Files: `pages/api/student/course-registration.ts`
   - Process: create registration record, status `PENDING` → admin review.
4. Merged courses UI with selection + progress + quick enroll
   - Files: `pages/dashboard/courses.tsx`
   - Process: multi-select checkboxes, progress bars, SWR keys refactor.
5. Distinguish available vs enrolled courses
   - Files: `pages/api/student/enrolled-courses.ts`, `courses.tsx`
   - Process: separate endpoints and UI sections.
6. Department admin course availability selection
   - Files: `pages/api/admin/department-course-selection.ts`, components under `components/dashboard/*`
   - Process: admin chooses 100–500L, semester, electives.
7. Credit limit enforcement (≤ 24 per semester)
   - Files: selection API, UI validations
   - Process: server-side guard + client warning toasts.
8. Batch approve/decline registration
   - Files: `pages/api/admin/course-registration-approval.ts`
   - Process: prisma transactions, status transitions.
9. Lecturer assignment syncing
   - Files: `pages/api/admin/lecturer-assignment.ts`
   - Process: ensure course ownerships reflected in lecturer views.
10. Session persistence for academic year/semester

- Files: `lib/swr.ts` keys, local state in pages
- Process: stable SWR keys, URLSearchParams.

11. Department code auto-binding (e.g., MCE 101 → MCE)

- Process: parsing `course.code` to map department if needed.

12. End-to-end tests (manual) through build success and flows

- Process: `pnpm build` verifications, error triage and fixes.

---

### Group 3 — LMS Content Management

Responsibilities: Upload/download of notes/videos/PPTs; access control; content tracking.

Member-sized contributions (12)

1. Cloudinary integration for lecturer documents
   - Files: `pages/api/lecturer/documents.ts`
   - Packages: `cloudinary`
   - Process: signed upload, metadata store in Prisma, delete handling.
2. Student materials access with download tracking
   - Files: `pages/api/student/documents.ts`, `pages/dashboard/student/materials/[courseId].tsx`
   - Process: only enrolled students can view/download; increment counters.
3. Lecturer materials UI (upload dialog)
   - Files: `pages/dashboard/lecturer/course/[courseId].tsx`
   - Process: file input, type selection, tags, toasts, SWR mutate.
4. Document listing and pagination (UI)
   - Process: card list with file sizes and actions.
5. MIME/type validation and size limits
   - Process: server-side checks, safe extensions.
6. Secure URLs
   - Process: return Cloudinary public URLs; no direct secrets exposed.
7. Course-content relations in Prisma (`contents`)
   - Files: `schema.prisma`
   - Process: correct relations; fixed earlier `materials` vs `contents` mismatch.
8. Access control via NextAuth session
   - Process: lecturer-only upload/delete; student-only access per enrollment.
9. Download statistics for lecturer dashboard
   - Files: `pages/api/lecturer/dashboard-overview.ts`
   - Process: aggregate counts per course/content.
10. UI polish with shadcn/ui

- Components: `Dialog`, `Card`, `Badge`, `Button`

11. Error handling and toasts

- Consistent feedback on success/failure.

12. Build stability and environment configuration docs

- `.env` variables for Cloudinary.

---

### Group 4 — Assessment and Result Computation

Responsibilities: CA/Exam/Total, grade mapping, GPA/CGPA, exports.

Member-sized contributions (12)

1. Lecturer grade entry and submission
   - Files: `pages/dashboard/lecturer/grades/[courseId].tsx`, `pages/api/lecturer/results.ts`
   - Process: CA/Exam inputs, total + grade calc, submit to dept admin.
2. Grading scale per FUT Minna brief (A–F ranges)
   - Files: `lib/gpa-calculator.ts`
   - Process: deterministic grade mapping and points.
3. GPA/CGPA computation library
   - Files: `lib/gpa-calculator.ts`
   - Process: per-course points, session and level GPAs, CGPA, standing.
4. Multi-level approvals (Dept → School → Senate)
   - Files: `pages/api/admin/result-approval.ts`, dashboard page
   - Process: status tags, modification allowed on rejection.
5. Visibility control for students (post-senate only)
   - Files: `pages/api/student/grades.ts`
   - Process: filter by approved statuses.
6. Result export for lecturers (students offering course)
   - Files: `pages/api/lecturer/export-students.ts`
   - Process: Excel/CSV, with/without grades.
7. Admin student export with CGPA
   - Files: `pages/api/admin/export-students.ts`
   - Process: includeGrades toggle, summary sheet, compression.
8. Transcript export (all sessions)
   - Files: `pages/api/admin/export-transcripts.ts`
   - Process: multi-sheet workbook (Summary, Detailed, Session GPAs, Metadata).
9. Result analytics summary
   - Files: `pages/dashboard/result-approval.tsx`
   - Process: filters, actions, export buttons.
10. Type-safety fixes for Prisma enums (LEVEL_100 etc.)

- Process: align TS types with Prisma enums in GPA lib.

11. Progression rules and academic standing

- Files: `lib/gpa-calculator.ts`
- Process: thresholds and graduation eligibility flags.

12. Robust error handling for export APIs

- Packages: `xlsx`, streams
- Process: CSV escaping, headers, file naming.

---

### Group 5 — Virtual Meetings and Chat Rooms

Responsibilities: Live chat sessions, messages, Q&A/threads.

Member-sized contributions (12)

1. Live chat sessions API
   - Files: `pages/api/live-chat/sessions.ts`
   - Process: create/join/close sessions, role rules.
2. Live chat messages API
   - Files: `pages/api/live-chat/messages.ts`
   - Process: post/list messages, simple pagination.
3. Chatrooms UI
   - Files: `pages/dashboard/chatrooms.tsx`
   - Process: list sessions, messages view, composer, attachments placeholder.
4. Student chat pages
   - Files: `pages/dashboard/student/chat.tsx`
   - Process: course-aware room filtering.
5. Meetings page scaffolding
   - Files: `pages/dashboard/meetings.tsx`
6. Q&A module stubs
   - Files: `pages/api/qa/questions.ts`, `answers.ts`, UI pages
7. Access policies
   - Process: who can create/enter rooms, auth checks.
8. Notifications hook-up (future)
   - Stubs in notifications API.
9. UI components (shadcn/ui)
10. Error toasts and loading states
11. Message formatting and time display
12. Build and lint passes for reliability

---

### Group 6 — System Integration and UI/UX Design

Responsibilities: Consistent frontend, navigation, standards, responsiveness.

Member-sized contributions (12)

1. Design system with shadcn/ui + Tailwind
2. Global styles and themes
   - Files: `styles/globals.css`, `tailwind.config.ts`
3. Dashboard layout and sidebar
   - Files: `components/layout/DashboardLayout.tsx`
4. Iconography with lucide-react
5. Form patterns (labels/inputs/toasts)
6. Data tables for admin pages
7. Progress and badges for statuses
8. Responsive grid layouts
9. Empty states and skeletons
10. Consistent toasts and error UX
11. Accessibility basics (labels, focus styles)
12. Performance: image sizes, bundle checks (`pnpm build`)

---

### Group 7 — Admin Dashboard and Analytics

Responsibilities: Admin can manage users, courses, content, and view stats.

Member-sized contributions (12)

1. Admin overview API & page
   - Files: `pages/api/dashboard/admin.ts`, `pages/dashboard/analytics.tsx`
2. User management API
   - Files: `pages/api/admin/users.ts`, `user-management.ts`
3. Department/School management
   - Files: `pages/api/admin/departments.ts`, `schools.ts`
4. Course management
   - Files: `pages/api/admin/courses.ts`
5. Lecturer assignment
   - Files: `pages/api/admin/lecturer-assignment.ts`
6. Sessions management
   - Files: `pages/api/admin/sessions.ts`
7. Analytics endpoints
   - Files: `pages/api/analytics/overview.ts`, `performance.ts`
8. Activity logs
   - Files: `pages/api/admin/user-activity.ts`, page UI
9. Filters and search components
10. CSV/XLSX export integration into admin UI
11. Access control on all admin APIs
12. Lint/type checks on admin modules

---

### Group 8 — Results Consideration and Approval

Responsibilities: Department → Faculty/School → Senate approvals with comments and hierarchy.

Member-sized contributions (12)

1. Result approval API with multi-stage statuses
   - Files: `pages/api/admin/result-approval.ts`
2. Review dialogs and decision logging
   - Files: `pages/dashboard/result-approval.tsx`
3. Tagging: approved by department/school/senate
4. Revisions when rejected at dept/school levels
5. Batch approve/decline actions
6. Visibility gates for students post-senate
7. Exports for evidence (students/transcripts)
8. Audit fields in Prisma (createdAt/updatedAt/status)
9. Transactional updates with Prisma
10. Error surfaces and toasts
11. Filters by academic year/semester/level/department
12. Build verification and types safety

---

### Group 9 — Feedback, Evaluation and Notification System

Responsibilities: Course evaluations, knowledge base, announcements/notifications.

Member-sized contributions (12)

1. Course evaluations API/UI
   - Files: `pages/api/evaluations/*`, `pages/dashboard/course-evaluations.tsx`
2. Knowledge base articles
   - Files: `pages/api/knowledge/*`, `pages/dashboard/knowledge-base.tsx`
3. FAQ system visible to all roles
   - Files: `pages/api/faqs.ts`, `pages/dashboard/faq.tsx`
4. Notifications API stubs (email, in-app)
   - Files: `pages/api/notifications/*`, `/email`
5. Feedback forms builder
6. Student feedback capture and analytics
7. Admin evaluation management UI
8. Tagging and search
9. Pagination and sorting
10. CSV/XLSX export of evaluation summaries (future)
11. Access control per role
12. Error handling and loading placeholders

---

### Group 10 — User Support and Help Center

Responsibilities: Support tickets, internal notes, replies, attachments, and student/agent access.

Member-sized contributions (12)

1. Support ticket creation and listing
   - Files: `pages/api/support/tickets.ts`, `pages/dashboard/support-tickets.tsx`
2. Ticket responses API
   - Files: `pages/api/support/responses.ts`
3. Name display logic using `user.name`
4. Student reply permissions and visibility
5. Internal notes (admin/agent)
6. Attachments field and validation (future)
7. Ticket number generation strategy
8. Filters: status, priority, assignee
9. Agent assignment relation in Prisma
10. UI: conversation thread, composer
11. Toasts and error surfaces
12. Build & lint passes for reliability

---

### How to use this document

- Each member picks one contribution in their group and prepares a Technical Developer Report:
  - Problem statement and acceptance criteria
  - Libraries/packages used (from lists above)
  - API routes, DB models, and React components touched
  - Step-by-step process (design → implementation → testing)
  - Screenshots or sample payloads where helpful
  - Risks, edge-cases handled, and future improvements

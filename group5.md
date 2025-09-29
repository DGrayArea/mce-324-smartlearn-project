## Group 5 — Virtual Meetings and Chat Rooms (Simplified Contributions)

Context: Keep it simple and clear. Focus on easy frontend pieces and helpful non‑coding work anyone can do. Pick one item, finish it well, and document what you did.

### Simple frontend component ideas

1. Chat message list

   - Show a vertical list of messages (name, time, text).
   - Use basic cards or plain divs; keep spacing consistent.
   - Files: `pages/dashboard/live-chat.tsx`, `pages/dashboard/student/chat.tsx`, `pages/api/live-chat/messages.ts`, `pages/api/student/chat-messages.ts`

2. Message input with send button

   - Single text box and a clear "Send" button.
   - Disable button when input is empty.
   - Files: `pages/dashboard/live-chat.tsx`, `pages/dashboard/student/chat.tsx`

3. Room card

   - A small card that shows room title, course, and status (Open/Closed).
   - Add a simple icon.
   - Files: `pages/dashboard/chatrooms.tsx`, `pages/api/student/chat-rooms.ts`

4. Join/Leave room buttons

   - Primary button to join, subtle button to leave.
   - Show a brief confirmation state.
   - Files: `pages/dashboard/chatrooms.tsx`, `pages/api/live-chat/sessions.ts`, `pages/api/student/chat-rooms.ts`

5. Participant list

   - Basic list with avatar initials and names.
   - Badge for "Lecturer" vs "Student".
   - Files: `pages/dashboard/live-chat.tsx`, `pages/dashboard/meetings.tsx`

6. Typing indicator

   - Tiny "Someone is typing…" text below the chat.
   - Only show when needed.
   - Files: `pages/dashboard/live-chat.tsx`

7. Timestamp formatter

   - Display friendly times like "2:45 PM" or "Yesterday".
   - Keep the format consistent across the app.
   - Files: `pages/dashboard/live-chat.tsx`

8. Empty state for new rooms

   - When there are no messages, show a friendly illustration or emoji and a short line like "No messages yet. Say hello!".
   - Files: `pages/dashboard/chatrooms.tsx`, `pages/dashboard/live-chat.tsx`

9. Loading spinner and skeletons

   - Simple spinner for page loads.
   - Skeleton blocks for message list while waiting.
   - Files: `pages/dashboard/live-chat.tsx`, `pages/dashboard/meetings.tsx`

10. Error and success toasts

- Short messages like "Message failed to send" or "Joined room".
- Avoid jargon.
- Files: `pages/dashboard/live-chat.tsx`, `pages/dashboard/meetings.tsx`, `hooks/use-toast` usage across pages

11. Basic chat page layout

- Two sections: left (rooms), right (current chat).
- Keep it responsive (stack on small screens).
- Files: `pages/dashboard/live-chat.tsx`, `pages/dashboard/student/chat.tsx`

12. Search/filter box for rooms

- Filter by room name or course code.
- Clear "X" to reset.
- Files: `pages/dashboard/chatrooms.tsx`

13. Emoji picker placeholder

- Small button that inserts a few common emojis.
- Keep it optional and light.
- Files: `pages/dashboard/live-chat.tsx`

14. Attachment button (disabled placeholder)

- Paperclip icon that shows "Attachments coming soon".
- Prevents confusion without building backend now.
- Files: `pages/dashboard/live-chat.tsx`

15. Read receipts (very simple)

- Show a small check mark for "Sent" and a double check for "Seen".
- Works visually even without realtime.
- Files: `pages/dashboard/live-chat.tsx`

16. Keyboard shortcuts (basic)

- Enter to send, Shift+Enter for new line.
- Show a tiny hint below the input.
- Files: `pages/dashboard/live-chat.tsx`

17. Accessibility checks

- Labels on inputs, button focus styles, good color contrast.
- Test with keyboard only.
- Files: `pages/dashboard/live-chat.tsx`, `pages/dashboard/meetings.tsx`

18. Light/dark friendly colors

- Choose a small, readable color palette that works in both themes.
- Files: global theme via `tailwind.config.js`, component examples in `pages/dashboard/live-chat.tsx`

### Helpful non‑coding contributions

19. Microcopy and tone guide

- Simple, friendly text for buttons, toasts, and empty states.
- One page with examples to keep wording consistent.
- Files: `README.md`, `Group contributions.md`, `group5.md`

20. Icon and color choices

- Pick a small icon set (chat, send, users) and 3–4 brand colors.
- Document hex codes and usage.
- Files: `README.md`, color tokens referenced in `tailwind.config.js`

21. UI screenshot gallery

- Take screenshots of each component and page state.
- Store in a folder with clear names.
- Files: add under `public/screenshots/` (create if missing)

22. Quick usability checklist

- 10 short checks (clarity of buttons, font size, contrast, spacing).
- Run before submitting work.
- Files: `README.md` (append), `TODO.md`

23. Short demo script

- 1–2 minute flow: open room → send message → see list.
- Helps anyone present the feature smoothly.
- Files: `README.md` (append), `group5.md`

24. Feedback form (1 page)

- Collect: What’s confusing? What’s slow? What’s missing?
- Link it from the chat page for testers.
- Files: add `/pages/feedback.tsx` (optional), or collect via `README.md` link

25. Basic performance checklist

- Avoid huge images; limit re-renders; keep lists simple.
- Note any slow spots.
- Files: `README.md`, notes inline in `pages/dashboard/live-chat.tsx`

26. Documentation mini‑README

- Where the components live, how to edit them, and how to test quickly.
- Include screenshots and the demo script link.
- Files: `group5.md` (this file), `README.md`

27. QA test notes

- Steps you took, what worked, what didn’t, with timestamps.
- Add screenshots of any bugs.
- Files: `TODO.md`, add `/docs/qa-notes.md` (optional)

28. Accessibility notes

- Record any keyboard traps or low‑contrast text you found.
- Suggest fixes in plain language.
- Files: add `/docs/a11y-notes.md` (optional); components: `pages/dashboard/live-chat.tsx`

29. Onboarding tip sheet for new members

- List the key files, how to run the app, and common commands.
- Keep it under one page.
- Files: `README.md`, `Group contributions.md`

30. Release checklist (short)

- Build passes, no console errors, basic flows tested, screenshots updated.
- Sign off with names and dates.
- Files: `README.md`, `TODO.md`

---

How to use this list

- Pick one item you can finish in a day.
- Keep it simple and consistent with the rest of the UI.
- Add a short note in the mini‑README explaining what you changed.

### Where to find related implementations in this repo

- Backend APIs and data

  - `prisma/schema.prisma` — models and enums (users, roles, registrations, enrollments)
  - `pages/api/user/profile.ts` — profile GET/PUT for all roles
  - `pages/api/user/change-password.ts` — change password
  - `pages/api/auth/password-reset.ts` — request/verify/reset password
  - `pages/api/student/courses.ts` — list courses per level/semester
  - `pages/api/student/register.ts` — submit course registration (PENDING)
  - `pages/api/admin/course-registrations.ts` — department admin approve/reject
  - `pages/api/admin/auto-register-and-grade.ts` — auto register and generate results
  - `pages/api/seed-seet-mce.ts` — SEET/MCE seed (schools, users, courses, history)
  - `pages/api/debug/courses.ts` — debug endpoint to inspect course sets

- Frontend pages and components

  - `pages/dashboard/courses.tsx` — student registration UI + admin review UI
  - `pages/dashboard/profile.tsx` — profile view
  - `pages/dashboard/settings.tsx` — profile edit and password change
  - `components/auth/LoginForm.tsx` — login, quick‑fill users, session spinner
  - `pages/login.tsx` — login page wrapper with loading guard

- Middleware / auth

  - `middleware.ts` — route protection and allow‑listed seed/admin routes

- Utilities
  - `lib/prisma.ts` — Prisma client
  - `proj.csv` — course data source (codes, titles, CUs)

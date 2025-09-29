## Group 5 — Virtual Meetings and Chat Rooms (Simplified Contributions)

Context: Keep it simple and clear. Focus on easy frontend pieces and helpful non‑coding work anyone can do. Pick one item, finish it well, and document what you did.

### Simple frontend component ideas

1. Chat message list

   - Show a vertical list of messages (name, time, text).
   - Use basic cards or plain divs; keep spacing consistent.

2. Message input with send button

   - Single text box and a clear "Send" button.
   - Disable button when input is empty.

3. Room card

   - A small card that shows room title, course, and status (Open/Closed).
   - Add a simple icon.

4. Join/Leave room buttons

   - Primary button to join, subtle button to leave.
   - Show a brief confirmation state.

5. Participant list

   - Basic list with avatar initials and names.
   - Badge for "Lecturer" vs "Student".

6. Typing indicator

   - Tiny "Someone is typing…" text below the chat.
   - Only show when needed.

7. Timestamp formatter

   - Display friendly times like "2:45 PM" or "Yesterday".
   - Keep the format consistent across the app.

8. Empty state for new rooms

   - When there are no messages, show a friendly illustration or emoji and a short line like "No messages yet. Say hello!".

9. Loading spinner and skeletons

   - Simple spinner for page loads.
   - Skeleton blocks for message list while waiting.

10. Error and success toasts

- Short messages like "Message failed to send" or "Joined room".
- Avoid jargon.

11. Basic chat page layout

- Two sections: left (rooms), right (current chat).
- Keep it responsive (stack on small screens).

12. Search/filter box for rooms

- Filter by room name or course code.
- Clear "X" to reset.

13. Emoji picker placeholder

- Small button that inserts a few common emojis.
- Keep it optional and light.

14. Attachment button (disabled placeholder)

- Paperclip icon that shows "Attachments coming soon".
- Prevents confusion without building backend now.

15. Read receipts (very simple)

- Show a small check mark for "Sent" and a double check for "Seen".
- Works visually even without realtime.

16. Keyboard shortcuts (basic)

- Enter to send, Shift+Enter for new line.
- Show a tiny hint below the input.

17. Accessibility checks

- Labels on inputs, button focus styles, good color contrast.
- Test with keyboard only.

18. Light/dark friendly colors

- Choose a small, readable color palette that works in both themes.

### Helpful non‑coding contributions

19. Microcopy and tone guide

- Simple, friendly text for buttons, toasts, and empty states.
- One page with examples to keep wording consistent.

20. Icon and color choices

- Pick a small icon set (chat, send, users) and 3–4 brand colors.
- Document hex codes and usage.

21. UI screenshot gallery

- Take screenshots of each component and page state.
- Store in a folder with clear names.

22. Quick usability checklist

- 10 short checks (clarity of buttons, font size, contrast, spacing).
- Run before submitting work.

23. Short demo script

- 1–2 minute flow: open room → send message → see list.
- Helps anyone present the feature smoothly.

24. Feedback form (1 page)

- Collect: What’s confusing? What’s slow? What’s missing?
- Link it from the chat page for testers.

25. Basic performance checklist

- Avoid huge images; limit re-renders; keep lists simple.
- Note any slow spots.

26. Documentation mini‑README

- Where the components live, how to edit them, and how to test quickly.
- Include screenshots and the demo script link.

27. QA test notes

- Steps you took, what worked, what didn’t, with timestamps.
- Add screenshots of any bugs.

28. Accessibility notes

- Record any keyboard traps or low‑contrast text you found.
- Suggest fixes in plain language.

29. Onboarding tip sheet for new members

- List the key files, how to run the app, and common commands.
- Keep it under one page.

30. Release checklist (short)

- Build passes, no console errors, basic flows tested, screenshots updated.
- Sign off with names and dates.

---

How to use this list

- Pick one item you can finish in a day.
- Keep it simple and consistent with the rest of the UI.
- Add a short note in the mini‑README explaining what you changed.

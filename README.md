# University Management Schema (Prisma + Next.js + Hooks)

This document describes the **database schema** used in our app.  
Each model lists its **fields**, **types**, and **relations** so developers know what to expect when fetching or setting data.

## 📌 Overview

This project defines a **university academic management system** using **Prisma (Postgres)**.  
It supports:

- Users with multiple roles (Student, Lecturer, DepartmentAdmin, FacultyAdmin, SenateAdmin).
- Faculties, Departments, Courses, Enrollments, Assessments, Results.
- Support system (tickets, responses).
- Communication (chat, messages, virtual classes).
- Analytics (SystemStats, FacultyStats, DepartmentStats).
- Announcements, Notifications, Course Evaluations.

## 🗂 UML (Simplified)

- User → Student, Lecturer, Admins
- Faculty → Department → Course
- Student ↔ Enrollment ↔ Course
- Enrollment ↔ Result
- Course → Assignment, Quiz, Content
- ChatRoom → Messages + Participants
- SupportTicket → SupportResponse

## ⚡ Using the Hook

### Generic Hook

We provide a reusable hook:

```ts
const { data, loading, error, create, update, remove } =
  useEntity<T>("endpoint");
```

# 📘 Data Models – Prisma + NextAuth

---

## 🔑 User

Base account model (used by NextAuth for authentication).

| Field           | Type           | Notes                      |
| --------------- | -------------- | -------------------------- |
| `id`            | String (UUID)  | PK                         |
| `name`          | String?        | Optional display name      |
| `email`         | String?        | Unique, used for login     |
| `emailVerified` | DateTime?      | Set when email is verified |
| `password`      | String?        | Hashed with bcrypt         |
| `image`         | String?        | Profile picture            |
| `role`          | Enum(UserRole) | Default: STUDENT           |
| `createdAt`     | DateTime       | Auto-set                   |
| `updatedAt`     | DateTime       | Auto-updated               |

**Relations:**

- Can be a **Student**, **Lecturer**, or one of the **Admin** roles.
- Linked to **Notifications** and **SupportTickets**.

---

## 🎓 Student

Represents student details.

| Field          | Type               | Notes                 |
| -------------- | ------------------ | --------------------- |
| `id`           | String             | PK, links to `User`   |
| `matricNumber` | String             | Unique student ID     |
| `level`        | Enum(StudentLevel) | LEVEL_100 → LEVEL_500 |
| `departmentId` | String?            | FK → Department       |
| `facultyId`    | String?            | FK → Faculty          |

**Relations:**

- Enrollments → Courses
- Results → Final grades
- Assignments & Quizzes submissions

---

## 👨‍🏫 Lecturer

Academic staff details.

| Field          | Type    | Notes               |
| -------------- | ------- | ------------------- |
| `id`           | String  | PK, links to `User` |
| `name`         | String  | Full name           |
| `departmentId` | String? | FK → Department     |
| `facultyId`    | String? | FK → Faculty        |

**Relations:**

- Can teach **Courses**
- Sets **Assignments** & **Quizzes**

---

## 🏫 Faculty

Top-level academic division.

| Field  | Type   | Notes                             |
| ------ | ------ | --------------------------------- |
| `id`   | String | PK                                |
| `name` | String | Example: "Faculty of Engineering" |

**Relations:**

- Departments
- FacultyAdmins

---

## 🏢 Department

Division inside a faculty.

| Field       | Type   | Notes                       |
| ----------- | ------ | --------------------------- |
| `id`        | String | PK                          |
| `name`      | String | Example: "Computer Science" |
| `facultyId` | String | FK → Faculty                |

**Relations:**

- Courses
- Students, Lecturers
- DepartmentAdmins

---

## 📚 Course

Course offered by a department.

| Field          | Type   | Notes                 |
| -------------- | ------ | --------------------- |
| `id`           | String | PK                    |
| `title`        | String | Example: "Algorithms" |
| `code`         | String | Example: "CSC201"     |
| `unit`         | Int    | Example: 3            |
| `departmentId` | String | FK → Department       |
| `facultyId`    | String | FK → Faculty          |

**Relations:**

- Enrollments (Students)
- Assignments, Quizzes
- Results

---

## 📝 Enrollment

Links a student to a course.

| Field       | Type           | Notes                |
| ----------- | -------------- | -------------------- |
| `id`        | String         | PK                   |
| `studentId` | String         | FK → Student         |
| `courseId`  | String         | FK → Course          |
| `semester`  | Enum(Semester) | FIRST, SECOND        |
| `session`   | String         | Example: "2024/2025" |

---

## 🧾 Result

Final grade for a student in a course.

| Field          | Type        | Notes           |
| -------------- | ----------- | --------------- |
| `id`           | String      | PK              |
| `enrollmentId` | String      | FK → Enrollment |
| `grade`        | Enum(Grade) | A–F             |
| `score`        | Int         | Numeric mark    |

---

## 📂 Assignment

Course assignments.

| Field        | Type     | Notes            |
| ------------ | -------- | ---------------- |
| `id`         | String   | PK               |
| `title`      | String   | Assignment title |
| `body`       | String   | Description      |
| `dueDate`    | DateTime | Deadline         |
| `courseId`   | String   | FK → Course      |
| `lecturerId` | String   | FK → Lecturer    |

---

## 📊 Quiz

Course quizzes/exams.

| Field        | Type   | Notes         |
| ------------ | ------ | ------------- |
| `id`         | String | PK            |
| `title`      | String | Quiz title    |
| `questions`  | JSON   | Question list |
| `courseId`   | String | FK → Course   |
| `lecturerId` | String | FK → Lecturer |

---

## 🖥 VirtualClass

Online classroom sessions.

| Field         | Type     | Notes           |
| ------------- | -------- | --------------- |
| `id`          | String   | PK              |
| `topic`       | String   | Topic covered   |
| `meetingLink` | String   | Video call link |
| `courseId`    | String   | FK → Course     |
| `startTime`   | DateTime | Scheduled start |
| `endTime`     | DateTime | Scheduled end   |

---

## 🧑‍💻 Chat

Course or system chat.

| Field       | Type     | Notes                |
| ----------- | -------- | -------------------- |
| `id`        | String   | PK                   |
| `courseId`  | String?  | Optional FK → Course |
| `senderId`  | String   | FK → User            |
| `message`   | String   | Chat content         |
| `createdAt` | DateTime | Auto-set             |

---

## 🛠 Admin Roles

Separate models for management.

### DepartmentAdmin

- Manages **Department**
- Linked to `User`

### FacultyAdmin

- Manages **Faculty**
- Linked to `User`

### SenateAdmin

- Manages whole university
- Linked to `User`

---

## 📢 Announcement

For system-wide or targeted messages.

| Field        | Type            | Notes                              |
| ------------ | --------------- | ---------------------------------- |
| `id`         | String          | PK                                 |
| `title`      | String          | Heading                            |
| `body`       | String          | Content                            |
| `targetRole` | Enum(UserRole)? | Limit to STUDENTS, LECTURERS, etc. |
| `createdAt`  | DateTime        | Auto-set                           |

---

## 🔔 Notification

Per-user system notifications.

| Field     | Type    | Notes          |
| --------- | ------- | -------------- |
| `id`      | String  | PK             |
| `userId`  | String  | FK → User      |
| `message` | String  | Text           |
| `read`    | Boolean | Default: false |

---

## 🆘 SupportTicket

User support requests.

| Field       | Type               | Notes                     |
| ----------- | ------------------ | ------------------------- |
| `id`        | String             | PK                        |
| `userId`    | String             | FK → User                 |
| `subject`   | String             | Ticket subject            |
| `body`      | String             | Issue description         |
| `status`    | Enum(TicketStatus) | OPEN, IN_PROGRESS, CLOSED |
| `createdAt` | DateTime           | Auto-set                  |

---

# 🚀 API Examples

### Fetch a student with department & faculty

```json
{
  "id": "abc123",
  "matricNumber": "CSC/2024/001",
  "level": "LEVEL_200",
  "department": { "id": "dep1", "name": "Computer Science" },
  "faculty": { "id": "fac1", "name": "Engineering" }
}
```

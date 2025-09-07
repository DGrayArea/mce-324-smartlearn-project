# SmartLearn University Management System

A comprehensive university management system built with **Next.js**, **Prisma**, **PostgreSQL**, and **NextAuth.js**. This system supports multiple user roles, course management, academic tracking, and administrative functions.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mce-324-smartlearn-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and NextAuth secret

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database
curl -X POST http://localhost:3000/api/seed-comprehensive

# Start development server
npm run dev
```

## 🔐 Authentication & User Roles

The system supports 5 user roles with different permissions:

- **STUDENT**: Can view courses, submit assignments, view grades
- **LECTURER**: Can manage courses, create assignments, grade students
- **DEPARTMENT_ADMIN**: Manages department-level operations
- **SCHOOL_ADMIN**: Manages school-level operations
- **SENATE_ADMIN**: System-wide administration

### Login Credentials (After Seeding)

**Students:**

- `student1@university.edu` / `password123`
- `student2@university.edu` / `password123`
- `student3@university.edu` / `password123`
- `student4@university.edu` / `password123`

**Lecturers:**

- `lecturer1@university.edu` / `password123`
- `lecturer2@university.edu` / `password123`
- `lecturer3@university.edu` / `password123`
- `lecturer4@university.edu` / `password123`

**Admins:**

- `senate.admin@university.edu` / `password123` (Senate Admin)
- `seet.admin@university.edu` / `password123` (School Admin)
- `cen.admin@university.edu` / `password123` (Department Admin)

## 🛣 API Routes

The system provides RESTful API endpoints organized by functionality:

### Authentication Routes

- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `GET /api/user/profile` - Get current user profile with role-specific data

### Dashboard Routes

- `GET /api/dashboard/student` - Student dashboard data (courses, grades, assignments)
- `GET /api/dashboard/lecturer` - Lecturer dashboard data (courses, students, reviews)
- `GET /api/dashboard/admin` - Admin dashboard data (system stats, users, courses)

### Seeding Routes

- `POST /api/seed-users` - Create basic test users
- `POST /api/seed-comprehensive` - Create complete academic system data

### Example API Usage

```javascript
// Fetch student dashboard data
const response = await fetch("/api/dashboard/student");
const data = await response.json();
console.log(data.stats); // { enrolledCourses: 4, currentGPA: "3.8", ... }

// Fetch user profile
const profile = await fetch("/api/user/profile");
const userData = await profile.json();
console.log(userData.role); // "student", "lecturer", etc.
```

## 🔧 Creating New API Routes

### 1. Basic Route Structure

Create a new file in `pages/api/` directory:

```typescript
// pages/api/example/route.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle different HTTP methods
  if (req.method === "GET") {
    return handleGet(req, res);
  } else if (req.method === "POST") {
    return handlePost(req, res);
  } else if (req.method === "PUT") {
    return handlePut(req, res);
  } else if (req.method === "DELETE") {
    return handleDelete(req, res);
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Your GET logic here
    const data = await prisma.example.findMany();
    res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
}
```

### 2. Authentication & Authorization

```typescript
// Check if user is authenticated
const session = await getServerSession(req, res, authOptions);
if (!session?.user?.id) {
  return res.status(401).json({ message: "Unauthorized" });
}

// Check user role for authorization
if (session.user.role !== "LECTURER" && session.user.role !== "ADMIN") {
  return res.status(403).json({ message: "Access denied" });
}
```

### 3. Using Prisma to Add Data

```typescript
// Create a new course
const course = await prisma.course.create({
  data: {
    title: "Advanced Programming",
    code: "CSC401",
    creditUnit: 4,
    description: "Advanced programming concepts",
    type: "DEPARTMENTAL",
    level: "LEVEL_400",
    semester: "FIRST",
    schoolId: "school_id_here",
    departmentId: "department_id_here",
  },
});

// Create a student with user relationship
const student = await prisma.user.create({
  data: {
    email: "newstudent@university.edu",
    password: await bcrypt.hash("password123", 12),
    role: "STUDENT",
    isActive: true,
    student: {
      create: {
        name: "John Doe",
        matricNumber: "CSC/2024/001",
        level: "LEVEL_100",
        departmentId: "department_id_here",
      },
    },
  },
});

// Create a notification
const notification = await prisma.notification.create({
  data: {
    studentId: "student_id_here",
    title: "New Assignment Posted",
    message: "A new assignment has been posted for your course.",
    type: "DEADLINE",
    isRead: false,
    metadata: {
      courseId: "course_id_here",
      assignmentId: "assignment_id_here",
    },
  },
});
```

### 4. Complex Queries with Relations

```typescript
// Fetch student with all related data
const student = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    student: {
      include: {
        department: {
          include: {
            school: true,
          },
        },
        enrollments: {
          include: {
            course: true,
          },
        },
        results: {
          include: {
            course: true,
          },
        },
      },
    },
  },
});

// Fetch courses with lecturer and department info
const courses = await prisma.course.findMany({
  include: {
    department: {
      include: {
        school: true,
      },
    },
    courseAssignments: {
      include: {
        lecturer: {
          include: {
            user: true,
          },
        },
      },
    },
  },
});
```

## 📊 Database Schema Overview

This project defines a **university academic management system** using **Prisma (Postgres)**.  
It supports:

- Users with multiple roles (Student, Lecturer, DepartmentAdmin, SchoolAdmin, SenateAdmin)
- Schools, Departments, Courses, Enrollments, Assessments, Results
- Support system (tickets, responses)
- Communication (chat, messages, virtual classes)
- Analytics (SystemStats, SchoolStats, DepartmentStats)
- Announcements, Notifications, Course Evaluations

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

## 🎯 Frontend Integration

### Using the Dashboard Data Hook

```typescript
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard = () => {
  const { data, loading, error } = useDashboardData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats">
        {Object.entries(data.stats).map(([key, value]) => (
          <div key={key}>
            <span>{key}: {value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Custom Hooks for Data Fetching

```typescript
// hooks/useEntity.ts - Generic entity management
const { data, loading, error, create, update, remove } =
  useEntity<Course>("/api/courses");

// Usage
const courses = data; // Array of courses
await create({ title: "New Course", code: "CSC101" });
await update(courseId, { title: "Updated Course" });
await remove(courseId);
```

## 🚀 API Examples

### Fetch a student with department & school

```json
{
  "id": "abc123",
  "matricNumber": "CSC/2024/001",
  "level": "LEVEL_200",
  "department": {
    "id": "dep1",
    "name": "Computer Engineering",
    "school": { "id": "school1", "name": "SEET" }
  }
}
```

### Dashboard Data Response

```json
{
  "stats": {
    "enrolledCourses": 4,
    "currentGPA": "3.8",
    "pendingAssignments": 2,
    "studyHours": "24h"
  },
  "recentActivity": [
    "Completed Introduction to Algorithms quiz",
    "Submitted assignment for Database Design"
  ],
  "notifications": [...],
  "courses": [...]
}
```

## 📝 Summary of Recent Changes

### 🔧 Authentication & Data Integration (Latest Updates)

#### 1. **Fixed Authentication System**

- **Problem**: Users could login but dashboard showed blank data
- **Solution**:
  - Updated `AuthContext.tsx` to fetch complete user profile data from database
  - Created `/api/user/profile` endpoint to provide role-specific user information
  - Fixed role mapping between NextAuth and frontend components

#### 2. **Database Seeding Improvements**

- **Fixed**: `seed-comprehensive.ts` script errors
  - Added missing `type` field for "Technical Writing" course
  - Fixed invalid notification types (`MEETING` → `REMINDER`, `ASSIGNMENT` → `DEADLINE`)
  - Corrected foreign key relationships for notifications
- **Result**: Successfully created complete academic system with 4 schools, 15 departments, users, courses, and notifications

#### 3. **Real-time Dashboard Data**

- **Created**: Role-specific dashboard API endpoints
  - `/api/dashboard/student` - Student statistics and course data
  - `/api/dashboard/lecturer` - Lecturer courses and student information
  - `/api/dashboard/admin` - System-wide or department-specific statistics
- **Created**: `useDashboardData` hook for frontend data fetching
- **Updated**: Dashboard components to use real database data instead of hardcoded values

#### 4. **Enhanced User Profile System**

- **Added**: Complete user profile fetching with role-specific data
- **Features**:
  - Student: matric number, department, level, enrollments
  - Lecturer: department, course assignments, virtual classes
  - Admin: school/department scope, management permissions

#### 5. **API Route Structure**

- **Organized**: API routes by functionality (auth, dashboard, seeding)
- **Added**: Comprehensive error handling and authentication checks
- **Implemented**: Role-based authorization for different endpoints

### 🗄 Database Schema Updates

#### Core Models Enhanced:

- **User**: Enhanced with role-specific profile relationships
- **Student**: Added department and school relationships
- **Lecturer**: Added course assignment and virtual class management
- **Course**: Enhanced with proper type and level classifications
- **Notification**: Fixed type enum and foreign key relationships

#### New Features:

- **Announcements**: System-wide and targeted messaging
- **Virtual Classes**: Online classroom management
- **Support System**: Ticket and response management
- **Analytics**: System, school, and department statistics

### 🎨 Frontend Improvements

#### Dashboard Components:

- **Real Data Integration**: Dashboard now displays actual database information
- **Role-based Views**: Different statistics and actions based on user role
- **Loading States**: Proper loading and error handling
- **Responsive Design**: Mobile-friendly dashboard layout

#### Authentication Flow:

- **Seamless Login**: NextAuth integration with database user profiles
- **Role Detection**: Automatic role-based redirects and permissions
- **Profile Management**: Complete user profile display with department/school info

### 🔐 Security & Performance

#### Authentication:

- **NextAuth.js**: Secure session management
- **Role-based Access**: Proper authorization for different user types
- **Password Hashing**: bcrypt for secure password storage

#### Database:

- **Prisma ORM**: Type-safe database operations
- **Foreign Key Constraints**: Proper data integrity
- **Optimized Queries**: Efficient data fetching with includes

### 🚀 Deployment Ready Features

#### Environment Setup:

- **Environment Variables**: Proper configuration management
- **Database Migrations**: Prisma schema synchronization
- **Seeding Scripts**: Automated test data creation

#### API Documentation:

- **Comprehensive README**: Complete setup and usage instructions
- **Code Examples**: Practical examples for common operations
- **Route Documentation**: Clear API endpoint descriptions

### 📊 Current System Status

✅ **Working Features:**

- User authentication with NextAuth.js
- Role-based dashboard with real data
- Complete academic system (schools, departments, courses)
- Student enrollment and course management
- Lecturer course assignments and virtual classes
- Admin system management and analytics
- Notifications and announcements
- Support ticket system

🔄 **In Progress:**

- Assignment submission and grading system
- Real-time chat and messaging
- Advanced analytics and reporting
- File upload and content management

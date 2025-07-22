// Centralized dummy data for all features across all roles

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  semester: string;
  credits: number;
  students?: number;
  description: string;
  schedule: string;
  progress?: number;
  status: 'active' | 'completed' | 'pending';
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  grade?: number;
  maxGrade: number;
  description: string;
  submissionDate?: string;
}

export interface Meeting {
  id: string;
  title: string;
  course: string;
  date: string;
  time: string;
  duration: string;
  type: 'lecture' | 'tutorial' | 'exam' | 'meeting';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendees?: number;
  maxAttendees?: number;
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  department: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
}

export interface Grade {
  id: string;
  student: string;
  course: string;
  assignment: string;
  grade: number;
  maxGrade: number;
  submissionDate: string;
  gradedDate?: string;
  feedback?: string;
}

export interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'message' | 'announcement' | 'forum';
}

// Student dummy data
export const studentCourses: Course[] = [
  {
    id: '1',
    name: 'Introduction to Computer Science',
    code: 'CS101',
    instructor: 'Dr. Robert Smith',
    semester: 'Fall 2024',
    credits: 3,
    description: 'Fundamental concepts of computer science and programming.',
    schedule: 'Mon, Wed, Fri 10:00-11:00 AM',
    progress: 78,
    status: 'active'
  },
  {
    id: '2',
    name: 'Data Structures and Algorithms',
    code: 'CS201',
    instructor: 'Dr. Emily Johnson',
    semester: 'Fall 2024',
    credits: 4,
    description: 'Study of efficient data organization and algorithmic problem solving.',
    schedule: 'Tue, Thu 2:00-3:30 PM',
    progress: 65,
    status: 'active'
  },
  {
    id: '3',
    name: 'Database Design',
    code: 'CS301',
    instructor: 'Dr. Michael Brown',
    semester: 'Fall 2024',
    credits: 3,
    description: 'Principles of database design and implementation.',
    schedule: 'Mon, Wed 1:00-2:00 PM',
    progress: 82,
    status: 'active'
  },
  {
    id: '4',
    name: 'Web Development',
    code: 'CS302',
    instructor: 'Dr. Sarah Wilson',
    semester: 'Fall 2024',
    credits: 3,
    description: 'Modern web development technologies and frameworks.',
    schedule: 'Tue, Thu 10:00-11:30 AM',
    progress: 90,
    status: 'active'
  }
];

export const studentAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Binary Search Implementation',
    course: 'CS201',
    dueDate: '2024-02-15',
    status: 'pending',
    maxGrade: 100,
    description: 'Implement binary search algorithm in Python with time complexity analysis.'
  },
  {
    id: '2',
    title: 'Database Schema Design',
    course: 'CS301',
    dueDate: '2024-02-20',
    status: 'submitted',
    grade: 85,
    maxGrade: 100,
    description: 'Design a normalized database schema for an e-commerce system.',
    submissionDate: '2024-02-18'
  },
  {
    id: '3',
    title: 'React Calculator App',
    course: 'CS302',
    dueDate: '2024-02-10',
    status: 'graded',
    grade: 92,
    maxGrade: 100,
    description: 'Build a functional calculator using React and modern JavaScript.',
    submissionDate: '2024-02-08'
  }
];

// Lecturer dummy data
export const lecturerCourses: Course[] = [
  {
    id: '1',
    name: 'Advanced Database Systems',
    code: 'CS401',
    instructor: 'Current User',
    semester: 'Fall 2024',
    credits: 4,
    students: 45,
    description: 'Advanced topics in database systems including NoSQL and distributed databases.',
    schedule: 'Mon, Wed, Fri 9:00-10:00 AM',
    status: 'active'
  },
  {
    id: '2',
    name: 'Software Engineering',
    code: 'CS350',
    instructor: 'Current User',
    semester: 'Fall 2024',
    credits: 3,
    students: 38,
    description: 'Software development methodologies and project management.',
    schedule: 'Tue, Thu 11:00-12:30 PM',
    status: 'active'
  },
  {
    id: '3',
    name: 'Machine Learning Fundamentals',
    code: 'CS420',
    instructor: 'Current User',
    semester: 'Fall 2024',
    credits: 4,
    students: 52,
    description: 'Introduction to machine learning algorithms and applications.',
    schedule: 'Mon, Wed 2:00-3:30 PM',
    status: 'active'
  }
];

export const lecturerAssignments: Assignment[] = [
  {
    id: '1',
    title: 'NoSQL Database Project',
    course: 'CS401',
    dueDate: '2024-02-25',
    status: 'pending',
    maxGrade: 100,
    description: 'Design and implement a MongoDB-based application.'
  },
  {
    id: '2',
    title: 'Agile Development Report',
    course: 'CS350',
    dueDate: '2024-02-18',
    status: 'graded',
    maxGrade: 100,
    description: 'Analyze agile methodologies and present findings.'
  },
  {
    id: '3',
    title: 'Linear Regression Analysis',
    course: 'CS420',
    dueDate: '2024-02-22',
    status: 'submitted',
    maxGrade: 100,
    description: 'Implement and analyze linear regression models.'
  }
];

// Admin dummy data
export const allCourses: Course[] = [
  ...studentCourses,
  ...lecturerCourses,
  {
    id: '5',
    name: 'Computer Networks',
    code: 'CS310',
    instructor: 'Dr. James Davis',
    semester: 'Fall 2024',
    credits: 3,
    students: 42,
    description: 'Network protocols and distributed systems.',
    schedule: 'Tue, Thu 9:00-10:30 AM',
    status: 'active'
  }
];

export const allUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@university.edu',
    role: 'student',
    department: 'Computer Science',
    status: 'active',
    lastLogin: '2024-01-20 14:30'
  },
  {
    id: '2',
    name: 'Dr. Robert Smith',
    email: 'robert@university.edu',
    role: 'lecturer',
    department: 'Computer Science',
    status: 'active',
    lastLogin: '2024-01-20 09:15'
  },
  {
    id: '3',
    name: 'Sarah Wilson',
    email: 'sarah@university.edu',
    role: 'admin',
    department: 'Administration',
    status: 'active',
    lastLogin: '2024-01-20 16:45'
  }
];

export const meetings: Meeting[] = [
  {
    id: '1',
    title: 'CS101 Introduction Lecture',
    course: 'CS101',
    date: '2024-01-22',
    time: '10:00',
    duration: '1h',
    type: 'lecture',
    status: 'scheduled',
    attendees: 35,
    maxAttendees: 50,
    link: 'https://zoom.us/j/123456789'
  },
  {
    id: '2',
    title: 'Database Design Workshop',
    course: 'CS301',
    date: '2024-01-23',
    time: '14:00',
    duration: '2h',
    type: 'tutorial',
    status: 'scheduled',
    attendees: 28,
    maxAttendees: 30
  },
  {
    id: '3',
    title: 'Midterm Exam Review',
    course: 'CS201',
    date: '2024-01-24',
    time: '16:00',
    duration: '1.5h',
    type: 'exam',
    status: 'scheduled',
    attendees: 42,
    maxAttendees: 45
  }
];

export const messages: Message[] = [
  {
    id: '1',
    sender: 'Dr. Robert Smith',
    recipient: 'Current User',
    subject: 'Assignment Extension Request',
    content: 'I wanted to discuss a possible extension for the upcoming assignment due to recent circumstances.',
    timestamp: '2024-01-20 10:30',
    read: false,
    type: 'message'
  },
  {
    id: '2',
    sender: 'System',
    recipient: 'All Students',
    subject: 'Semester Registration Reminder',
    content: 'Don\'t forget to register for next semester\'s courses. Deadline is approaching!',
    timestamp: '2024-01-19 15:00',
    read: true,
    type: 'announcement'
  },
  {
    id: '3',
    sender: 'Alice Johnson',
    recipient: 'CS201 Forum',
    subject: 'Question about Binary Trees',
    content: 'Can someone explain the difference between BST and AVL trees?',
    timestamp: '2024-01-18 13:20',
    read: true,
    type: 'forum'
  }
];

export const grades: Grade[] = [
  {
    id: '1',
    student: 'Alice Johnson',
    course: 'CS101',
    assignment: 'Programming Basics Quiz',
    grade: 88,
    maxGrade: 100,
    submissionDate: '2024-01-15',
    gradedDate: '2024-01-17',
    feedback: 'Good understanding of concepts. Minor syntax errors.'
  },
  {
    id: '2',
    student: 'Alice Johnson',
    course: 'CS201',
    assignment: 'Data Structures Project',
    grade: 92,
    maxGrade: 100,
    submissionDate: '2024-01-10',
    gradedDate: '2024-01-12',
    feedback: 'Excellent implementation and documentation.'
  }
];
import useSWR, { mutate } from "swr";
import { fetcher, swrKeys, getErrorMessage } from "@/lib/swr";

// Dashboard data hooks
export const useDashboardData = (role: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    role ? swrKeys.dashboard(role) : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Course hooks
export const useCourses = (role: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    role ? swrKeys.courses(role) : null,
    fetcher
  );

  return {
    courses: data?.courses || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useCourseSelection = (academicYear: string, semester: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    academicYear && semester
      ? swrKeys.courseSelection(academicYear, semester)
      : null,
    fetcher
  );

  return {
    requiredCourses: data?.requiredCourses || [],
    electiveCourses: data?.electiveCourses || [],
    carryOverCourses: data?.carryOverCourses || [],
    selectedCourseIds: data?.selectedCourseIds || [],
    existingRegistration: data?.existingRegistration,
    currentCredits: data?.currentCredits || 0,
    remainingCredits: data?.remainingCredits || 24,
    registrationStatus: data?.registrationStatus || "NOT_STARTED",
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Student hooks
export const useStudentGrades = (academicYear: string, semester?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    academicYear ? swrKeys.studentGrades(academicYear, semester) : null,
    fetcher
  );

  return {
    grades: data?.grades || [],
    cgpa: data?.cgpa || 0,
    gpa: data?.gpa || 0,
    statistics: data?.statistics || null,
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useStudentQuizzes = (courseId?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.studentQuizzes(courseId),
    fetcher
  );

  return {
    quizzes: data?.quizzes || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useStudentMaterials = (courseId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    courseId ? swrKeys.studentMaterials(courseId) : null,
    fetcher
  );

  return {
    course: data?.course || null,
    materials: data?.materials || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useStudentMeetings = (academicYear: string, semester: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    academicYear && semester
      ? swrKeys.studentMeetings(academicYear, semester)
      : null,
    fetcher
  );

  return {
    meetings: data?.meetings || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Lecturer hooks
export const useLecturerCourses = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.lecturerCourses(),
    fetcher
  );

  return {
    courses: data?.courses || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useLecturerStudents = (courseId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    courseId ? swrKeys.lecturerStudents(courseId) : null,
    fetcher
  );

  return {
    students: data?.students || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useLecturerDocuments = (courseId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    courseId ? swrKeys.lecturerDocuments(courseId) : null,
    fetcher
  );

  return {
    documents: data?.documents || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useLecturerQuizzes = (courseId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    courseId ? swrKeys.lecturerQuizzes(courseId) : null,
    fetcher
  );

  return {
    quizzes: data?.quizzes || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useLecturerResults = (
  courseId: string,
  academicYear: string,
  semester: string
) => {
  const { data, error, isLoading, mutate } = useSWR(
    courseId && academicYear && semester
      ? swrKeys.lecturerResults(courseId, academicYear, semester)
      : null,
    fetcher
  );

  return {
    results: data?.results || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Admin hooks
export const useAdminUsers = (filters: {
  role?: string;
  school?: string;
  department?: string;
  search?: string;
}) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.adminUsers(
      filters.role,
      filters.school,
      filters.department,
      filters.search
    ),
    fetcher
  );

  return {
    users: data?.users || [],
    totalCount: data?.totalCount || 0,
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useAdminSchools = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.adminSchools(),
    fetcher
  );

  return {
    schools: data?.schools || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useAdminDepartments = (schoolId?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.adminDepartments(schoolId),
    fetcher
  );

  return {
    departments: data?.departments || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useAdminCourses = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.adminCourses(),
    fetcher
  );

  return {
    courses: data?.courses || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useAdminCourseRegistrations = (
  academicYear: string,
  semester: string,
  status?: string
) => {
  const { data, error, isLoading, mutate } = useSWR(
    academicYear && semester
      ? swrKeys.adminCourseRegistrations(academicYear, semester, status)
      : null,
    fetcher
  );

  return {
    registrations: data?.registrations || [],
    statistics: data?.statistics || null,
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useAdminUserActivity = (filters: Record<string, any>) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.adminUserActivity(filters),
    fetcher
  );

  return {
    logs: data?.logs || [],
    stats: data?.stats || [],
    userActivitySummary: data?.userActivitySummary || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useAdminFAQs = (category?: string, published?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.adminFAQs(category, published),
    fetcher
  );

  return {
    faqs: data?.faqs || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Department course selection hooks
export const useDepartmentCourseSelection = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.departmentCourseSelection(),
    fetcher
  );

  return {
    allCourses: data?.allCourses || [],
    selectedCourses: data?.selectedCourses || [],
    department: data?.department || null,
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useLecturerAssignment = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.lecturerAssignment(),
    fetcher
  );

  return {
    lecturers: data?.lecturers || [],
    courseAssignments: data?.courseAssignments || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Analytics hooks
export const useAnalytics = (timeRange: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    timeRange ? swrKeys.analytics(timeRange) : null,
    fetcher
  );

  return {
    analytics: data?.analytics || null,
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const usePerformanceMetrics = (timeRange: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    timeRange ? swrKeys.performanceMetrics(timeRange) : null,
    fetcher
  );

  return {
    metrics: data || null,
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Support hooks
export const useSupportTickets = (filters: Record<string, any>) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.supportTickets(filters),
    fetcher
  );

  return {
    tickets: data?.tickets || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useSupportResponses = (ticketId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    ticketId ? swrKeys.supportResponses(ticketId) : null,
    fetcher
  );

  return {
    responses: data?.responses || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Knowledge base hooks
export const useKnowledgeArticles = (filters: Record<string, any>) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.knowledgeArticles(filters),
    fetcher
  );

  return {
    articles: data?.articles || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// FAQ hooks
export const useFAQs = (category?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.faqs(category),
    fetcher
  );

  return {
    faqs: data?.faqs || [],
    faqsByCategory: data?.faqsByCategory || {},
    categories: data?.categories || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Notification hooks
export const useNotifications = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.notifications(),
    fetcher
  );

  return {
    notifications: data?.notifications || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Chat hooks
export const useChatRooms = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.chatRooms(),
    fetcher
  );

  return {
    chatRooms: data?.chatRooms || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useChatMessages = (roomId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    roomId ? swrKeys.chatMessages(roomId) : null,
    fetcher
  );

  return {
    messages: data?.messages || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Live chat hooks
export const useLiveChatSessions = () => {
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.liveChatSessions(),
    fetcher
  );

  return {
    sessions: data?.sessions || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

export const useLiveChatMessages = (sessionId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    sessionId ? swrKeys.liveChatMessages(sessionId) : null,
    fetcher
  );

  return {
    messages: data?.messages || [],
    error,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
    mutate,
  };
};

// Utility function to revalidate multiple SWR keys
export const revalidateKeys = (keys: string[]) => {
  keys.forEach((key) => mutate(key));
};

// Utility function to revalidate all course-related data
export const revalidateCourseData = () => {
  revalidateKeys([
    "/api/admin/courses",
    "/api/admin/department-course-selection",
    "/api/admin/lecturer-assignment",
    "/api/lecturer/courses",
    "/api/student/course-selection",
  ]);
};

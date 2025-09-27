import useSWR, { SWRConfiguration } from "swr";

// Centralized SWR configuration
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  refreshInterval: 0, // Disable automatic refresh by default
  shouldRetryOnError: (error) => {
    // Don't retry on 4xx errors (client errors)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    return true;
  },
};

// Generic fetcher function
export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object
    (error as any).status = response.status;
    (error as any).info = await response.json().catch(() => ({}));
    throw error;
  }

  return response.json();
};

// Fetcher with query parameters
export const fetcherWithParams =
  (baseUrl: string) => async (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });

    const url = `${baseUrl}?${searchParams.toString()}`;
    return fetcher(url);
  };

// SWR key generators
export const swrKeys = {
  // Dashboard data
  dashboard: (role: string) => {
    // Normalize role to lowercase for API consistency
    const normalizedRole = role.toLowerCase();
    return `/api/dashboard/${normalizedRole}`;
  },

  // Courses
  courses: (role: string) => {
    // For students, use the available courses endpoint
    if (role === "STUDENT") {
      return `/api/course/available`;
    }
    return `/api/${role}/courses`;
  },
  course: (id: string) => `/api/courses/${id}`,
  courseSelection: (academicYear: string, semester: string) =>
    `/api/student/course-selection?academicYear=${academicYear}&semester=${semester}`,

  // Students
  studentGrades: (academicYear: string, semester?: string) => {
    const params = new URLSearchParams({ academicYear });
    if (semester && semester !== "ALL") params.append("semester", semester);
    return `/api/student/grades?${params}`;
  },
  studentQuizzes: (courseId?: string) => {
    const params = courseId ? `?courseId=${courseId}` : "";
    return `/api/student/quizzes${params}`;
  },
  studentMaterials: (courseId: string) => `/api/student/materials/${courseId}`,
  studentMeetings: (academicYear: string, semester: string) =>
    `/api/student/meetings?academicYear=${academicYear}&semester=${semester}`,
  enrolledCourses: () => `/api/student/enrolled-courses`,

  // Lecturer
  lecturerCourses: () => `/api/lecturer/courses`,
  lecturerStudents: (courseId: string) =>
    `/api/lecturer/students?courseId=${courseId}`,
  lecturerDocuments: (courseId: string) =>
    `/api/lecturer/documents?courseId=${courseId}`,
  lecturerQuizzes: (courseId: string) =>
    `/api/lecturer/quizzes?courseId=${courseId}`,
  lecturerResults: (courseId: string, academicYear: string, semester: string) =>
    `/api/lecturer/results?courseId=${courseId}&academicYear=${academicYear}&semester=${semester}`,

  // Admin
  adminUsers: (
    role?: string,
    school?: string,
    department?: string,
    search?: string
  ) => {
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    if (school) params.append("school", school);
    if (department) params.append("department", department);
    if (search) params.append("search", search);
    return `/api/admin/users?${params}`;
  },
  adminSchools: () => `/api/admin/schools`,
  adminDepartments: (schoolId?: string) => {
    const params = schoolId ? `?schoolId=${schoolId}` : "";
    return `/api/admin/departments${params}`;
  },
  adminCourses: () => `/api/admin/courses`,
  adminCourseRegistrations: (
    academicYear: string,
    semester: string,
    status?: string
  ) => {
    const params = new URLSearchParams({ academicYear, semester });
    if (status && status !== "ALL") params.append("status", status);
    return `/api/admin/course-registrations?${params}`;
  },
  adminUserActivity: (filters: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    return `/api/admin/user-activity?${params}`;
  },
  adminFAQs: (category?: string, published?: string) => {
    const params = new URLSearchParams();
    if (category && category !== "ALL") params.append("category", category);
    if (published && published !== "ALL") params.append("published", published);
    return `/api/admin/faqs?${params}`;
  },

  // Department course selection
  departmentCourseSelection: () => `/api/admin/department-course-selection`,
  lecturerAssignment: () => `/api/admin/lecturer-assignment`,

  // Analytics
  analytics: (timeRange: string) =>
    `/api/analytics/overview?timeRange=${timeRange}`,
  performanceMetrics: (timeRange: string) =>
    `/api/analytics/performance?timeRange=${timeRange}`,

  // Support
  supportTickets: (filters: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    return `/api/support/tickets?${params}`;
  },
  supportResponses: (ticketId: string) =>
    `/api/support/responses?ticketId=${ticketId}`,

  // Knowledge base
  knowledgeArticles: (filters: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
    return `/api/knowledge/articles?${params}`;
  },

  // FAQs
  faqs: (category?: string) => {
    const params =
      category && category !== "ALL" ? `?category=${category}` : "";
    return `/api/faqs${params}`;
  },

  // Notifications
  notifications: () => `/api/notifications`,

  // Chat
  chatRooms: () => `/api/student/chat-rooms`,
  chatMessages: (roomId: string) =>
    `/api/student/chat-messages?roomId=${roomId}`,

  // Live chat
  liveChatSessions: () => `/api/live-chat/sessions`,
  liveChatMessages: (sessionId: string) =>
    `/api/live-chat/messages?sessionId=${sessionId}`,
};

// Custom hooks for common patterns
export const useSWRWithParams = <T>(
  key: string | null,
  params: Record<string, any>,
  options?: SWRConfiguration
) => {
  const swrKey = key ? [key, params] : null;
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    ([url, params]: [string, Record<string, any>]) =>
      fetcherWithParams(url)(params),
    { ...swrConfig, ...options }
  );

  return {
    data: data as T,
    error,
    isLoading,
    mutate,
  };
};

// Error handling utilities
export const getErrorMessage = (error: any): string => {
  if (error?.info?.message) {
    return error.info.message;
  }
  if (error?.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export const isClientError = (error: any): boolean => {
  return error?.status >= 400 && error?.status < 500;
};

export const isServerError = (error: any): boolean => {
  return error?.status >= 500;
};

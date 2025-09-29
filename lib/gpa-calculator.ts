/**
 * Advanced GPA Calculator with Session-based Progression
 * Handles GPA calculation based on academic sessions and course levels
 */

import { GRADE_SCALE } from "./grading";

export interface CourseResult {
  id: string;
  grade: string;
  creditUnit: number;
  academicYear: string;
  semester: "FIRST" | "SECOND";
  level: "LEVEL_100" | "LEVEL_200" | "LEVEL_300" | "LEVEL_400" | "LEVEL_500";
  courseCode: string;
  status: string;
}

export interface SessionGPA {
  academicYear: string;
  semester: "FIRST" | "SECOND" | "BOTH";
  gpa: number;
  totalCredits: number;
  totalGradePoints: number;
  courses: CourseResult[];
}

export interface LevelGPA {
  level: string;
  gpa: number;
  totalCredits: number;
  totalGradePoints: number;
  sessions: string[];
  courses: CourseResult[];
}

export interface ComprehensiveGPA {
  cgpa: number;
  totalCredits: number;
  totalGradePoints: number;
  sessionGPAs: SessionGPA[];
  levelGPAs: LevelGPA[];
  progression: {
    currentLevel: string;
    nextLevel: string;
    creditsToNextLevel: number;
    canGraduate: boolean;
    graduationRequirements: {
      totalCredits: number;
      requiredCredits: number;
      remainingCredits: number;
      minCGPARequired: number;
    };
  };
  statistics: {
    totalCourses: number;
    passedCourses: number;
    failedCourses: number;
    weakPassCourses: number;
    passRate: number;
    gradeDistribution: Record<string, number>;
  };
}

/**
 * Calculate comprehensive GPA with session and level breakdown
 */
export function calculateComprehensiveGPA(
  results: CourseResult[]
): ComprehensiveGPA {
  // Filter only approved results
  const approvedResults = results.filter((r) => r.status === "SENATE_APPROVED");

  // Calculate overall CGPA
  const totalGradePoints = approvedResults.reduce((sum, result) => {
    const gradeInfo = GRADE_SCALE[result.grade];
    return sum + (gradeInfo ? gradeInfo.points * result.creditUnit : 0);
  }, 0);

  const totalCredits = approvedResults.reduce(
    (sum, result) => sum + result.creditUnit,
    0
  );
  const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

  // Calculate session-based GPAs
  const sessionGPAs = calculateSessionGPAs(approvedResults);

  // Calculate level-based GPAs
  const levelGPAs = calculateLevelGPAs(approvedResults);

  // Calculate progression information
  const progression = calculateProgression(approvedResults, cgpa);

  // Calculate statistics
  const statistics = calculateStatistics(approvedResults);

  return {
    cgpa: parseFloat(cgpa.toFixed(2)),
    totalCredits,
    totalGradePoints,
    sessionGPAs,
    levelGPAs,
    progression,
    statistics,
  };
}

/**
 * Calculate GPA for each academic session
 */
function calculateSessionGPAs(results: CourseResult[]): SessionGPA[] {
  const sessionMap = new Map<string, CourseResult[]>();

  // Group results by academic year and semester
  results.forEach((result) => {
    const key = `${result.academicYear}-${result.semester}`;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, []);
    }
    sessionMap.get(key)!.push(result);
  });

  const sessionGPAs: SessionGPA[] = [];

  sessionMap.forEach((courses, key) => {
    const [academicYear, semester] = key.split("-");
    const totalGradePoints = courses.reduce((sum, result) => {
      const gradeInfo = GRADE_SCALE[result.grade];
      return sum + (gradeInfo ? gradeInfo.points * result.creditUnit : 0);
    }, 0);

    const totalCredits = courses.reduce(
      (sum, result) => sum + result.creditUnit,
      0
    );
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    sessionGPAs.push({
      academicYear,
      semester: semester as "FIRST" | "SECOND",
      gpa: parseFloat(gpa.toFixed(2)),
      totalCredits,
      totalGradePoints,
      courses,
    });
  });

  // Sort by academic year and semester
  return sessionGPAs.sort((a, b) => {
    if (a.academicYear !== b.academicYear) {
      return a.academicYear.localeCompare(b.academicYear);
    }
    return a.semester === "FIRST" ? -1 : 1;
  });
}

/**
 * Calculate GPA for each academic level
 */
function calculateLevelGPAs(results: CourseResult[]): LevelGPA[] {
  const levelMap = new Map<string, CourseResult[]>();

  // Group results by level
  results.forEach((result) => {
    if (!levelMap.has(result.level)) {
      levelMap.set(result.level, []);
    }
    levelMap.get(result.level)!.push(result);
  });

  const levelGPAs: LevelGPA[] = [];

  levelMap.forEach((courses, level) => {
    const totalGradePoints = courses.reduce((sum, result) => {
      const gradeInfo = GRADE_SCALE[result.grade];
      return sum + (gradeInfo ? gradeInfo.points * result.creditUnit : 0);
    }, 0);

    const totalCredits = courses.reduce(
      (sum, result) => sum + result.creditUnit,
      0
    );
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    const sessions = [
      ...new Set(courses.map((c) => `${c.academicYear}-${c.semester}`)),
    ];

    levelGPAs.push({
      level,
      gpa: parseFloat(gpa.toFixed(2)),
      totalCredits,
      totalGradePoints,
      sessions,
      courses,
    });
  });

  // Sort by level
  return levelGPAs.sort((a, b) => {
    const levelOrder = {
      LEVEL_100: 1,
      LEVEL_200: 2,
      LEVEL_300: 3,
      LEVEL_400: 4,
      LEVEL_500: 5,
    };
    return (
      levelOrder[a.level as keyof typeof levelOrder] -
      levelOrder[b.level as keyof typeof levelOrder]
    );
  });
}

/**
 * Calculate academic progression information
 */
function calculateProgression(results: CourseResult[], cgpa: number) {
  const levels = [
    "LEVEL_100",
    "LEVEL_200",
    "LEVEL_300",
    "LEVEL_400",
    "LEVEL_500",
  ];
  const levelCredits = {
    LEVEL_100: 0,
    LEVEL_200: 0,
    LEVEL_300: 0,
    LEVEL_400: 0,
    LEVEL_500: 0,
  };

  // Calculate credits per level
  results.forEach((result) => {
    if (levelCredits[result.level as keyof typeof levelCredits] !== undefined) {
      levelCredits[result.level as keyof typeof levelCredits] +=
        result.creditUnit;
    }
  });

  // Determine current level (highest level with significant credits)
  let currentLevel = "LEVEL_100";
  for (let i = levels.length - 1; i >= 0; i--) {
    if (levelCredits[levels[i] as keyof typeof levelCredits] >= 20) {
      // Minimum 20 credits to be considered at that level
      currentLevel = levels[i];
      break;
    }
  }

  // Determine next level
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel =
    currentIndex < levels.length - 1 ? levels[currentIndex + 1] : "GRADUATION";

  // Calculate credits needed for next level (typically 24-30 credits per level)
  const creditsPerLevel = 24;
  const currentLevelCredits =
    levelCredits[currentLevel as keyof typeof levelCredits];
  const creditsToNextLevel = Math.max(0, creditsPerLevel - currentLevelCredits);

  // Check graduation requirements (typically 120-150 total credits)
  const totalCredits = results.reduce(
    (sum, result) => sum + result.creditUnit,
    0
  );
  const requiredCredits = 120; // Minimum credits for graduation
  const minCGPAForGraduation = 1.0; // Minimum CGPA for graduation (Pass level)
  const remainingCredits = Math.max(0, requiredCredits - totalCredits);
  const canGraduate =
    totalCredits >= requiredCredits &&
    currentLevel === "LEVEL_500" &&
    cgpa >= minCGPAForGraduation;

  return {
    currentLevel,
    nextLevel,
    creditsToNextLevel,
    canGraduate,
    graduationRequirements: {
      totalCredits,
      requiredCredits,
      remainingCredits,
      minCGPARequired: minCGPAForGraduation,
    },
  };
}

/**
 * Calculate comprehensive statistics
 */
function calculateStatistics(results: CourseResult[]) {
  const totalCourses = results.length;
  let passedCourses = 0;
  let failedCourses = 0;
  let weakPassCourses = 0;
  const gradeDistribution: Record<string, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  };

  results.forEach((result) => {
    const gradeInfo = GRADE_SCALE[result.grade];
    if (gradeInfo) {
      gradeDistribution[result.grade]++;

      if (gradeInfo.isPass) {
        passedCourses++;
      } else if (result.grade === "E") {
        weakPassCourses++;
      } else {
        failedCourses++;
      }
    }
  });

  const passRate =
    totalCourses > 0 ? Math.round((passedCourses / totalCourses) * 100) : 0;

  return {
    totalCourses,
    passedCourses,
    failedCourses,
    weakPassCourses,
    passRate,
    gradeDistribution,
  };
}

/**
 * Get GPA trend over sessions
 */
export function getGPATrend(sessionGPAs: SessionGPA[]): {
  trend: "improving" | "declining" | "stable";
  change: number;
  sessions: number;
} {
  if (sessionGPAs.length < 2) {
    return { trend: "stable", change: 0, sessions: sessionGPAs.length };
  }

  const firstGPA = sessionGPAs[0].gpa;
  const lastGPA = sessionGPAs[sessionGPAs.length - 1].gpa;
  const change = lastGPA - firstGPA;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (change > 0.1) trend = "improving";
  else if (change < -0.1) trend = "declining";

  return {
    trend,
    change: parseFloat(change.toFixed(2)),
    sessions: sessionGPAs.length,
  };
}

/**
 * Check if student can proceed to next level
 */
export function canProceedToNextLevel(
  levelGPA: LevelGPA,
  minimumGPA: number = 1.5
): boolean {
  return levelGPA.gpa >= minimumGPA;
}

/**
 * Get academic standing based on CGPA - The Federal University of Technology, Minna
 * Class of Degree Classification
 */
export function getAcademicStanding(cgpa: number): {
  standing: string;
  description: string;
  color: string;
  cgpaRange: string;
} {
  if (cgpa >= 4.5 && cgpa <= 5.0) {
    return {
      standing: "First Class",
      description: "Excellent Performance",
      color: "green",
      cgpaRange: "4.5-5.0",
    };
  } else if (cgpa >= 3.5 && cgpa < 4.5) {
    return {
      standing: "Second Class Upper",
      description: "Very Good Performance",
      color: "blue",
      cgpaRange: "3.5-4.49",
    };
  } else if (cgpa >= 2.4 && cgpa < 3.5) {
    return {
      standing: "Second Class Lower",
      description: "Good Performance",
      color: "yellow",
      cgpaRange: "2.40-3.49",
    };
  } else if (cgpa >= 1.5 && cgpa < 2.4) {
    return {
      standing: "Third Class",
      description: "Pass Performance",
      color: "orange",
      cgpaRange: "1.50-2.39",
    };
  } else if (cgpa >= 1.0 && cgpa < 1.5) {
    return {
      standing: "Pass",
      description: "Minimum Pass",
      color: "red",
      cgpaRange: "1.00-1.49",
    };
  } else {
    return {
      standing: "Fail",
      description: "Below Minimum Pass",
      color: "red",
      cgpaRange: "0.00-0.99",
    };
  }
}

/**
 * Grading system utilities - The Federal University of Technology, Minna
 * Department of Mechatronics Engineering 5.0 Grading System
 * Grade Scale:
 * A: 70-100 (5.0 points) - Excellent
 * B: 60-69  (4.0 points) - Very Good
 * C: 50-59  (3.0 points) - Good
 * D: 45-49  (2.0 points) - Satisfactory
 * E: 40-44  (1.0 points) - Fair
 * F: <40    (0.0 points) - Failure
 */

export interface GradeInfo {
  grade: string;
  points: number;
  description: string;
  isPass: boolean;
}

export const GRADE_SCALE: Record<string, GradeInfo> = {
  A: {
    grade: "A",
    points: 5.0,
    description: "Excellent (70-100)",
    isPass: true,
  },
  B: {
    grade: "B",
    points: 4.0,
    description: "Very Good (60-69)",
    isPass: true,
  },
  C: { grade: "C", points: 3.0, description: "Good (50-59)", isPass: true },
  D: {
    grade: "D",
    points: 2.0,
    description: "Satisfactory (45-49)",
    isPass: true,
  },
  E: {
    grade: "E",
    points: 1.0,
    description: "Fair (40-44)",
    isPass: false,
  },
  F: { grade: "F", points: 0.0, description: "Failure (<40)", isPass: false },
};

/**
 * Calculate grade from total score
 */
export function calculateGrade(totalScore: number): GradeInfo {
  if (totalScore >= 70) return GRADE_SCALE.A;
  if (totalScore >= 60) return GRADE_SCALE.B;
  if (totalScore >= 50) return GRADE_SCALE.C;
  if (totalScore >= 45) return GRADE_SCALE.D;
  if (totalScore >= 40) return GRADE_SCALE.E;
  return GRADE_SCALE.F;
}

/**
 * Calculate GPA from grades and credit units
 */
export function calculateGPA(
  results: Array<{ grade: string; creditUnit: number }>
): number {
  if (results.length === 0) return 0;

  let totalGradePoints = 0;
  let totalCredits = 0;

  results.forEach((result) => {
    const gradeInfo = GRADE_SCALE[result.grade];
    if (gradeInfo) {
      totalGradePoints += gradeInfo.points * result.creditUnit;
      totalCredits += result.creditUnit;
    }
  });

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
}

/**
 * Calculate CGPA from all results
 */
export function calculateCGPA(
  allResults: Array<{ grade: string; creditUnit: number }>
): number {
  return calculateGPA(allResults);
}

/**
 * Get grade statistics
 */
export function getGradeStatistics(
  results: Array<{ grade: string; creditUnit: number }>
) {
  const stats = {
    total: results.length,
    passed: 0,
    weakPass: 0,
    failed: 0,
    totalCredits: 0,
    passRate: 0,
    gradeDistribution: {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    },
  };

  results.forEach((result) => {
    const gradeInfo = GRADE_SCALE[result.grade];
    if (gradeInfo) {
      stats.totalCredits += result.creditUnit;
      stats.gradeDistribution[
        result.grade as keyof typeof stats.gradeDistribution
      ]++;

      if (gradeInfo.isPass) {
        stats.passed++;
      } else if (result.grade === "E") {
        stats.weakPass++;
      } else {
        stats.failed++;
      }
    }
  });

  stats.passRate =
    stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  return stats;
}

/**
 * Validate grade input
 */
export function isValidGrade(grade: string): boolean {
  return Object.keys(GRADE_SCALE).includes(grade.toUpperCase());
}

/**
 * Get all available grades
 */
export function getAllGrades(): GradeInfo[] {
  return Object.values(GRADE_SCALE);
}

/**
 * University Terminology - The Federal University of Technology, Minna
 * Official terms used in the grading system
 */
export const UNIVERSITY_TERMINOLOGY = {
  SCT: "Semesterial Course Taken",
  TCT: "Total Course Taken",
  SGP: "Semesterial Grade Point",
  CGP: "Cumulative Grade Point",
  GPA: "Grade Point Average",
  CGPA: "Cumulative Grade Point Average",
} as const;

/**
 * Calculate Semesterial Course Taken (SCT)
 * Total number of course units carried by a student in a particular semester
 */
export function calculateSCT(courses: Array<{ creditUnit: number }>): number {
  return courses.reduce((sum, course) => sum + course.creditUnit, 0);
}

/**
 * Calculate Semesterial Grade Point (SGP)
 * Sum of the product of course unit and rating (grade point) in each course for the entire semester
 */
export function calculateSGP(
  courses: Array<{ grade: string; creditUnit: number }>
): number {
  return courses.reduce((sum, course) => {
    const gradeInfo = GRADE_SCALE[course.grade];
    return sum + (gradeInfo ? gradeInfo.points * course.creditUnit : 0);
  }, 0);
}

/**
 * Calculate Total Course Taken (TCT)
 * Summation of the total number of course units taken over all semesters from the beginning to date
 */
export function calculateTCT(
  allCourses: Array<{ creditUnit: number }>
): number {
  return allCourses.reduce((sum, course) => sum + course.creditUnit, 0);
}

/**
 * Calculate Cumulative Grade Point (CGP)
 * Summation of total SGP over all semesters from the first semester as a student
 */
export function calculateCGP(
  allCourses: Array<{ grade: string; creditUnit: number }>
): number {
  return calculateSGP(allCourses);
}

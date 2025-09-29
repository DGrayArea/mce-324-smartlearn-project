/**
 * Test script for the course registration system
 * This script tests the complete workflow from department admin course selection to student course availability
 */

const testCourseRegistrationSystem = async () => {
  console.log("🧪 Testing Course Registration System...\n");

  // Test 1: Department Admin Course Selection
  console.log("1️⃣ Testing Department Admin Course Selection");
  try {
    const response = await fetch("/api/admin/department-courses", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Department courses fetched successfully");
      console.log(
        `   - Total courses available: ${data.allCourses?.length || 0}`
      );
      console.log(
        `   - Selected courses: ${data.selectedCourses?.length || 0}`
      );
    } else {
      console.log("❌ Failed to fetch department courses");
    }
  } catch (error) {
    console.log("❌ Error testing department courses:", error.message);
  }

  // Test 2: Course Availability for Students
  console.log("\n2️⃣ Testing Student Course Availability");
  try {
    const response = await fetch(
      "/api/course/available?academicYear=2024/2025&semester=FIRST",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Available courses fetched successfully");
      console.log(`   - Available courses: ${data.courses?.length || 0}`);

      // Group courses by category
      const categories = {};
      data.courses?.forEach((course) => {
        categories[course.category] = (categories[course.category] || 0) + 1;
      });

      console.log("   - Course categories:");
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`     • ${category}: ${count} courses`);
      });
    } else {
      console.log("❌ Failed to fetch available courses");
    }
  } catch (error) {
    console.log("❌ Error testing course availability:", error.message);
  }

  // Test 3: Course Sync
  console.log("\n3️⃣ Testing Course Availability Sync");
  try {
    const response = await fetch("/api/admin/sync-course-availability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Course availability synced successfully");
      console.log(`   - Synced courses: ${data.syncedCourses || 0}`);
      console.log(
        `   - General/Faculty courses: ${data.syncedGeneralFaculty || 0}`
      );
      console.log(`   - Total available: ${data.totalAvailable || 0}`);
    } else {
      console.log("❌ Failed to sync course availability");
    }
  } catch (error) {
    console.log("❌ Error testing course sync:", error.message);
  }

  console.log("\n🎉 Course Registration System Test Complete!");
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testCourseRegistrationSystem };
}

// Run if called directly
if (typeof window === "undefined" && require.main === module) {
  testCourseRegistrationSystem();
}

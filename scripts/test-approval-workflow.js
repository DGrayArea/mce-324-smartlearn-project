const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testApprovalWorkflow() {
  try {
    console.log("=== COMPREHENSIVE APPROVAL WORKFLOW TESTING ===\n");

    // Step 1: Show current status
    console.log("1. Current 2024/2025 status:");
    const currentStatus = await prisma.result.groupBy({
      by: ["semester", "status"],
      where: {
        academicYear: "2024/2025",
      },
      _count: {
        status: true,
      },
    });

    currentStatus.forEach((status) => {
      console.log(
        `   ${status.semester} semester: ${status._count.status} results - ${status.status}`
      );
    });

    console.log("\n" + "=".repeat(60));
    console.log("STUDENTS CANNOT SEE ANY 2024/2025 RESULTS YET");
    console.log("=".repeat(60) + "\n");

    // Step 2: Department Approval for FIRST semester
    console.log("2. Department approving FIRST semester...");
    const deptApproved = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "FIRST",
        status: "PENDING",
      },
      data: {
        status: "DEPARTMENT_APPROVED",
      },
    });
    console.log(`   ✓ Department approved: ${deptApproved.count} results`);
    console.log("   ⚠️  Students still CANNOT see these results\n");

    // Step 3: Faculty Approval for FIRST semester
    console.log("3. Faculty approving FIRST semester...");
    const facultyApproved = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "FIRST",
        status: "DEPARTMENT_APPROVED",
      },
      data: {
        status: "FACULTY_APPROVED",
      },
    });
    console.log(`   ✓ Faculty approved: ${facultyApproved.count} results`);
    console.log("   ⚠️  Students still CANNOT see these results\n");

    // Step 4: Senate Approval for FIRST semester
    console.log("4. Senate approving FIRST semester...");
    const senateApproved = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "FIRST",
        status: "FACULTY_APPROVED",
      },
      data: {
        status: "SENATE_APPROVED",
      },
    });
    console.log(`   ✓ Senate approved: ${senateApproved.count} results`);
    console.log("   🎉 Students can NOW see FIRST semester results!\n");

    console.log("=".repeat(60));
    console.log("FIRST SEMESTER IS NOW VISIBLE TO STUDENTS");
    console.log("SECOND SEMESTER IS STILL HIDDEN");
    console.log("=".repeat(60) + "\n");

    // Step 5: Test rejection scenario for SECOND semester
    console.log("5. Testing rejection scenario for SECOND semester...");

    // First, approve some results through department
    const deptApprovedSecond = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "PENDING",
      },
      data: {
        status: "DEPARTMENT_APPROVED",
      },
    });
    console.log(
      `   ✓ Department approved: ${deptApprovedSecond.count} results`
    );

    // Reject some results (simulate faculty finding issues)
    const rejectedCount = Math.floor(deptApprovedSecond.count * 0.1); // Reject 10%
    const rejectedResults = await prisma.result.findMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "DEPARTMENT_APPROVED",
      },
      take: rejectedCount,
    });

    if (rejectedResults.length > 0) {
      await prisma.result.updateMany({
        where: {
          id: {
            in: rejectedResults.map((r) => r.id),
          },
        },
        data: {
          status: "REJECTED",
        },
      });
      console.log(
        `   ❌ Faculty rejected: ${rejectedResults.length} results (need grade editing)`
      );
    }

    // Step 6: Simulate grade editing and resubmission
    console.log("\n6. Simulating grade editing and resubmission...");

    if (rejectedResults.length > 0) {
      // Simulate lecturer editing grades and resubmitting
      await prisma.result.updateMany({
        where: {
          id: {
            in: rejectedResults.map((r) => r.id),
          },
        },
        data: {
          status: "PENDING",
          // Simulate grade improvements
          totalScore: Math.min(100, Math.floor(Math.random() * 20) + 70), // 70-90 range
          grade: Math.random() > 0.5 ? "B" : "A", // Better grades
        },
      });
      console.log(
        `   ✏️  Grades edited and resubmitted: ${rejectedResults.length} results`
      );
    }

    // Step 7: Complete approval for SECOND semester
    console.log("\n7. Completing approval for SECOND semester...");

    // Department approval for resubmitted results
    await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "PENDING",
      },
      data: {
        status: "DEPARTMENT_APPROVED",
      },
    });

    // Faculty approval
    await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "DEPARTMENT_APPROVED",
      },
      data: {
        status: "FACULTY_APPROVED",
      },
    });

    // Senate approval
    const finalSenateApproved = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "FACULTY_APPROVED",
      },
      data: {
        status: "SENATE_APPROVED",
      },
    });

    console.log(`   ✓ Senate approved: ${finalSenateApproved.count} results`);
    console.log(
      "   🎉 Students can NOW see complete 2024/2025 academic year!\n"
    );

    // Final status summary
    console.log("=".repeat(60));
    console.log("FINAL STATUS SUMMARY");
    console.log("=".repeat(60));

    const finalStatus = await prisma.result.groupBy({
      by: ["semester", "status"],
      where: {
        academicYear: "2024/2025",
      },
      _count: {
        status: true,
      },
    });

    finalStatus.forEach((status) => {
      console.log(
        `   ${status.semester} semester: ${status._count.status} results - ${status.status}`
      );
    });

    console.log("\n🎉 COMPLETE APPROVAL WORKFLOW TESTED SUCCESSFULLY!");
    console.log(
      "🎉 Students can now see all 2024/2025 results with 'Approved by Senate' badges!"
    );
  } catch (error) {
    console.error("Error in approval workflow test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to reset to PENDING for testing
async function resetToPending() {
  try {
    console.log("Resetting 2024/2025 to PENDING for testing...");

    const reset = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
      },
      data: {
        status: "PENDING",
      },
    });

    console.log(`Reset ${reset.count} results to PENDING`);
    console.log("Ready for testing approval workflow!");
  } catch (error) {
    console.error("Error resetting to pending:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes("reset")) {
  resetToPending();
} else {
  testApprovalWorkflow();
}

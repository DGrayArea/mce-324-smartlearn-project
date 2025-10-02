const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testHierarchicalApproval() {
  try {
    console.log("=== HIERARCHICAL APPROVAL TESTING ===\n");

    // Test 1: Approve FIRST semester through the hierarchy
    console.log("1. Approving 2024/2025 FIRST semester through hierarchy...");

    // Step 1: Department Approval
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

    // Step 2: Faculty Approval
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

    // Step 3: Senate Approval
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

    console.log("\n   🎉 FIRST semester is now visible to students!\n");

    // Show current status
    const firstSemesterStatus = await prisma.result.groupBy({
      by: ["status"],
      where: {
        academicYear: "2024/2025",
        semester: "FIRST",
      },
      _count: {
        status: true,
      },
    });

    console.log("FIRST semester status breakdown:");
    firstSemesterStatus.forEach((status) => {
      console.log(`   ${status.status}: ${status._count.status} results`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("Students can now see 2024/2025 FIRST semester results!");
    console.log("=".repeat(50) + "\n");

    // Test 2: Show SECOND semester is still hidden
    const secondSemesterStatus = await prisma.result.groupBy({
      by: ["status"],
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
      },
      _count: {
        status: true,
      },
    });

    console.log("SECOND semester status (still hidden from students):");
    secondSemesterStatus.forEach((status) => {
      console.log(`   ${status.status}: ${status._count.status} results`);
    });

    console.log(
      "\nTo approve SECOND semester, run this script again with 'second' parameter"
    );
    console.log("Example: node scripts/test-hierarchical-approval.js second");
  } catch (error) {
    console.error("Error in hierarchical approval test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if we should approve SECOND semester
const args = process.argv.slice(2);
if (args.includes("second")) {
  approveSecondSemester();
} else {
  testHierarchicalApproval();
}

async function approveSecondSemester() {
  try {
    console.log("=== APPROVING SECOND SEMESTER ===\n");

    // Approve SECOND semester through the hierarchy
    console.log("Approving 2024/2025 SECOND semester through hierarchy...");

    // Step 1: Department Approval
    const deptApproved = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "PENDING",
      },
      data: {
        status: "DEPARTMENT_APPROVED",
      },
    });
    console.log(`   ✓ Department approved: ${deptApproved.count} results`);

    // Step 2: Faculty Approval
    const facultyApproved = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "DEPARTMENT_APPROVED",
      },
      data: {
        status: "FACULTY_APPROVED",
      },
    });
    console.log(`   ✓ Faculty approved: ${facultyApproved.count} results`);

    // Step 3: Senate Approval
    const senateApproved = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "FACULTY_APPROVED",
      },
      data: {
        status: "SENATE_APPROVED",
      },
    });
    console.log(`   ✓ Senate approved: ${senateApproved.count} results`);

    console.log("\n   🎉 SECOND semester is now visible to students!");
    console.log(
      "   🎉 Students can now see the complete 2024/2025 academic year!"
    );
  } catch (error) {
    console.error("Error approving second semester:", error);
  } finally {
    await prisma.$disconnect();
  }
}

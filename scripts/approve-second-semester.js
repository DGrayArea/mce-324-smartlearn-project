const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function approveSecondSemester() {
  try {
    console.log("=== APPROVING 2024/2025 SECOND SEMESTER ===\n");

    // Step 1: Department Approval
    console.log("1. Department approving SECOND semester...");
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
    console.log("   ⚠️  Students still CANNOT see these results\n");

    // Step 2: Faculty Approval
    console.log("2. Faculty approving SECOND semester...");
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
    console.log("   ⚠️  Students still CANNOT see these results\n");

    // Step 3: Senate Approval
    console.log("3. Senate approving SECOND semester...");
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
    console.log("   🎉 Students can NOW see SECOND semester results!\n");

    console.log("=".repeat(50));
    console.log("COMPLETE 2024/2025 ACADEMIC YEAR IS NOW VISIBLE!");
    console.log(
      "Check the frontend to see both semesters with 'Approved by Senate' badges!"
    );
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Error approving second semester:", error);
  } finally {
    await prisma.$disconnect();
  }
}

approveSecondSemester();

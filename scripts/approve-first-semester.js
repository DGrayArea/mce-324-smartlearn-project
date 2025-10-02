const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function approveFirstSemester() {
  try {
    console.log("=== APPROVING 2024/2025 FIRST SEMESTER ===\n");

    // Step 1: Department Approval
    console.log("1. Department approving FIRST semester...");
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

    // Step 2: Faculty Approval
    console.log("2. Faculty approving FIRST semester...");
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

    // Step 3: Senate Approval
    console.log("3. Senate approving FIRST semester...");
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

    console.log("=".repeat(50));
    console.log("FIRST SEMESTER IS NOW VISIBLE TO STUDENTS");
    console.log("Check the frontend to see the 'Approved by Senate' badge!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Error approving first semester:", error);
  } finally {
    await prisma.$disconnect();
  }
}

approveFirstSemester();

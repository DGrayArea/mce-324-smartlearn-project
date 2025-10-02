const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateResultStatus() {
  try {
    console.log("Starting result status update...");

    // Update all results from previous academic years to SENATE_APPROVED
    const previousYears = [
      "2023/2024",
      "2022/2023",
      "2021/2022",
      "2020/2021",
      "2019/2020",
    ];

    for (const academicYear of previousYears) {
      const updated = await prisma.result.updateMany({
        where: {
          academicYear: academicYear,
          status: {
            not: "SENATE_APPROVED",
          },
        },
        data: {
          status: "SENATE_APPROVED",
        },
      });

      console.log(
        `Updated ${updated.count} results for academic year ${academicYear} to SENATE_APPROVED`
      );
    }

    // Set all 2024/2025 results (both semesters) to PENDING for testing hierarchical approval
    const all2024Results = await prisma.result.updateMany({
      where: {
        academicYear: "2024/2025",
        status: {
          not: "PENDING",
        },
      },
      data: {
        status: "PENDING",
      },
    });

    console.log(
      `Set ${all2024Results.count} results for 2024/2025 (both semesters) to PENDING for testing`
    );

    // Count results by semester for 2024/2025
    const firstSemesterCount = await prisma.result.count({
      where: {
        academicYear: "2024/2025",
        semester: "FIRST",
        status: "PENDING",
      },
    });

    const secondSemesterCount = await prisma.result.count({
      where: {
        academicYear: "2024/2025",
        semester: "SECOND",
        status: "PENDING",
      },
    });

    console.log(
      `2024/2025 FIRST semester: ${firstSemesterCount} results PENDING`
    );
    console.log(
      `2024/2025 SECOND semester: ${secondSemesterCount} results PENDING`
    );

    // Show summary
    const totalApproved = await prisma.result.count({
      where: {
        status: "SENATE_APPROVED",
      },
    });

    const totalPending = await prisma.result.count({
      where: {
        status: "PENDING",
      },
    });

    console.log("\n=== SUMMARY ===");
    console.log(`Total SENATE_APPROVED results: ${totalApproved}`);
    console.log(`Total PENDING results: ${totalPending}`);
    console.log("Update completed successfully!");
  } catch (error) {
    console.error("Error updating result status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateResultStatus();

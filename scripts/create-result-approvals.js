const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createResultApprovals() {
  try {
    console.log(
      "Creating result approvals for hierarchical approval system..."
    );

    // Get all PENDING results for 2024/2025
    const pendingResults = await prisma.result.findMany({
      where: {
        academicYear: "2024/2025",
        status: "PENDING",
      },
      include: {
        course: {
          include: {
            department: true,
          },
        },
        student: {
          include: {
            department: true,
          },
        },
      },
    });

    console.log(`Found ${pendingResults.length} pending results for 2024/2025`);
    console.log("Creating approval records in batches...");

    // Process in batches for better performance
    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < pendingResults.length; i += batchSize) {
      const batch = pendingResults.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pendingResults.length / batchSize)} (${batch.length} results)`
      );

      // Create all approval records for this batch
      const approvalRecords = [];

      for (const result of batch) {
        // Create Department Admin approval record
        approvalRecords.push({
          resultId: result.id,
          level: "DEPARTMENT_ADMIN",
          status: "PENDING",
        });

        // Create School Admin approval record
        approvalRecords.push({
          resultId: result.id,
          level: "SCHOOL_ADMIN",
          status: "PENDING",
        });

        // Create Senate Admin approval record
        approvalRecords.push({
          resultId: result.id,
          level: "SENATE_ADMIN",
          status: "PENDING",
        });
      }

      // Bulk create approval records
      await prisma.resultApproval.createMany({
        data: approvalRecords,
        skipDuplicates: true,
      });

      processed += batch.length;
      console.log(
        `✓ Processed ${processed}/${pendingResults.length} results (${Math.round((processed / pendingResults.length) * 100)}%)`
      );
    }

    // Count approvals by level
    const deptApprovals = await prisma.resultApproval.count({
      where: {
        level: "DEPARTMENT_ADMIN",
        status: "PENDING",
      },
    });

    const schoolApprovals = await prisma.resultApproval.count({
      where: {
        level: "SCHOOL_ADMIN",
        status: "PENDING",
      },
    });

    const senateApprovals = await prisma.resultApproval.count({
      where: {
        level: "SENATE_ADMIN",
        status: "PENDING",
      },
    });

    console.log("\n=== RESULT APPROVALS CREATED ===");
    console.log(`Department Admin approvals: ${deptApprovals}`);
    console.log(`School Admin approvals: ${schoolApprovals}`);
    console.log(`Senate Admin approvals: ${senateApprovals}`);
    console.log("\nHierarchical approval system is now ready for testing!");
  } catch (error) {
    console.error("Error creating result approvals:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createResultApprovals();

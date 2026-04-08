import {
  deleteOldRawData,
  deleteOldCalculatedData,
  getLastCleanupRun,
  updateCleanupRun
} from "./cleanup.db";

/* ============================= */
/* SMART CLEANUP */
/* ============================= */

export const runCleanupIfNeeded = async () => {
  try {
    const lastRun = await getLastCleanupRun();
    const now = new Date();

    if (lastRun) {
      const diffHours =
        (now.getTime() - new Date(lastRun).getTime()) / (1000 * 60 * 60);

      // Skip if ran in last 24 hours
      if (diffHours < 24) {
        console.log("🟡 Cleanup skipped (already ran recently)");
        return;
      }
    }

    console.log("🧹 Cleanup started");

    await deleteOldRawData();
    await deleteOldCalculatedData();

    await updateCleanupRun();

    console.log("✅ Cleanup completed");

  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  }
};
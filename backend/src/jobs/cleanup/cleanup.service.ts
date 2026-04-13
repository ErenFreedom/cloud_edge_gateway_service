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
      const lastRunDay = new Date(lastRun).toDateString();
      const today = now.toDateString();

      if (lastRunDay === today) {
        console.log("Cleanup skipped (already ran today)");
        return;
      }
    }

    console.log("Cleanup started");

    await deleteOldRawData();
    await deleteOldCalculatedData();

    await updateCleanupRun();

    console.log("Cleanup completed");

  } catch (err) {
    console.error("Cleanup failed:", err);
  }
};
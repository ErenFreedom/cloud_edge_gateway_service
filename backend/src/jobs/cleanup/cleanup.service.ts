import {
  deleteOldRawData,
  deleteOldCalculatedData
} from "./cleanup.db";

export const runCleanup = async () => {
  try {
    console.log(" Cleanup started");

    await deleteOldRawData();
    await deleteOldCalculatedData();

    console.log(" Cleanup completed");

  } catch (err) {
    console.error(" Cleanup failed:", err);
  }
};
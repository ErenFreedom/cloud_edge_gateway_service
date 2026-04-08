import dotenv from "dotenv";
import cron from "node-cron";
import { runCleanupIfNeeded } from "./cleanup.service";

dotenv.config();

console.log("Cleanup Job Started");

/* ============================= */
/* RUN ON STARTUP */
/* ============================= */

runCleanupIfNeeded();

/* ============================= */
/* RUN DAILY AT 2 AM */
/* ============================= */

cron.schedule("0 2 * * *", async () => {
  console.log("Scheduled cleanup triggered");
  await runCleanupIfNeeded();
});
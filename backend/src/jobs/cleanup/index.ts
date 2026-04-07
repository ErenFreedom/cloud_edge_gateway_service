import dotenv from "dotenv";
import cron from "node-cron";
import { runCleanup } from "./cleanup.service";

dotenv.config();

console.log(" Cleanup Job Started");

/* ============================= */
/* RUN DAILY AT 2 AM */
/* ============================= */

cron.schedule("0 2 * * *", async () => {
  console.log(" Running scheduled cleanup...");
  await runCleanup();
});
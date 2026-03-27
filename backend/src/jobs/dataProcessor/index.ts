import dotenv from "dotenv";
import { processBatch } from "./processor.service";

dotenv.config();

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const start = async () => {

  console.log("Data Processor Started");

  while (true) {
    try {
      const processed = await processBatch();

      if (processed === 0) {
        console.log("No data, sleeping...");
        await sleep(40000); // 30 sec
      }

    } catch (err) {
      console.error("Processor error:", err);
      await sleep(10000);
    }
  }
};

start();
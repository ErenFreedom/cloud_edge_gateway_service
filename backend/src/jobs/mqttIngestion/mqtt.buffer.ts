import { ProcessedRow } from "./mqtt.types";
import { insertBatch } from "./mqtt.db";
import { insertRawToBigQuery } from "../bqWriter/bq.service";


/* ============================= */
/* CONFIG */
/* ============================= */

const BUFFER_SIZE = 1000;         // max memory safety
const FLUSH_INTERVAL = 5000;      // 5 sec safety flush
const ONE_HOUR = 60 * 60 * 1000;

/* ============================= */

let buffer: ProcessedRow[] = [];
let lastHourFlush = Date.now();

/* ============================= */

export const addToBuffer = (data: ProcessedRow): void => {
  buffer.push(data);

  //  Safety flush (avoid memory explosion)
  if (buffer.length >= BUFFER_SIZE) {
    void flush("BUFFER_LIMIT");
  }
};

/* ============================= */

export const flush = async (reason: string = "INTERVAL"): Promise<void> => {
  if (buffer.length === 0) return;

  const batch = [...buffer];
  buffer = [];

  try {
    //  Cloud SQL (blocking)
    await insertBatch(batch);

    //  BigQuery (NON-BLOCKING)
    insertRawToBigQuery(batch).catch((err) => {
      console.error("BQ async error:", err);
    });

    console.log(`✅ Flushed ${batch.length} rows [${reason}]`);

  } catch (err) {
    console.error("Batch insert failed:", err);
  }
};

/* ============================= */
/* PERIODIC CHECK */
/* ============================= */

setInterval(() => {

  const now = Date.now();

  //  HOURLY FLUSH (PRIMARY GOAL)
  if (now - lastHourFlush >= ONE_HOUR) {
    console.log(" Hourly flush triggered");
    lastHourFlush = now;
    void flush("HOURLY");
    return;
  }

  //  Safety flush (every 5 sec)
  if (buffer.length > 0) {
    void flush("SAFETY");
  }

}, FLUSH_INTERVAL);
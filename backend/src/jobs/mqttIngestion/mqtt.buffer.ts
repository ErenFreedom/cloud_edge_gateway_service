import { ProcessedRow } from "./mqtt.types";
import { insertBatch } from "./mqtt.db";

const BUFFER_SIZE = 200;
const FLUSH_INTERVAL = 1000;

let buffer: ProcessedRow[] = [];

export const addToBuffer = (data: ProcessedRow): void => {
  buffer.push(data);

  if (buffer.length >= BUFFER_SIZE) {
    void flush();
  }
};

export const flush = async (): Promise<void> => {
  if (buffer.length === 0) return;

  const batch = [...buffer];
  buffer = [];

  try {
    await insertBatch(batch);
    console.log(`Inserted batch of ${batch.length}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Batch insert failed:", err.message);
    } else {
      console.error("Batch insert failed:", err);
    }
  }
};

setInterval(() => {
  void flush();
}, FLUSH_INTERVAL);
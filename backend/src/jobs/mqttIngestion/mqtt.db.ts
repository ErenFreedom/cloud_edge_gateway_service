import { Pool } from "pg";
import { ProcessedRow } from "./mqtt.types";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export const insertBatch = async (rows: ProcessedRow[]): Promise<void> => {
  if (rows.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  rows.forEach((row, i) => {
    const idx = i * 11;

    placeholders.push(
      `($${idx+1},$${idx+2},$${idx+3},$${idx+4},$${idx+5},
        $${idx+6},$${idx+7},$${idx+8},$${idx+9},$${idx+10},$${idx+11})`
    );

    values.push(
      row.topic,
      row.payload,
      row.client_id,
      row.site_id,
      row.sensor_id,
      row.device,
      row.location,
      row.value,
      row.quality,
      row.quality_good,
      row.timestamp
    );
  });

  await pool.query(
    `
    INSERT INTO raw_data
    (topic, payload, client_id, site_id, sensor_id,
     device, location, value, quality, quality_good, timestamp_value)
    VALUES ${placeholders.join(",")}
    `,
    values
  );
};
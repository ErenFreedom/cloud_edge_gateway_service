import { Pool } from "pg";
import { ProcessedRow } from "./mqtt.types";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

/**
 * 🔥 In-memory cache for fast lookup
 */
const sensorCache = new Map<number, string>();

/**
 * 🔥 Map external sensor_id → UUID
 */
export const getSensorUUID = async (
  externalId: number
): Promise<string | null> => {
  if (sensorCache.has(externalId)) {
    return sensorCache.get(externalId)!;
  }

  const res = await pool.query(
    `SELECT id FROM sensors WHERE external_sensor_id = $1 LIMIT 1`,
    [String(externalId)]
  );

  const uuid = res.rows[0]?.id || null;

  if (uuid) {
    sensorCache.set(externalId, uuid);
  }

  return uuid;
};

/**
 * 🔥 Batch Insert with mapping
 */
export const insertBatch = async (rows: ProcessedRow[]): Promise<void> => {
  if (rows.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  let paramIndex = 1;

  for (const row of rows) {
    if (!row.sensor_id) continue;

    // 🔥 Map sensor_id
    const sensorUUID = await getSensorUUID(row.sensor_id);

    if (!sensorUUID) {
      console.error("❌ Sensor not found:", row.sensor_id);
      continue;
    }

    placeholders.push(
      `($${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},
        $${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++})`
    );

    values.push(
      row.topic,
      row.payload,
      row.organization_id,
      row.site_id,
      sensorUUID, // 🔥 FIX HERE
      row.device,
      row.location,
      row.value,
      row.quality,
      row.quality_good,
      row.timestamp
    );
  }

  if (values.length === 0) return;

  try {
    await pool.query(
      `
      INSERT INTO raw_data
      (topic, payload, organization_id, site_id, sensor_id,
       device, location, value, quality, quality_good, timestamp_value)
      VALUES ${placeholders.join(",")}
      `,
      values
    );

    console.log(`✅ Inserted batch of ${rows.length}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Batch insert failed:", err.message);
    } else {
      console.error("❌ Batch insert failed:", err);
    }
  }
};
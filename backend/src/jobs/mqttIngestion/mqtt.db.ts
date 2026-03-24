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
 * 🔥 Get or Create Sensor UUID
 */
export const getOrCreateSensorUUID = async (
  externalId: number,
  organization_id: string,
  site_id: string
): Promise<string> => {

  // ✅ Cache hit
  if (sensorCache.has(externalId)) {
    return sensorCache.get(externalId)!;
  }

  // 🔍 Check if exists
  const existing = await pool.query(
    `SELECT id FROM sensors WHERE external_sensor_id = $1 LIMIT 1`,
    [String(externalId)]
  );

  if (existing.rows.length > 0) {
    const uuid = existing.rows[0].id;
    sensorCache.set(externalId, uuid);
    return uuid;
  }

  // 🔥 CREATE NEW SENSOR
  const inserted = await pool.query(
    `
    INSERT INTO sensors 
    (organization_id, site_id, sensor_uuid, external_sensor_id)
    VALUES ($1, $2, gen_random_uuid(), $3)
    RETURNING id
    `,
    [organization_id, site_id, String(externalId)]
  );

  const newUUID = inserted.rows[0].id;

  console.log("✅ Created sensor:", externalId);

  sensorCache.set(externalId, newUUID);

  return newUUID;
};

/**
 * 🔥 Batch Insert with mapping
 */
export const insertBatch = async (rows: ProcessedRow[]): Promise<void> => {
  if (rows.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  let paramIndex = 1;
  let insertedCount = 0;

  for (const row of rows) {
    if (!row.sensor_id || !row.organization_id || !row.site_id) {
      console.error("❌ Missing required row data");
      continue;
    }

    // 🔥 AUTO CREATE OR GET SENSOR
    const sensorUUID = await getOrCreateSensorUUID(
      row.sensor_id,
      row.organization_id,
      row.site_id
    );

    placeholders.push(
      `($${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},
        $${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++},$${paramIndex++})`
    );

    values.push(
      row.topic,
      row.payload,
      row.organization_id,
      row.site_id,
      sensorUUID,
      row.device,
      row.location,
      row.value,
      row.quality,
      row.quality_good,
      row.timestamp
    );

    insertedCount++;
  }

  if (values.length === 0) {
    console.log("⚠️ No valid rows to insert");
    return;
  }

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

    console.log(`✅ Inserted batch of ${insertedCount}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Batch insert failed:", err.message);
    } else {
      console.error("❌ Batch insert failed:", err);
    }
  }
};
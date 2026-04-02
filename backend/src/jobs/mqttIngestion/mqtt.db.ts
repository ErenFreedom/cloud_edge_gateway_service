import { Pool } from "pg";
import { ProcessedRow } from "./mqtt.types";
const siteStatusCache = new Map<string, string>();
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});


export const getSiteStatus = async (siteId: string): Promise<string | null> => {
  if (siteStatusCache.has(siteId)) {
    return siteStatusCache.get(siteId)!;
  }

  const res = await pool.query(
    `SELECT status FROM sites WHERE id = $1 LIMIT 1`,
    [siteId]
  );

  const status = res.rows[0]?.status || null;

  if (status) {
    siteStatusCache.set(siteId, status);
  }

  return status;
};


/**
 * In-memory cache for fast lookup
 */
const sensorCache = new Map<number, string>();

/**
 * Get or Create Sensor UUID
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

  //  CREATE NEW SENSOR
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


export const upsertSensorMetadata = async (
  sensorUUID: string,
  data: any
) => {

  await pool.query(
    `
    UPDATE sensors
    SET 
      sensor_name = COALESCE($2, sensor_name),
      sensor_location = COALESCE($3, sensor_location),
      api_endpoint = COALESCE($4, api_endpoint),
      polling_interval = COALESCE($5, polling_interval),
      upper_bound = COALESCE($6, upper_bound),
      meter_max_value = COALESCE($7, meter_max_value),
      max_load_kw = COALESCE($8, max_load_kw)
    WHERE id = $1
    `,
    [
      sensorUUID,
      data.sensor_name,
      data.sensor_location,
      data.api_endpoint,
      data.polling_interval,
      data.upper_bound,
      data.meter_max_value,
      data.max_load_kw
    ]
  );
};

/**
 *  Batch Insert with mapping
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

    // CHECK SITE STATUS
    const siteStatus = await getSiteStatus(row.site_id);

    if (!siteStatus) {
      console.error("❌ Site not found:", row.site_id);
      continue;
    }

    if (siteStatus !== "active") {
      console.log(`🚫 Data blocked for site ${row.site_id} (status: ${siteStatus})`);
      continue;
    }

    //  SENSOR MAPPING (unchanged)
    const sensorUUID = await getOrCreateSensorUUID(
      row.sensor_id,
      row.organization_id,
      row.site_id
    );

    if (row.metadata) {
      await upsertSensorMetadata(sensorUUID, row.metadata);
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
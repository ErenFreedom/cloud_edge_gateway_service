import { Pool } from "pg";
import { ProcessedRow, SensorMetadata } from "./mqtt.types";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

/* ---------------- SITE CACHE ---------------- */

const siteStatusCache = new Map<string, string>();

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

/* ---------------- SENSOR CACHE (FIXED) ---------------- */

const sensorCache = new Map<string, string>();

export const getOrCreateSensorUUID = async (
  externalId: number,
  organization_id: string,
  site_id: string
): Promise<string> => {

  const key = `${organization_id}_${site_id}_${externalId}`;

  // ✅ CACHE HIT
  if (sensorCache.has(key)) {
    return sensorCache.get(key)!;
  }

  // 🔥 UPSERT (NO SELECT, NO RACE CONDITION)
  const result = await pool.query(
    `
    INSERT INTO sensors 
    (organization_id, site_id, sensor_uuid, external_sensor_id)
    VALUES ($1, $2, gen_random_uuid(), $3)
    ON CONFLICT (external_sensor_id, site_id)
    DO UPDATE SET external_sensor_id = EXCLUDED.external_sensor_id
    RETURNING id
    `,
    [organization_id, site_id, String(externalId)]
  );

  const uuid = result.rows[0].id;

  console.log("✅ Sensor UUID:", externalId, uuid);

  sensorCache.set(key, uuid);

  return uuid;
};

/* ---------------- METADATA UPSERT ---------------- */

export const upsertSensorMetadata = async (
  sensorUUID: string,
  data: SensorMetadata
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
      data.sensor_name ?? null,
      data.sensor_location ?? null,
      data.api_endpoint ?? null,
      data.polling_interval ?? null,
      data.upper_bound ?? null,
      data.meter_max_value ?? null,
      data.max_load_kw ?? null
    ]
  );
};

/* ---------------- BATCH INSERT ---------------- */

export const insertBatch = async (rows: ProcessedRow[]): Promise<void> => {
  if (rows.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  let paramIndex = 1;
  let insertedCount = 0;

  for (const row of rows) {

    console.log("📦 Processing sensor:", row.sensor_id);

    if (!row.sensor_id || !row.organization_id || !row.site_id) {
      console.error("❌ Missing required row data");
      continue;
    }

    // 🔍 SITE STATUS CHECK
    const siteStatus = await getSiteStatus(row.site_id);

    if (!siteStatus) {
      console.error("❌ Site not found:", row.site_id);
      continue;
    }

    if (siteStatus !== "active") {
      console.log(`🚫 BLOCKED sensor ${row.sensor_id}`);
      continue;
    }

    try {
      // 🔑 ALWAYS GUARANTEED SENSOR EXISTS
      const sensorUUID = await getOrCreateSensorUUID(
        row.sensor_id,
        row.organization_id,
        row.site_id
      );

      console.log("🔑 UUID:", sensorUUID);

      // 🧠 METADATA UPDATE
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

    } catch (err) {
      console.error("❌ Sensor processing failed:", err);
    }
  }

  console.log("🧾 Final insert count:", insertedCount);

  // 🚨 CRITICAL FIX (EMPTY BATCH)
  if (placeholders.length === 0) {
    console.log("⚠️ Skipping empty batch");
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

  } catch (err) {
    console.error("❌ Batch insert failed:", err);
  }
};
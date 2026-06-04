import { Pool } from "pg";
import { ProcessedRow, SensorMetadata } from "./mqtt.types";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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

/* ---------------- NORMALIZATION ---------------- */

const normalizeText = (value?: string | null): string | null => {
  if (!value) return null;

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[;]+$/g, "");
};

const normalizeApiEndpoint = (value?: string | null): string | null => {
  if (!value) return null;

  return value
    .trim()
    .toLowerCase()
    .replace(/[;]+$/g, "");
};

/* ---------------- SENSOR CACHE ---------------- */

const sensorCache = new Map<string, string>();

interface SensorIdentityInput {
  externalId: number | null;
  organizationId: string;
  siteId: string;
  sensorName?: string | null;
  apiEndpoint?: string | null;
}

export const getOrCreateSensorUUID = async ({
  externalId,
  organizationId,
  siteId,
  sensorName,
  apiEndpoint,
}: SensorIdentityInput): Promise<string> => {
  const normalizedSensorName = normalizeText(sensorName);
  const normalizedApiEndpoint = normalizeApiEndpoint(apiEndpoint);
  const externalSensorId =
    externalId !== null && externalId !== undefined
      ? String(externalId)
      : null;

  const cacheKey =
    normalizedApiEndpoint
      ? `${organizationId}_${siteId}_api_${normalizedApiEndpoint}`
      : normalizedSensorName
        ? `${organizationId}_${siteId}_name_${normalizedSensorName}`
        : `${organizationId}_${siteId}_external_${externalSensorId}`;

  if (sensorCache.has(cacheKey)) {
    return sensorCache.get(cacheKey)!;
  }

  /*
    IDENTITY PRIORITY:
    1. organization + site + normalized_api_endpoint
    2. organization + site + normalized_sensor_name
    3. organization + site + external_sensor_id
    4. create new sensor
  */

  let existingSensor = null;

  if (normalizedApiEndpoint) {
    const res = await pool.query(
      `
      SELECT id
      FROM sensors
      WHERE organization_id = $1
        AND site_id = $2
        AND normalized_api_endpoint = $3
      LIMIT 1
      `,
      [organizationId, siteId, normalizedApiEndpoint]
    );

    existingSensor = res.rows[0] || null;
  }

  if (!existingSensor && normalizedSensorName) {
    const res = await pool.query(
      `
      SELECT id
      FROM sensors
      WHERE organization_id = $1
        AND site_id = $2
        AND normalized_sensor_name = $3
      LIMIT 1
      `,
      [organizationId, siteId, normalizedSensorName]
    );

    existingSensor = res.rows[0] || null;
  }

  if (!existingSensor && externalSensorId) {
    const res = await pool.query(
      `
      SELECT id
      FROM sensors
      WHERE organization_id = $1
        AND site_id = $2
        AND external_sensor_id = $3
      LIMIT 1
      `,
      [organizationId, siteId, externalSensorId]
    );

    existingSensor = res.rows[0] || null;
  }

  if (existingSensor) {
    const uuid = existingSensor.id;

    await pool.query(
      `
      UPDATE sensors
      SET
        external_sensor_id = COALESCE($2, external_sensor_id),
        sensor_name = COALESCE($3, sensor_name),
        api_endpoint = COALESCE($4, api_endpoint),
        normalized_sensor_name = COALESCE($5, normalized_sensor_name),
        normalized_api_endpoint = COALESCE($6, normalized_api_endpoint)
      WHERE id = $1
      `,
      [
        uuid,
        externalSensorId,
        sensorName ?? null,
        apiEndpoint ?? null,
        normalizedSensorName,
        normalizedApiEndpoint,
      ]
    );

    sensorCache.set(cacheKey, uuid);

    console.log("✅ Existing sensor UUID resolved:", {
      externalSensorId,
      sensorName,
      uuid,
    });

    return uuid;
  }

  const result = await pool.query(
    `
    INSERT INTO sensors (
      organization_id,
      site_id,
      sensor_uuid,
      external_sensor_id,
      sensor_name,
      api_endpoint,
      normalized_sensor_name,
      normalized_api_endpoint
    )
    VALUES (
      $1,
      $2,
      gen_random_uuid(),
      $3,
      $4,
      $5,
      $6,
      $7
    )
    RETURNING id
    `,
    [
      organizationId,
      siteId,
      externalSensorId,
      sensorName ?? null,
      apiEndpoint ?? null,
      normalizedSensorName,
      normalizedApiEndpoint,
    ]
  );

  const uuid = result.rows[0].id;

  sensorCache.set(cacheKey, uuid);

  console.log("🆕 Created sensor UUID:", {
    externalSensorId,
    sensorName,
    uuid,
  });

  return uuid;
};

/* ---------------- METADATA UPSERT ---------------- */

export const upsertSensorMetadata = async (
  sensorUUID: string,
  data: SensorMetadata
) => {
  const normalizedSensorName = normalizeText(data.sensor_name);
  const normalizedApiEndpoint = normalizeApiEndpoint(data.api_endpoint);

  await pool.query(
    `
    UPDATE sensors
    SET 
      sensor_name = COALESCE($2, sensor_name),
      sensor_location = COALESCE($3, sensor_location),
      api_endpoint = COALESCE($4, api_endpoint),
      normalized_sensor_name = COALESCE($5, normalized_sensor_name),
      normalized_api_endpoint = COALESCE($6, normalized_api_endpoint),
      polling_interval = COALESCE($7, polling_interval),
      upper_bound = COALESCE($8, upper_bound),
      meter_max_value = COALESCE($9, meter_max_value),
      max_load_kw = COALESCE($10, max_load_kw)
    WHERE id = $1
    `,
    [
      sensorUUID,
      data.sensor_name ?? null,
      data.sensor_location ?? null,
      data.api_endpoint ?? null,
      normalizedSensorName,
      normalizedApiEndpoint,
      data.polling_interval ?? null,
      data.upper_bound ?? null,
      data.meter_max_value ?? null,
      data.max_load_kw ?? null,
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
    console.log("Processing sensor:", row.sensor_id);

    if (!row.organization_id || !row.site_id) {
      console.error("❌ Missing organization/site data");
      continue;
    }

    if (
      !row.sensor_id &&
      !row.metadata?.sensor_name &&
      !row.metadata?.api_endpoint
    ) {
      console.error("❌ Missing all sensor identity fields");
      continue;
    }

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
      const sensorUUID = await getOrCreateSensorUUID({
        externalId: row.sensor_id,
        organizationId: row.organization_id,
        siteId: row.site_id,
        sensorName: row.metadata?.sensor_name,
        apiEndpoint: row.metadata?.api_endpoint,
      });

      row.uuid = sensorUUID;

      row.external_id =
        row.sensor_id !== null && row.sensor_id !== undefined
          ? String(row.sensor_id)
          : null;

      console.log("UUID:", sensorUUID);

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

  if (placeholders.length === 0) {
    console.log("⚠️ Skipping empty batch");
    return;
  }

  try {
    await pool.query(
      `
      INSERT INTO raw_data
      (
        topic,
        payload,
        organization_id,
        site_id,
        sensor_id,
        device,
        location,
        value,
        quality,
        quality_good,
        timestamp_value
      )
      VALUES ${placeholders.join(",")}
      `,
      values
    );

    console.log(`✅ Inserted batch of ${insertedCount}`);
  } catch (err) {
    console.error("❌ Batch insert failed:", err);
  }
};
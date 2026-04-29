import { pool } from "../../config/database";

/* ========================= */
/* GET ALL SENSORS */
/* ========================= */

export const getSensorsRepo = async (
  orgId: string,
  siteId: string
) => {

  const res = await pool.query(
    `
    SELECT 
      id,
      sensor_name,
      griha_type,
      unit
    FROM sensors
    WHERE organization_id = $1
    AND site_id = $2
    `,
    [orgId, siteId]
  );

  return res.rows;
};

/* ========================= */
/* SAVE CONFIG */
/* ========================= */

export const saveGrihaConfigRepo = async (
  orgId: string,
  siteId: string,
  mapping: any
) => {

  await pool.query(
    `
    INSERT INTO griha_config (organization_id, site_id, mapping)
    VALUES ($1, $2, $3)
    ON CONFLICT (site_id)
    DO UPDATE SET mapping = $3
    `,
    [orgId, siteId, JSON.stringify(mapping)]
  );
};

/* ========================= */
/* GET CONFIG */
/* ========================= */

export const getGrihaConfigRepo = async (
  orgId: string,
  siteId: string
) => {

  const res = await pool.query(
    `
    SELECT mapping
    FROM griha_config
    WHERE organization_id = $1
    AND site_id = $2
    `,
    [orgId, siteId]
  );

  return res.rows[0]?.mapping || null;
};

/* ========================= */
/* SENSOR META */
/* ========================= */

export const getSensorMetaRepo = async (
  sensorId: string
) => {

  const res = await pool.query(
    `
    SELECT 
      id,
      griha_type,
      unit,
      organization_id,
      site_id
    FROM sensors
    WHERE id = $1
    `,
    [sensorId]
  );

  return res.rows[0] || null;
};

/* ========================= */
/* CALCULATED DATA (FINAL) */
/* ========================= */

export const getMonthlyCalculatedValueRepo = async (
  sensorId: string,
  from: string,
  to: string
) => {

  const res = await pool.query(
    `
    SELECT value
    FROM calculated_data
    WHERE sensor_id = $1
    AND timestamp >= $2
    AND timestamp < $3
    ORDER BY timestamp DESC
    LIMIT 1
    `,
    [sensorId, from, to]
  );

  return res.rows[0]?.value ?? null;
};

/* ========================= */
/* RAW READING OLD VERSION */
/* ========================= */

export const getFirstReadingAfterRepo = async (
  sensorId: string,
  timestamp: string
) => {

  const res = await pool.query(
    `
    SELECT value, timestamp_value
    FROM raw_data
    WHERE sensor_id = $1
    AND timestamp_value >= $2
    ORDER BY timestamp_value ASC
    LIMIT 1
    `,
    [sensorId, timestamp]
  );

  return res.rows[0] || null;
};
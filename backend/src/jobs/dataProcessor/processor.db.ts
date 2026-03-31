import { pool } from "../../config/database";

// ---------------- CURSOR ----------------

export const getLastProcessedId = async (): Promise<number> => {
  const res = await pool.query(
    `SELECT last_processed_id FROM processor_state LIMIT 1`
  );
  return res.rows[0]?.last_processed_id || 0;
};

export const updateLastProcessedId = async (id: number): Promise<void> => {
  await pool.query(
    `UPDATE processor_state SET last_processed_id = $1`,
    [id]
  );
};

// ---------------- RAW FETCH ----------------
//  FIX: ORDER BY id ASC (NOT sensor_id)

export const getRawBatch = async (lastId: number, limit = 300) => {
  const res = await pool.query(
    `
    SELECT *
    FROM raw_data
    WHERE id > $1
    ORDER BY id ASC
    LIMIT $2
    `,
    [lastId, limit]
  );

  return res.rows;
};

// ---------------- SENSOR META ----------------

export const getSensorMetaMap = async (sensorIds: string[]) => {
  if (sensorIds.length === 0) return new Map();

  const res = await pool.query(
    `
    SELECT 
      id,
      meter_max_value,
      contract_load AS max_load_kw,
      polling_interval AS logging_interval_seconds
    FROM sensors
    WHERE id = ANY($1)
    `,
    [sensorIds]
  );

  const map = new Map<string, any>();
  res.rows.forEach(row => map.set(row.id, row));
  return map;
};

// ---------------- PREVIOUS VALUES ----------------

export const getPreviousMap = async (sensorIds: string[]) => {
  if (sensorIds.length === 0) return new Map();

  const res = await pool.query(
    `
    SELECT DISTINCT ON (sensor_id)
      sensor_id,
      current_kwh,
      timestamp
    FROM calculated_data
    WHERE sensor_id = ANY($1)
    ORDER BY sensor_id, timestamp DESC
    `,
    [sensorIds]
  );

  const map = new Map<string, any>();
  res.rows.forEach(row => map.set(row.sensor_id, row));
  return map;
};

// ---------------- INSERT ----------------
//  FIX: ON CONFLICT (duplicate protection)

export const insertCalculated = async (rows: any[]) => {
  if (!rows.length) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  let idx = 1;

  for (const r of rows) {
    placeholders.push(
      `($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},
        $${idx++},$${idx++},$${idx++},$${idx++})`
    );

    values.push(
      r.organization_id,
      r.site_id,
      r.sensor_id,
      r.timestamp,
      r.prev,
      r.curr,
      r.consumption,
      r.event,
      r.valid,
      r.gap
    );
  }

  await pool.query(
    `
    INSERT INTO calculated_data
    (organization_id, site_id, sensor_id, timestamp,
     previous_kwh, current_kwh, consumption_kwh,
     event_type, is_valid, gap_minutes)
    VALUES ${placeholders.join(",")}
    ON CONFLICT (sensor_id, timestamp) DO NOTHING
    `,
    values
  );
};
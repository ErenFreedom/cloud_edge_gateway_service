import { pool } from "../../config/database";

//  GET CURSOR
export const getLastProcessedId = async (): Promise<number> => {
  const res = await pool.query(
    `SELECT last_processed_id FROM processor_state LIMIT 1`
  );
  return res.rows[0]?.last_processed_id || 0;
};

//  UPDATE CURSOR
export const updateLastProcessedId = async (id: number): Promise<void> => {
  await pool.query(
    `UPDATE processor_state SET last_processed_id = $1`,
    [id]
  );
};

//  FETCH RAW BATCH (WITH CURSOR)
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

//  FETCH SENSOR METADATA (BATCH)
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

  const map = new Map();

  for (const row of res.rows) {
    map.set(row.id, row);
  }

  return map;
};

//  FETCH PREVIOUS VALUES (BATCH)
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

  const map = new Map();

  for (const row of res.rows) {
    map.set(row.sensor_id, row);
  }

  return map;
};

//  BATCH INSERT
export const insertCalculated = async (rows: any[]) => {
  if (rows.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  let idx = 1;

  for (const row of rows) {
    placeholders.push(
      `($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},
        $${idx++},$${idx++},$${idx++},$${idx++})`
    );

    values.push(
      row.organization_id,
      row.site_id,
      row.sensor_id,
      row.timestamp,
      row.prev,
      row.curr,
      row.consumption,
      row.event,
      row.valid,
      row.gap
    );
  }

  await pool.query(
    `
    INSERT INTO calculated_data
    (organization_id, site_id, sensor_id, timestamp,
     previous_kwh, current_kwh, consumption_kwh,
     event_type, is_valid, gap_minutes)
    VALUES ${placeholders.join(",")}
    `,
    values
  );
};
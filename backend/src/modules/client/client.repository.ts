import { pool } from "../../config/database";

/* ---------------- BUCKET ---------------- */

const getBucketQuery = (interval: string) => {
  switch (interval) {
    case "10m":
      return `
        DATE_TRUNC('minute', cd.timestamp) - 
        INTERVAL '1 minute' * (EXTRACT(minute FROM cd.timestamp)::int % 10)
      `;
    case "1h":
      return `DATE_TRUNC('hour', cd.timestamp)`;
    case "1d":
      return `DATE_TRUNC('day', cd.timestamp)`;
    case "1M":
      return `DATE_TRUNC('month', cd.timestamp)`;
    default:
      throw new Error("Invalid interval");
  }
};

/* ---------------- TOKEN ---------------- */

export const getClientTokenRepo = async (token: string) => {
  const res = await pool.query(
    `
    SELECT organization_id, site_id
    FROM client_tokens
    WHERE token = $1
    LIMIT 1
    `,
    [token]
  );

  return res.rows[0] || null;
};

export const upsertClientTokenRepo = async (
  orgId: string,
  siteId: string,
  token: string,
  sensorIds: string[],
  from: string,
  to: string,
  interval: string
) => {
  await pool.query(
    `
    INSERT INTO client_tokens 
    (organization_id, site_id, token, sensor_ids, from_date, to_date, interval)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (site_id)
    DO UPDATE SET 
      token = EXCLUDED.token,
      sensor_ids = EXCLUDED.sensor_ids,
      from_date = EXCLUDED.from_date,
      to_date = EXCLUDED.to_date,
      interval = EXCLUDED.interval
    `,
    [orgId, siteId, token, sensorIds, from, to, interval]
  );
};
/* ---------------- TIMESERIES ---------------- */

export const getTimeSeriesRepo = async (
  orgId: string,
  siteId: string,
  sensorIds: string[],
  from: string,
  to: string,
  interval: string
) => {

  const bucket = getBucketQuery(interval);

  const res = await pool.query(
    `
    SELECT 
      cd.sensor_id,
      ${bucket} AS bucket,
      MAX(cd.current_kwh) - MIN(cd.previous_kwh) AS consumption
    FROM calculated_data cd
    JOIN sensors s ON s.id = cd.sensor_id
    JOIN sites st ON st.id = s.site_id   -- 🔥 IMPORTANT JOIN
    WHERE cd.organization_id = $1
    AND s.site_id = $2
    AND st.status = 'active'             -- 🔥 CRITICAL CHECK
    AND cd.sensor_id = ANY($3)
    AND cd.timestamp BETWEEN $4 AND $5
    AND cd.is_valid = true
    ${interval === "1d" || interval === "1M"
      ? "AND cd.timestamp < CURRENT_DATE"
      : ""
    }
    GROUP BY cd.sensor_id, bucket
    ORDER BY bucket ASC
    `,
    [orgId, siteId, sensorIds, from, to]
  );

  return res.rows;
};


/* ---------------- DATA RANGE (NEW) ---------------- */

export const getDataRangeRepo = async (
  orgId: string,
  siteId: string
) => {

  const res = await pool.query(
    `
    SELECT 
      MIN(cd.timestamp) AS min_date,
      MAX(cd.timestamp) AS max_date
    FROM calculated_data cd
    JOIN sensors s ON s.id = cd.sensor_id
    JOIN sites st ON st.id = s.site_id
    WHERE cd.organization_id = $1
    AND s.site_id = $2
    AND st.status = 'active'
    `,
    [orgId, siteId]
  );

  return res.rows[0] || null;
};



/* ---------------- SENSOR LIST ---------------- */

export const getSensorsBySiteRepo = async (
  orgId: string,
  siteId: string
) => {

  const res = await pool.query(
    `
    SELECT 
      s.id,
      s.external_sensor_id,
      s.sensor_name,
      s.sensor_location,
      s.api_endpoint,
      s.polling_interval
    FROM sensors s
    JOIN sites st ON st.id = s.site_id
    WHERE s.organization_id = $1
    AND s.site_id = $2
    AND st.status = 'active'   -- 🔥 IMPORTANT
    ORDER BY s.external_sensor_id ASC
    `,
    [orgId, siteId]
  );

  return res.rows;
};
import { pool } from "../../config/database";

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
    WHERE cd.organization_id = $1
    AND s.site_id = $2
    AND cd.sensor_id = ANY($3)
    AND cd.timestamp BETWEEN $4 AND $5
    AND cd.is_valid = true
    ${interval === "1d" || interval === "1M" ? "AND cd.timestamp < CURRENT_DATE" : ""}
    GROUP BY cd.sensor_id, bucket
    ORDER BY bucket ASC
    `,
    [orgId, siteId, sensorIds, from, to]
  );

  return res.rows;
};
import { BigQuery } from "@google-cloud/bigquery";
import { ExportInterval, LoadRange } from "./loadAnalytics.types";

const bigquery = new BigQuery();

const DATASET = "cloud_edge_gateway_master_data";
const LOGICAL_VIEW =
  `project-b5045c0e-60ef-4535-bc3.${DATASET}.iot_raw_logical`;

const getRangeSql = (range: LoadRange) => {
  switch (range) {
    case "10m":
      return "TIMESTAMP_SUB(c.current_timestamp, INTERVAL 10 MINUTE)";
    case "1h":
      return "TIMESTAMP_SUB(c.current_timestamp, INTERVAL 1 HOUR)";
    case "6h":
      return "TIMESTAMP_SUB(c.current_timestamp, INTERVAL 6 HOUR)";
    case "24h":
      return "TIMESTAMP_SUB(c.current_timestamp, INTERVAL 24 HOUR)";
    case "1w":
      return "TIMESTAMP_SUB(c.current_timestamp, INTERVAL 7 DAY)";
    case "1month":
      return "TIMESTAMP_TRUNC(c.current_timestamp, MONTH)";
    default:
      throw new Error("Invalid range");
  }
};

const getBucketSeconds = (interval: ExportInterval) => {
  switch (interval) {
    case "10m":
      return 10 * 60;
    case "1h":
      return 60 * 60;
    case "6h":
      return 6 * 60 * 60;
    case "24h":
      return 24 * 60 * 60;
    case "1w":
      return 7 * 24 * 60 * 60;
    case "1month":
      return null;
    default:
      throw new Error("Invalid interval");
  }
};

export const getCurrentLoadRowsFromBQ = async (
  organizationId: string,
  siteId: string,
  range: LoadRange,
  logicalSensorKey?: string,
  sensorId?: string
) => {
  const previousTargetSql = getRangeSql(range);

  const previousOrder =
    range === "1month"
      ? "b.timestamp_value ASC"
      : "b.timestamp_value DESC";

  const previousCondition =
    range === "1month"
      ? `b.timestamp_value >= ${previousTargetSql}`
      : `b.timestamp_value <= ${previousTargetSql}`;

  const query = `
    WITH base AS (
      SELECT
        organization_id,
        site_id,
        sensor_id,
        sensor_name,
        api_endpoint,
        logical_sensor_key,
        value,
        quality_good,
        timestamp_value
      FROM \`${LOGICAL_VIEW}\`
      WHERE organization_id = @organizationId
        AND site_id = @siteId
        AND value IS NOT NULL
        AND timestamp_value IS NOT NULL
        AND logical_sensor_key IS NOT NULL

        AND (
          @logicalSensorKey = ''
          OR logical_sensor_key = @logicalSensorKey
        )

        AND (
          @sensorId = ''
          OR logical_sensor_key IN (
            SELECT DISTINCT logical_sensor_key
            FROM \`${LOGICAL_VIEW}\`
            WHERE organization_id = @organizationId
              AND site_id = @siteId
              AND sensor_id = @sensorId
              AND logical_sensor_key IS NOT NULL
          )
        )
    ),

    current_rows AS (
      SELECT
        logical_sensor_key,
        sensor_id,
        sensor_name,
        api_endpoint,
        value AS current_reading,
        quality_good AS current_quality_good,
        timestamp_value AS current_timestamp
      FROM base
      QUALIFY ROW_NUMBER() OVER (
        PARTITION BY logical_sensor_key
        ORDER BY timestamp_value DESC
      ) = 1
    ),

    previous_rows AS (
      SELECT
        c.logical_sensor_key,
        b.value AS previous_reading,
        b.timestamp_value AS previous_timestamp
      FROM current_rows c
      JOIN base b
        ON b.logical_sensor_key = c.logical_sensor_key
      WHERE ${previousCondition}
      QUALIFY ROW_NUMBER() OVER (
        PARTITION BY c.logical_sensor_key
        ORDER BY ${previousOrder}
      ) = 1
    )

    SELECT
      c.logical_sensor_key,
      c.sensor_id,
      c.sensor_name,
      c.api_endpoint,

      c.current_timestamp,
      c.current_reading,

      p.previous_timestamp,
      p.previous_reading,

      CASE
        WHEN c.current_reading IS NULL OR p.previous_reading IS NULL THEN NULL
        ELSE c.current_reading - p.previous_reading
      END AS load,

      c.current_quality_good,

CASE
  WHEN c.current_quality_good = FALSE
    THEN 'BAD_QUALITY'

  WHEN c.current_reading IS NULL
    OR p.previous_reading IS NULL
    THEN 'NO_DATA'

  WHEN c.current_reading - p.previous_reading < 0
    THEN 'INVALID_LOAD'

  WHEN c.current_reading - p.previous_reading = 0
    THEN 'NO_CHANGE'

  ELSE 'HEALTHY'
END AS load_status,

CASE
  WHEN c.current_quality_good = FALSE
    THEN FALSE

  WHEN c.current_reading IS NULL
    OR p.previous_reading IS NULL
    THEN FALSE

  WHEN c.current_reading - p.previous_reading < 0
    THEN FALSE

  ELSE TRUE
END AS is_valid_load

    FROM current_rows c
    LEFT JOIN previous_rows p
      ON c.logical_sensor_key = p.logical_sensor_key
    ORDER BY c.sensor_name ASC
  `;

  const [rows] = await bigquery.query({
    query,
    params: {
      organizationId,
      siteId,
      logicalSensorKey: logicalSensorKey || "",
      sensorId: sensorId || "",
    },
  });

  return rows;
};

export const getExportRowsFromBQ = async (
  organizationId: string,
  siteId: string,
  from: string,
  to: string,
  interval: ExportInterval,
  filters: {
    logicalSensorKey?: string;
    sensorId?: string;
    logicalSensorKeys?: string[];
    sensorIds?: string[];
  } = {}
) => {
  const bucketSeconds = getBucketSeconds(interval);

  const bucketExpression =
    interval === "1month"
      ? "TIMESTAMP_TRUNC(timestamp_value, MONTH)"
      : `TIMESTAMP_SECONDS(DIV(UNIX_SECONDS(timestamp_value), ${bucketSeconds}) * ${bucketSeconds})`;

  const query = `
    WITH base AS (
      SELECT
        logical_sensor_key,
        sensor_id,
        sensor_name,
        value,
        timestamp_value,
        ${bucketExpression} AS bucket_timestamp
      FROM \`${LOGICAL_VIEW}\`
      WHERE organization_id = @organizationId
        AND site_id = @siteId

        -- date input is YYYY-MM-DD, so make TO inclusive
        AND timestamp_value >= TIMESTAMP(@from)
        AND timestamp_value < TIMESTAMP_ADD(TIMESTAMP(@to), INTERVAL 1 DAY)

        AND value IS NOT NULL
        AND timestamp_value IS NOT NULL
        AND logical_sensor_key IS NOT NULL

        AND (
          @logicalSensorKey = ''
          OR logical_sensor_key = @logicalSensorKey
        )

        AND (
          ARRAY_LENGTH(@logicalSensorKeys) = 0
          OR logical_sensor_key IN UNNEST(@logicalSensorKeys)
        )

        AND (
          @sensorId = ''
          OR sensor_id = @sensorId
        )

        AND (
          ARRAY_LENGTH(@sensorIds) = 0
          OR sensor_id IN UNNEST(@sensorIds)
        )
    ),

    bucketed AS (
      SELECT
        logical_sensor_key,
        ARRAY_AGG(sensor_name ORDER BY timestamp_value DESC LIMIT 1)[OFFSET(0)] AS sensor_name,
        bucket_timestamp,
        ARRAY_AGG(value ORDER BY timestamp_value DESC LIMIT 1)[OFFSET(0)] AS reading
      FROM base
      GROUP BY logical_sensor_key, bucket_timestamp
    ),

    with_consumption AS (
      SELECT
        logical_sensor_key,
        sensor_name,
        bucket_timestamp,
        reading,
        reading - LAG(reading) OVER (
          PARTITION BY logical_sensor_key
          ORDER BY bucket_timestamp
        ) AS consumption
      FROM bucketed
    )

    SELECT
      FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', bucket_timestamp) AS timestamp,
      sensor_name,
      reading,
      CASE
        WHEN consumption < 0 THEN NULL
        ELSE consumption
      END AS consumption
    FROM with_consumption
    ORDER BY sensor_name ASC, timestamp ASC
  `;

  const [rows] = await bigquery.query({
    query,
    params: {
      organizationId,
      siteId,
      from,
      to,

      logicalSensorKey: filters.logicalSensorKey || "",
      sensorId: filters.sensorId || "",

      logicalSensorKeys: filters.logicalSensorKeys || [],
      sensorIds: filters.sensorIds || [],
    },
    types: {
      logicalSensorKeys: ["STRING"],
      sensorIds: ["STRING"],
    },
  });

  return rows;
};
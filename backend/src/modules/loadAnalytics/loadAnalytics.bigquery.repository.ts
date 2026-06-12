import { BigQuery } from "@google-cloud/bigquery";
import { ExportInterval, LoadRange } from "./loadAnalytics.types";

const bigquery = new BigQuery();

const DATASET = "cloud_edge_gateway_master_data";
const LOGICAL_VIEW =
  `project-b5045c0e-60ef-4535-bc3.${DATASET}.iot_raw_logical`;

const getCurrentWindowSql = (range: LoadRange) => {
  switch (range) {
    case "10m":
      return `
        SELECT
          'ROLLING' AS range_mode,
          CAST(NULL AS TIMESTAMP) AS window_start,
          CAST(NULL AS TIMESTAMP) AS window_end,
          TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 10 MINUTE) AS target_timestamp
      `;

    case "1h":
      return `
        SELECT
          'ROLLING' AS range_mode,
          CAST(NULL AS TIMESTAMP) AS window_start,
          CAST(NULL AS TIMESTAMP) AS window_end,
          TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR) AS target_timestamp
      `;

    case "6h":
      return `
        SELECT
          'ROLLING' AS range_mode,
          CAST(NULL AS TIMESTAMP) AS window_start,
          CAST(NULL AS TIMESTAMP) AS window_end,
          TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 6 HOUR) AS target_timestamp
      `;

    case "24h":
      return `
        SELECT
          'PERIOD' AS range_mode,
          TIMESTAMP_TRUNC(TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY), DAY, 'Asia/Kolkata') AS window_start,
          TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), DAY, 'Asia/Kolkata') AS window_end,
          CAST(NULL AS TIMESTAMP) AS target_timestamp
      `;

    case "1w":
      return `
        SELECT
          'PERIOD' AS range_mode,
          TIMESTAMP_SUB(
            TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), WEEK(MONDAY), 'Asia/Kolkata'),
            INTERVAL 7 DAY
          ) AS window_start,
          TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), WEEK(MONDAY), 'Asia/Kolkata') AS window_end,
          CAST(NULL AS TIMESTAMP) AS target_timestamp
      `;

    case "1month":
  return `
    SELECT
      'PERIOD' AS range_mode,

      TIMESTAMP(
        DATETIME_TRUNC(
          CURRENT_DATETIME('Asia/Kolkata'),
          MONTH
        ),
        'Asia/Kolkata'
      ) AS window_start,

      CURRENT_TIMESTAMP() AS window_end,

      CAST(NULL AS TIMESTAMP) AS target_timestamp
  `;

case "lastMonth":
  return `
    SELECT
      'PERIOD' AS range_mode,

      TIMESTAMP(
        DATETIME_SUB(
          DATETIME_TRUNC(
            CURRENT_DATETIME('Asia/Kolkata'),
            MONTH
          ),
          INTERVAL 1 MONTH
        ),
        'Asia/Kolkata'
      ) AS window_start,

      TIMESTAMP(
        DATETIME_TRUNC(
          CURRENT_DATETIME('Asia/Kolkata'),
          MONTH
        ),
        'Asia/Kolkata'
      ) AS window_end,

      CAST(NULL AS TIMESTAMP) AS target_timestamp
  `;

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
  const windowSql = getCurrentWindowSql(range);

  const query = `
    WITH config AS (
      ${windowSql}
    ),

    base AS (
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
        b.logical_sensor_key,
        b.sensor_id,
        b.sensor_name,
        b.api_endpoint,
        b.value AS current_reading,
        b.quality_good AS current_quality_good,
        b.timestamp_value AS current_timestamp,
        c.range_mode,
        c.window_start,
        c.window_end
      FROM base b
      CROSS JOIN config c
      WHERE
        c.range_mode = 'ROLLING'
        OR (
          c.range_mode = 'PERIOD'
          AND b.timestamp_value >= c.window_start
          AND b.timestamp_value < c.window_end
        )
      QUALIFY ROW_NUMBER() OVER (
        PARTITION BY b.logical_sensor_key
        ORDER BY b.timestamp_value DESC
      ) = 1
    ),

    previous_rows AS (
      SELECT
        cr.logical_sensor_key,
        b.value AS previous_reading,
        b.quality_good AS previous_quality_good,
        b.timestamp_value AS previous_timestamp
      FROM current_rows cr
      JOIN base b
        ON b.logical_sensor_key = cr.logical_sensor_key
      CROSS JOIN config c
      WHERE
        (
          c.range_mode = 'ROLLING'
          AND b.timestamp_value <= c.target_timestamp
        )
        OR
        (
          c.range_mode = 'PERIOD'
          AND b.timestamp_value >= c.window_start
          AND b.timestamp_value < c.window_end
        )
      QUALIFY ROW_NUMBER() OVER (
        PARTITION BY cr.logical_sensor_key
        ORDER BY
          IF(c.range_mode = 'ROLLING', b.timestamp_value, NULL) DESC,
          IF(c.range_mode = 'PERIOD', b.timestamp_value, NULL) ASC
      ) = 1
    )

    SELECT
      c.logical_sensor_key,
      c.sensor_id,
      c.sensor_name,
      c.api_endpoint,

      c.range_mode,
      c.window_start,
      c.window_end,

      c.current_timestamp,
      c.current_reading,
      c.current_quality_good,

      p.previous_timestamp,
      p.previous_reading,
      p.previous_quality_good,

      CASE
        WHEN c.current_reading IS NULL OR p.previous_reading IS NULL THEN NULL
        ELSE c.current_reading - p.previous_reading
      END AS load,

      CASE
        WHEN c.current_quality_good = FALSE
          OR p.previous_quality_good = FALSE
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
          OR p.previous_quality_good = FALSE
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
          @logicalSensorKeysCsv = ''
          OR logical_sensor_key IN UNNEST(SPLIT(@logicalSensorKeysCsv, ','))
        )

        AND (
          @sensorId = ''
          OR sensor_id = @sensorId
        )

        AND (
          @sensorIdsCsv = ''
          OR sensor_id IN UNNEST(SPLIT(@sensorIdsCsv, ','))
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

      logicalSensorKeysCsv: (filters.logicalSensorKeys || []).join(","),
      sensorIdsCsv: (filters.sensorIds || []).join(","),
    },
  });

  return rows;
};


export const getLiveSensorRowsFromBQ = async (
  organizationId: string,
  siteId: string,
  logicalSensorKey?: string,
  sensorId?: string
) => {
  const query = `
    WITH ranked AS (
      SELECT
        logical_sensor_key,
        sensor_id,
        sensor_name,
        api_endpoint,
        value,
        quality_good,
        timestamp_value,

        ROW_NUMBER() OVER (
          PARTITION BY logical_sensor_key
          ORDER BY timestamp_value DESC
        ) AS rn

      FROM \`${LOGICAL_VIEW}\`
      WHERE organization_id = @organizationId
        AND site_id = @siteId
        AND logical_sensor_key IS NOT NULL
        AND timestamp_value IS NOT NULL

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

    latest AS (
      SELECT *
      FROM ranked
      WHERE rn = 1
    ),

    previous AS (
      SELECT *
      FROM ranked
      WHERE rn = 2
    )

    SELECT
      l.logical_sensor_key,
      l.sensor_id,
      l.sensor_name,
      l.api_endpoint,

      l.value AS live_value,
      p.value AS last_value,

      CASE
        WHEN l.value IS NULL OR p.value IS NULL THEN NULL
        ELSE l.value - p.value
      END AS change_value,

      l.quality_good,
      FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', l.timestamp_value) AS last_updated_on,

      CASE
        WHEN l.quality_good = FALSE THEN 'BAD_QUALITY'

        WHEN l.value IS NULL THEN 'NO_DATA'

        WHEN p.value IS NULL THEN 'NO_DATA'

        WHEN l.value - p.value < 0 THEN 'INVALID_CHANGE'

        WHEN l.value - p.value = 0 THEN 'NO_CHANGE'

        ELSE 'HEALTHY'
      END AS live_status

    FROM latest l
    LEFT JOIN previous p
      ON l.logical_sensor_key = p.logical_sensor_key

    ORDER BY l.sensor_name ASC
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
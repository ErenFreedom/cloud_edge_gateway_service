import { BigQuery } from "@google-cloud/bigquery";
import {
  CurrentLoadAnalyticsRow,
  DashboardSensorFilterOptions,
  ExportInterval,
  ExportRow,
  LiveSensorRow,
  LoadRange,
} from "./siteMonitorLoadAnalytics.types";

const bigquery = new BigQuery();

const DATASET = "cloud_edge_gateway_master_data";

const LOGICAL_VIEW =
  `project-b5045c0e-60ef-4535-bc3.${DATASET}.iot_raw_logical`;

const IST_TIMEZONE = "Asia/Kolkata";

const getCurrentWindowSql = (range: LoadRange): string => {
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

          TIMESTAMP(
            DATETIME_SUB(
              DATETIME_TRUNC(CURRENT_DATETIME('${IST_TIMEZONE}'), DAY),
              INTERVAL 1 DAY
            ),
            '${IST_TIMEZONE}'
          ) AS window_start,

          TIMESTAMP(
            DATETIME_TRUNC(CURRENT_DATETIME('${IST_TIMEZONE}'), DAY),
            '${IST_TIMEZONE}'
          ) AS window_end,

          CAST(NULL AS TIMESTAMP) AS target_timestamp
      `;

    case "today":
      return `
        SELECT
          'PERIOD' AS range_mode,

          TIMESTAMP(
            DATETIME_TRUNC(
              CURRENT_DATETIME('${IST_TIMEZONE}'),
              DAY
            ),
            '${IST_TIMEZONE}'
          ) AS window_start,

          CURRENT_TIMESTAMP() AS window_end,

          CAST(NULL AS TIMESTAMP) AS target_timestamp
      `;

    case "1w":
      return `
        SELECT
          'PERIOD' AS range_mode,

          TIMESTAMP_SUB(
            TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), WEEK(MONDAY), '${IST_TIMEZONE}'),
            INTERVAL 7 DAY
          ) AS window_start,

          TIMESTAMP_TRUNC(
            CURRENT_TIMESTAMP(),
            WEEK(MONDAY),
            '${IST_TIMEZONE}'
          ) AS window_end,

          CAST(NULL AS TIMESTAMP) AS target_timestamp
      `;

    case "1month":
      return `
        SELECT
          'PERIOD' AS range_mode,

          TIMESTAMP(
            DATETIME_TRUNC(
              CURRENT_DATETIME('${IST_TIMEZONE}'),
              MONTH
            ),
            '${IST_TIMEZONE}'
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
                CURRENT_DATETIME('${IST_TIMEZONE}'),
                MONTH
              ),
              INTERVAL 1 MONTH
            ),
            '${IST_TIMEZONE}'
          ) AS window_start,

          TIMESTAMP(
            DATETIME_TRUNC(
              CURRENT_DATETIME('${IST_TIMEZONE}'),
              MONTH
            ),
            '${IST_TIMEZONE}'
          ) AS window_end,

          CAST(NULL AS TIMESTAMP) AS target_timestamp
      `;

    default:
      throw new Error("Invalid range");
  }
};

const getBucketExpression = (interval: ExportInterval): string => {
  switch (interval) {
    case "10m":
      return `
        TIMESTAMP_SECONDS(
          DIV(UNIX_SECONDS(timestamp_value), 600) * 600
        )
      `;

    case "1h":
      return `
        TIMESTAMP_SECONDS(
          DIV(UNIX_SECONDS(timestamp_value), 3600) * 3600
        )
      `;

    case "6h":
      return `
        TIMESTAMP_SECONDS(
          DIV(UNIX_SECONDS(timestamp_value), 21600) * 21600
        )
      `;

    case "24h":
      return `
        TIMESTAMP_TRUNC(timestamp_value, DAY, '${IST_TIMEZONE}')
      `;

    case "1w":
      return `
        TIMESTAMP_TRUNC(timestamp_value, WEEK(MONDAY), '${IST_TIMEZONE}')
      `;

    case "1month":
    case "lastMonth":
      return `
        TIMESTAMP_TRUNC(timestamp_value, MONTH, '${IST_TIMEZONE}')
      `;

    default:
      throw new Error("Invalid interval");
  }
};

const buildFilterParams = (filters: DashboardSensorFilterOptions = {}) => {
  return {
    logicalSensorKey: filters.logicalSensorKey || "",
    sensorId: filters.sensorId || "",
    logicalSensorKeysCsv: (filters.logicalSensorKeys || []).join(","),
    sensorIdsCsv: (filters.sensorIds || []).join(","),
  };
};

export const getCurrentLoadRowsFromBQ = async (
  organizationId: string,
  siteId: string,
  range: LoadRange,
  filters: DashboardSensorFilterOptions = {}
): Promise<CurrentLoadAnalyticsRow[]> => {
  const windowSql = getCurrentWindowSql(range);

  const query = `
    WITH config AS (
      ${windowSql}
    ),

    base AS (
      SELECT
        CAST(organization_id AS STRING) AS organization_id,
        CAST(site_id AS STRING) AS site_id,
        CAST(sensor_id AS STRING) AS sensor_id,
        sensor_name,
        api_endpoint,
        logical_sensor_key,
        SAFE_CAST(value AS FLOAT64) AS value,
        quality_good,
        timestamp_value
      FROM \`${LOGICAL_VIEW}\`
      WHERE CAST(organization_id AS STRING) = @organizationId
        AND CAST(site_id AS STRING) = @siteId
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
          OR CAST(sensor_id AS STRING) = @sensorId
        )

        AND (
          @sensorIdsCsv = ''
          OR CAST(sensor_id AS STRING) IN UNNEST(SPLIT(@sensorIdsCsv, ','))
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

      FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', c.current_timestamp) AS current_timestamp,
      c.current_reading,
      c.current_quality_good,

      FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', p.previous_timestamp) AS previous_timestamp,
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
      ...buildFilterParams(filters),
    },
  });

  return rows as CurrentLoadAnalyticsRow[];
};

export const getLiveSensorRowsFromBQ = async (
  organizationId: string,
  siteId: string,
  filters: DashboardSensorFilterOptions = {}
): Promise<LiveSensorRow[]> => {
  const query = `
    WITH ranked AS (
      SELECT
        logical_sensor_key,
        CAST(sensor_id AS STRING) AS sensor_id,
        sensor_name,
        api_endpoint,
        SAFE_CAST(value AS FLOAT64) AS value,
        quality_good,
        timestamp_value,

        ROW_NUMBER() OVER (
          PARTITION BY logical_sensor_key
          ORDER BY timestamp_value DESC
        ) AS rn

      FROM \`${LOGICAL_VIEW}\`
      WHERE CAST(organization_id AS STRING) = @organizationId
        AND CAST(site_id AS STRING) = @siteId
        AND logical_sensor_key IS NOT NULL
        AND timestamp_value IS NOT NULL

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
          OR CAST(sensor_id AS STRING) = @sensorId
        )

        AND (
          @sensorIdsCsv = ''
          OR CAST(sensor_id AS STRING) IN UNNEST(SPLIT(@sensorIdsCsv, ','))
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
      ...buildFilterParams(filters),
    },
  });

  return rows as LiveSensorRow[];
};

export const getExportRowsFromBQ = async (
  organizationId: string,
  siteId: string,
  from: string,
  to: string,
  interval: ExportInterval,
  filters: DashboardSensorFilterOptions = {}
): Promise<ExportRow[]> => {
  const bucketExpression = getBucketExpression(interval);

  const query = `
    WITH base AS (
      SELECT
        logical_sensor_key,
        CAST(sensor_id AS STRING) AS sensor_id,
        sensor_name,
        SAFE_CAST(value AS FLOAT64) AS value,
        timestamp_value,
        ${bucketExpression} AS bucket_timestamp
      FROM \`${LOGICAL_VIEW}\`
      WHERE CAST(organization_id AS STRING) = @organizationId
        AND CAST(site_id AS STRING) = @siteId
        AND timestamp_value >= TIMESTAMP(@from)
        AND timestamp_value < TIMESTAMP(@to)
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
          OR CAST(sensor_id AS STRING) = @sensorId
        )

        AND (
          @sensorIdsCsv = ''
          OR CAST(sensor_id AS STRING) IN UNNEST(SPLIT(@sensorIdsCsv, ','))
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
      ...buildFilterParams(filters),
    },
  });

  return rows as ExportRow[];
};
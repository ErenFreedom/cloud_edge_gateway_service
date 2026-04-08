import { pool } from "../../config/database";
import {
  getTimeSeriesRepo,
  upsertClientTokenRepo,
  getSensorsBySiteRepo,
  getClientConfigRepo,
  saveClientConfigRepo,
  getDataRangeRepo,
  getTimeSeriesBigQueryRepo
} from "./client.repository";

import dayjs from "dayjs";
import crypto from "crypto";

const BATCH_SIZE = 1000;

/* =========================================================
    GENERATE CLIENT TOKEN (SUPER ADMIN)
========================================================= */

export const generateClientTokenService = async (
  admin: any,
  body: any
) => {

  const { site_id, sensor_ids, from, to, interval } = body;

  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  if (!sensor_ids || sensor_ids.length === 0) {
    throw new Error("Select sensors");
  }

  // VALIDATE SITE
  const siteCheck = await pool.query(
    `
    SELECT id FROM sites
    WHERE id = $1
    AND organization_id = $2
    AND status = 'active'
    LIMIT 1
    `,
    [site_id, admin.organizationId]
  );

  if (siteCheck.rows.length === 0) {
    throw new Error("Site not active or invalid");
  }

  const token = crypto.randomBytes(32).toString("hex");

  await upsertClientTokenRepo(
    admin.organizationId,
    site_id,
    token,
    sensor_ids,
    from,
    to,
    interval
  );

  return {
    message: "Token generated",
    token
  };
};


export const getClientConfigService = async (admin: any, siteId: string) => {

  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  const config = await getClientConfigRepo(
    admin.organizationId,
    siteId
  );

  const range = await getDataRangeRepo(
    admin.organizationId,
    siteId
  );

  return {
    config: config || null,
    min_date: range?.min_date || null,
    max_date: range?.max_date || null
  };
};


export const saveClientConfigService = async (
  admin: any,
  body: any
) => {

  const { site_id, sensor_ids, from, to, interval } = body;

  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  if (!sensor_ids || sensor_ids.length === 0) {
    throw new Error("Select sensors");
  }

  /* ===== VALIDATE SITE ===== */

  const siteCheck = await pool.query(
    `
    SELECT id FROM sites
    WHERE id = $1
    AND organization_id = $2
    AND status = 'active'
    LIMIT 1
    `,
    [site_id, admin.organizationId]
  );

  if (siteCheck.rows.length === 0) {
    throw new Error("Invalid site");
  }

  /* ===== GET DATA RANGE ===== */

  const range = await getDataRangeRepo(
    admin.organizationId,
    site_id
  );

  const minDate = dayjs(range?.min_date);
  const maxDate = dayjs(range?.max_date);

  /* ===== PARSE INPUT (FIXED) ===== */

  let fromDate = dayjs(from).startOf("day");   // 🔥 FIX
  let toDate = dayjs(to).endOf("day");         // 🔥 FIX

  /* ===== AUTO CORRECT ===== */

  // Clamp FROM to available data
  if (fromDate.isBefore(minDate)) {
    fromDate = minDate;
  }

  // 🔥 CRITICAL FIX (you were missing this)
  if (toDate.isBefore(minDate)) {
    toDate = minDate;
  }

  // Safe window for live intervals
  const safeNow = dayjs().subtract(2, "hour");

  if (toDate.isAfter(safeNow)) {
    toDate = safeNow;
  }

  // Clamp TO to max available data
  if (toDate.isAfter(maxDate)) {
    toDate = maxDate;
  }

  /* ===== FINAL VALIDATION ===== */

  if (fromDate.isAfter(toDate)) {
    throw new Error("Invalid range");
  }

  /* ===== SAVE ===== */

  await saveClientConfigRepo(
    admin.organizationId,
    site_id,
    sensor_ids,
    fromDate.toISOString(),
    toDate.toISOString(),
    interval
  );

  return {
    message: "Configuration saved",
    config: {
      sensor_ids,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      interval
    }
  };
};


export const getSensorsService = async (
  admin: any,
  siteId: string
) => {

  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  const sensors = await getSensorsBySiteRepo(
    admin.organizationId,
    siteId
  );

  return {
    total: sensors.length,
    sensors
  };
};

export const getTimeSeriesService = async (client: any) => {

  /* ============================= */
  /* FETCH CONFIG */
  /* ============================= */

  const configRes = await pool.query(
    `
    SELECT sensor_ids, from_date, to_date, interval
    FROM client_tokens
    WHERE token = $1
    AND is_active = true
    LIMIT 1
    `,
    [client.token]
  );

  const config = configRes.rows[0];

  if (!config) {
    throw new Error("No configuration found for this token");
  }

  const sensorIds = config.sensor_ids;
  const interval = config.interval;

  if (!sensorIds || sensorIds.length === 0) {
    throw new Error("No sensors configured");
  }

  let from = dayjs(config.from_date);

  /* ============================= */
  /* FETCH DATA RANGE */
  /* ============================= */

  const range = await getDataRangeRepo(
    client.organization_id,
    client.site_id
  );

  const minDate = range?.min_date;
  const maxDate = range?.max_date;

  if (!minDate || !maxDate) {
    return {
      config: null,
      min_date: null,
      max_date: null,
      total: 0,
      batch_size: BATCH_SIZE,
      total_batches: 0,
      batches: []
    };
  }

  /* ============================= */
  /* CLAMP FROM */
  /* ============================= */

  if (from.isBefore(dayjs(minDate))) {
    from = dayjs(minDate);
  }

  /* ============================= */
  /* DETERMINE TO BASED ON INTERVAL */
  /* ============================= */

  let to: any;

  const now = dayjs();

  if (interval === "10m" || interval === "1h") {
    // live but safe
    to = now.subtract(2, "hour");
  }

  else if (interval === "1d") {
    // exclude today
    to = now.startOf("day");
  }

  else if (interval === "1w") {
    to = now.startOf("day");
  }

  else if (["1M", "3M", "6M", "1Y"].includes(interval)) {
    // historical queries → BigQuery
    to = now.startOf("day");
  }

  else {
    throw new Error("Invalid interval");
  }

  /* ============================= */
  /* FINAL CLAMP WITH MAX DATA */
  /* ============================= */

  if (to.isAfter(dayjs(maxDate))) {
    to = dayjs(maxDate);
  }

  if (from.isAfter(to)) {
    throw new Error("Invalid date range");
  }

  /* ============================= */
  /* FETCH TIMESERIES */
  /* ============================= */

  let rows;

  const BIGQUERY_INTERVALS = ["1M", "3M", "6M", "1Y"];

  if (BIGQUERY_INTERVALS.includes(interval)) {
    console.log("📊 Using BigQuery");

    rows = await getTimeSeriesBigQueryRepo(
      client.organization_id,
      client.site_id,
      sensorIds,
      from.toISOString(),
      to.toISOString(),
      interval
    );

  } else {
    console.log("⚡ Using Cloud SQL");

    rows = await getTimeSeriesRepo(
      client.organization_id,
      client.site_id,
      sensorIds,
      from.toISOString(),
      to.toISOString(),
      interval
    );
  }

  const sensorsMeta = await getSensorsBySiteRepo(
    client.organization_id,
    client.site_id
  );

  //  Convert to map for fast lookup
  const sensorMetaMap: any = {};

  for (const s of sensorsMeta) {
    sensorMetaMap[s.id] = s;
  }

  /* ============================= */
  /* EMPTY CASE */
  /* ============================= */

  if (!rows || rows.length === 0) {
    return {
      config: {
        from: from.toISOString(),
        to: to.toISOString(),
        interval,
        sensors: sensorIds.length
      },
      min_date: minDate,
      max_date: maxDate,
      total: 0,
      batch_size: BATCH_SIZE,
      total_batches: 0,
      batches: []
    };
  }

  /* ============================= */
  /* GROUP BY SENSOR */
  /* ============================= */

  const grouped: any = {};

  for (const r of rows) {
    if (!grouped[r.sensor_id]) {
      grouped[r.sensor_id] = [];
    }

    grouped[r.sensor_id].push({
      date: dayjs(r.bucket).toISOString(),
      value: Number(r.consumption ?? 0)
    });
  }

  const formatted = Object.keys(grouped).map(sensorId => {

    const meta = sensorMetaMap[sensorId];

    return {
      sensorId,
      external_sensor_id: meta?.external_sensor_id || null,
      sensor_name: meta?.sensor_name || null,
      sensor_location: meta?.sensor_location || null,
      api_endpoint: meta?.api_endpoint || null,
      polling_interval: meta?.polling_interval || null,
      data: grouped[sensorId]
    };
  });

  /* ============================= */
  /* BATCHING */
  /* ============================= */

  const batches: any[] = [];

  for (let i = 0; i < formatted.length; i += BATCH_SIZE) {
    batches.push(formatted.slice(i, i + BATCH_SIZE));
  }

  /* ============================= */
  /* FINAL RESPONSE */
  /* ============================= */

  return {
    config: {
      from: from.toISOString(),
      to: to.toISOString(),
      interval,
      sensors: sensorIds.length
    },
    min_date: minDate,
    max_date: maxDate,
    total: formatted.length,
    batch_size: BATCH_SIZE,
    total_batches: batches.length,
    batches
  };
};
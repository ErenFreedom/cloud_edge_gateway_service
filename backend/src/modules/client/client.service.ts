import { pool } from "../../config/database";
import {
  getTimeSeriesRepo,
  upsertClientTokenRepo,
  getSensorsBySiteRepo,
  getDataRangeRepo
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
  /* FETCH CONFIG FROM TOKEN TABLE */
  /* ============================= */

  const configRes = await pool.query(
    `
    SELECT sensor_ids, from_date, to_date, interval
    FROM client_tokens
    WHERE token = $1
    LIMIT 1
    `,
    [client.token]
  );

  const config = configRes.rows[0];

  /* ============================= */
  /* CONFIG VALIDATION */
  /* ============================= */

  if (!config) {
    throw new Error("No configuration found for this token");
  }

  const sensorIds = config.sensor_ids;
  const interval = config.interval;   // ✅ FIXED POSITION

  let from = dayjs(config.from_date);
  let to = dayjs(); // default now

  if (!sensorIds || sensorIds.length === 0) {
    throw new Error("No sensors configured for this token");
  }

  if (!from || !interval) {
    throw new Error("Invalid token configuration");
  }

  /* ============================= */
  /* INTERVAL BASED WINDOW */
  /* ============================= */

  if (interval === "10m" || interval === "1h") {
    to = dayjs(); // live till now
  }

  if (interval === "1d") {
    to = dayjs().startOf("day"); // exclude today
  }

  if (interval === "1M") {
    to = dayjs().startOf("month"); // exclude current month
  }

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
      config: {
        from: from.toISOString(),
        to: to.toISOString(),
        interval,
        sensors: sensorIds.length
      },
      min_date: null,
      max_date: null,
      total: 0,
      batch_size: BATCH_SIZE,
      total_batches: 0,
      batches: []
    };
  }

  /* ============================= */
  /* VALIDATION */
  /* ============================= */

  if (from.isBefore(dayjs(minDate))) {
    throw new Error(
      `Configured start date is before available data (${dayjs(minDate).format("DD/MM/YYYY")})`
    );
  }

  if (to.isAfter(dayjs(maxDate))) {
    throw new Error(
      `Configured end date exceeds available data (${dayjs(maxDate).format("DD/MM/YYYY")})`
    );
  }

  if (from.isAfter(to)) {
    throw new Error("Invalid configured date range");
  }

  const diffDays = to.diff(from, "day");

  if (diffDays > 365) {
    throw new Error("Date range too large (max 1 year)");
  }

  /* ============================= */
  /* FETCH TIMESERIES */
  /* ============================= */

  const rows = await getTimeSeriesRepo(
    client.organization_id,
    client.site_id,
    sensorIds,
    from.toISOString(),   // ✅ FIXED
    to.toISOString(),     // ✅ FIXED
    interval
  );

  /* ============================= */
  /* EMPTY RESPONSE */
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
  /* FORMAT */
  /* ============================= */

  const formatted = rows.map((r: any) => ({
    sensorid: r.sensor_id,
    timeSeries: {
      date: dayjs(r.bucket).format("DD/MM/YYYY"),
      value: String(r.consumption ?? 0)
    }
  }));

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
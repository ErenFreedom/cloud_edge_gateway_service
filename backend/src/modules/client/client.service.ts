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

  const { site_id } = body;

  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  //  VALIDATE SITE (ORG + ACTIVE)
  const siteCheck = await pool.query(
    `
    SELECT id
    FROM sites
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

  //  GENERATE TOKEN
  const token = crypto.randomBytes(32).toString("hex");

  await upsertClientTokenRepo(
    admin.organizationId,
    site_id,
    token
  );

  return {
    message: "Token generated",
    token
  };
};


/* =========================================================
   GET SENSORS FOR CLIENT (TOKEN BASED)
========================================================= */

export const getSensorsService = async (client: any) => {

  const sensors = await getSensorsBySiteRepo(
    client.organization_id,
    client.site_id
  );

  return {
    total: sensors.length,
    sensors
  };
};

/* =========================================================
   TIMESERIES SERVICE (UPDATED)
========================================================= */

export const getTimeSeriesService = async (
  client: any,
  body: any
) => {

  const { from, to, interval } = body;

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

  if (dayjs(from).isBefore(dayjs(minDate))) {
    throw new Error(
      `Data available only after ${dayjs(minDate).format("DD/MM/YYYY")}`
    );
  }

  if (dayjs(to).isAfter(dayjs(maxDate))) {
    throw new Error(
      `Data available only till ${dayjs(maxDate).format("DD/MM/YYYY")}`
    );
  }

  if (dayjs(from).isAfter(dayjs(to))) {
    throw new Error("Invalid date range");
  }

  /* ============================= */
  /* FETCH DATA */
  /* ============================= */

  const rows = await getTimeSeriesRepo(
    client.organization_id,
    client.site_id,
    body.sensor_ids,
    from,
    to,
    interval
  );

  /* ============================= */
  /* EMPTY RESPONSE */
  /* ============================= */

  if (!rows || rows.length === 0) {
    return {
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
    min_date: minDate,
    max_date: maxDate,

    total: formatted.length,
    batch_size: BATCH_SIZE,
    total_batches: batches.length,
    batches
  };
};
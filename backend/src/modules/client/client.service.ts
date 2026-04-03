import { pool } from "../../config/database";
import {
  getTimeSeriesRepo,
  upsertClientTokenRepo
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

  if (!admin.organization_id) {
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
    [site_id, admin.organization_id]
  );

  if (siteCheck.rows.length === 0) {
    throw new Error("Site not active or invalid");
  }

  //  GENERATE TOKEN
  const token = crypto.randomBytes(32).toString("hex");

  await upsertClientTokenRepo(
    admin.organization_id,
    site_id,
    token
  );

  return {
    message: "Token generated",
    token
  };
};

/* =========================================================
   TIMESERIES SERVICE
========================================================= */

export const getTimeSeriesService = async (
  client: any,
  body: any
) => {

  const rows = await getTimeSeriesRepo(
    client.organization_id,
    client.site_id,
    body.sensor_ids,
    body.from,
    body.to,
    body.interval
  );

  //  SAFE EMPTY RESPONSE (IMPORTANT)
  if (!rows || rows.length === 0) {
    return {
      total: 0,
      batch_size: BATCH_SIZE,
      total_batches: 0,
      batches: []
    };
  }

  //  MAP TO FINAL FORMAT
  const formatted = rows.map((r: any) => ({
    sensorid: r.sensor_id,
    timeSeries: {
      date: dayjs(r.bucket).format("DD/MM/YYYY"),
      value: String(r.consumption ?? 0)
    }
  }));

  //  CREATE BATCHES
  const batches: any[] = [];

  for (let i = 0; i < formatted.length; i += BATCH_SIZE) {
    batches.push(formatted.slice(i, i + BATCH_SIZE));
  }

  //  FINAL RESPONSE
  return {
    total: formatted.length,
    batch_size: BATCH_SIZE,
    total_batches: batches.length,
    batches
  };
};
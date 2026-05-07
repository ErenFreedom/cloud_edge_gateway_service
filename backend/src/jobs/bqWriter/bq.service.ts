import { bigquery } from "./bq.client";
import { ProcessedRow } from "../mqttIngestion/mqtt.types";
import { BigQueryRawRow } from "./bq.types";

const DATASET = "cloud_edge_gateway_master_data";
const RAW_TABLE = "iot_raw_fixed";

const isUUID = (val: string) =>
  /^[0-9a-f-]{36}$/i.test(val);

export const insertRawToBigQuery = async (
  rows: ProcessedRow[]
) => {

  if (!rows.length) return;

  const formatted: BigQueryRawRow[] = rows.map((row) => ({

    organization_id: row.organization_id ?? null,
    site_id: row.site_id ?? null,

    sensor_id: row.uuid ?? null,

    external_id:
      row.external_id !== undefined && row.external_id !== null
        ? String(row.external_id)
        : null,

    topic: row.topic,

    // 💥 CRITICAL FIX
    payload:
      typeof row.payload === "string"
        ? row.payload
        : JSON.stringify(row.payload),

    device: row.device ?? null,
    location: row.location ?? null,

    // 🔥 DO NOT sanitize aggressively
    value:
      typeof row.value === "number" && isFinite(row.value)
        ? row.value
        : null,

    quality: row.quality ?? null,
    quality_good: row.quality_good ?? null,

    timestamp_value: row.timestamp ?? null,
    created_at: new Date(),
  }));
//test
  try {
    await bigquery
      .dataset(DATASET)
      .table(RAW_TABLE)
      .insert(formatted);

    console.log(`✅ BQ RAW inserted ${formatted.length}`);

  } catch (err: any) {
    console.error("❌ BQ RAW insert failed:", err?.errors || err);
  }
};
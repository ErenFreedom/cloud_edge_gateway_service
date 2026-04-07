import { bigquery } from "./bq.client";
import { ProcessedRow } from "../mqttIngestion/mqtt.types";
import { BigQueryRawRow } from "./bq.types";

const DATASET = "cloud_edge_gateway_master_data";
const RAW_TABLE = "iot_raw";

/* ============================= */
/* RAW DATA INSERT */
/* ============================= */

export const insertRawToBigQuery = async (
  rows: ProcessedRow[]
) => {

  if (rows.length === 0) return;

  const formatted: BigQueryRawRow[] = rows.map((row) => ({
    organization_id: row.organization_id,
    site_id: row.site_id,

    sensor_id: row.sensor_id ? String(row.sensor_id) : null,

    topic: row.topic,
    payload: JSON.stringify(row.payload),

    device: row.device,
    location: row.location,
    value: row.value,

    quality: row.quality,
    quality_good: row.quality_good,

    timestamp_value: row.timestamp,
    created_at: new Date(),
  }));

  try {
    await bigquery
      .dataset(DATASET)
      .table(RAW_TABLE)
      .insert(formatted);

    console.log(`📊 BQ RAW inserted ${formatted.length}`);

  } catch (err: any) {
    console.error("❌ BQ RAW insert failed:", err?.errors || err);
  }
};
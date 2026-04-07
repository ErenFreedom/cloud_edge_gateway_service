import { bigquery } from "./bq.client";
import { BigQueryCalculatedRow } from "./bq.calculated.types";

const DATASET = "cloud_edge_gateway_master_data";
const CALC_TABLE = "iot_calculated";

/* ============================= */
/* CALCULATED INSERT */
/* ============================= */

export const insertCalculatedToBigQuery = async (
  rows: any[]
) => {

  if (!rows.length) return;

  const formatted: BigQueryCalculatedRow[] = rows.map((r) => ({
    organization_id: r.organization_id,
    site_id: r.site_id,

    // (UUID string)
    sensor_id: r.sensor_id ? String(r.sensor_id) : null,

    timestamp: r.timestamp,

    previous_kwh: r.prev,
    current_kwh: r.curr,
    consumption_kwh: r.consumption,

    event_type: r.event,
    is_valid: r.valid,
    gap_minutes: r.gap,

    created_at: new Date(),
    processed_at: new Date(),
  }));

  try {
    await bigquery
      .dataset(DATASET)
      .table(CALC_TABLE)
      .insert(formatted);

    console.log(`📊 BQ CALCULATED inserted ${formatted.length}`);

  } catch (err: any) {
    console.error("❌ BQ CALC insert failed:", err?.errors || err);
  }
};
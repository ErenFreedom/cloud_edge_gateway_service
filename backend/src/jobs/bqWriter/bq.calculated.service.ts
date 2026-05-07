import { bigquery } from "./bq.client";
import { BigQueryCalculatedRow } from "./bq.calculated.types";

const DATASET = "cloud_edge_gateway_master_data";
const CALC_TABLE = "iot_calculated_fixed";

const isUUID = (val: string) =>
  /^[0-9a-f-]{36}$/i.test(val);

/* ========================= */
/* 🔧 ROUNDING FIX (CRITICAL) */
/* ========================= */
const round = (val: number | null | undefined, decimals = 6): number => {
  if (val === null || val === undefined) return 0;
  if (!isFinite(val)) return 0;

  return Number(val.toFixed(decimals));
};

export const insertCalculatedToBigQuery = async (
  rows: any[]
) => {

  if (!rows.length) return;

  const formatted: BigQueryCalculatedRow[] = rows.map((r) => ({

    organization_id: r.organization_id ?? null,
    site_id: r.site_id ?? null,

    sensor_id:
      r.uuid && isUUID(r.uuid)
        ? r.uuid
        : null,

    external_id:
      r.external_id !== null && r.external_id !== undefined
        ? String(r.external_id)
        : null,

    timestamp: r.timestamp ?? null,

    /* 🔥 FIXED NUMBERS (IMPORTANT) */
    previous_kwh: round(r.prev),
    current_kwh: round(r.curr),
    consumption_kwh: round(r.consumption),

    event_type: r.event ?? "unknown",
    is_valid: r.valid ?? false,
    gap_minutes: round(r.gap),

    created_at: new Date(),
    processed_at: new Date(),
  }));

  try {
    await bigquery
      .dataset(DATASET)
      .table(CALC_TABLE)
      .insert(formatted);

    console.log(`✅ BQ CALCULATED inserted ${formatted.length}`);

  } catch (err: any) {
    console.error("❌ BQ CALC insert failed:", err?.errors || err);
  }
};
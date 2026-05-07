import { bigquery } from "./bq.client";
import { BigQueryCalculatedRow } from "./bq.calculated.types";

const DATASET = "cloud_edge_gateway_master_data";
const CALC_TABLE = "iot_calculated_fixed";

const isUUID = (val: string) =>
  /^[0-9a-f-]{36}$/i.test(val);

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

    previous_kwh: r.prev ?? 0,
    current_kwh: r.curr ?? 0,
    consumption_kwh: r.consumption ?? 0,

    event_type: r.event ?? "unknown",
    is_valid: r.valid ?? false,
    gap_minutes: r.gap ?? 0,

    created_at: new Date(),
    processed_at: new Date(),
  }));

  try {
    await bigquery
      .dataset(DATASET)
      .table(CALC_TABLE)
      .insert(formatted);

    console.log(`BQ CALCULATED inserted ${formatted.length}`);

  } catch (err: any) {
    console.error("BQ CALC insert failed:", err?.errors || err);
  }
};
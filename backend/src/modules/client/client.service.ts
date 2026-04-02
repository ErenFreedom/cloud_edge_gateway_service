import { getTimeSeriesRepo } from "./client.repository";
import dayjs from "dayjs";

const BATCH_SIZE = 1000;

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

  //  FINAL RESPONSE STRUCTURE
  return {
    total: formatted.length,
    batch_size: BATCH_SIZE,
    total_batches: batches.length,
    batches
  };
};
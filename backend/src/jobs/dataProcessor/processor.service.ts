import {
  getRawBatch,
  getSensorMetaMap,
  getPreviousMap,
  insertCalculated,
  getLastProcessedId,
  updateLastProcessedId
} from "./processor.db";

import { calculateConsumption } from "./processor.utils";

export const processBatch = async (): Promise<number> => {

  const lastId = await getLastProcessedId();

  const rawRows = await getRawBatch(lastId, 300);

  if (rawRows.length === 0) return 0;

  //  extract unique sensors
  const sensorIds = [
    ...new Set(rawRows.map(r => r.sensor_id))
  ];

  //  batch fetch
  const metaMap = await getSensorMetaMap(sensorIds);
  const prevMap = await getPreviousMap(sensorIds);

  const resultRows: any[] = [];

  for (const row of rawRows) {

    const prevRow = prevMap.get(row.sensor_id);
    const meta = metaMap.get(row.sensor_id);

    if (!meta) continue;

    if (!prevRow) {
      resultRows.push({
        organization_id: row.organization_id,
        site_id: row.site_id,
        sensor_id: row.sensor_id,
        timestamp: row.timestamp_value,
        prev: row.value,
        curr: row.value,
        consumption: 0,
        event: "OK",
        valid: true,
        gap: 0
      });
      continue;
    }

    const gapMinutes =
      (new Date(row.timestamp_value).getTime() -
        new Date(prevRow.timestamp).getTime()) / 60000;

    const calc = calculateConsumption(
      prevRow.current_kwh,
      row.value,
      gapMinutes,
      meta.max_load_kw,
      meta.logging_interval_seconds,
      meta.meter_max_value
    );

    resultRows.push({
      organization_id: row.organization_id,
      site_id: row.site_id,
      sensor_id: row.sensor_id,
      timestamp: row.timestamp_value,
      prev: prevRow.current_kwh,
      curr: row.value,
      consumption: calc.consumption,
      event: calc.event,
      valid: calc.valid,
      gap: gapMinutes
    });
  }

  await insertCalculated(resultRows);

  //  update cursor
  const newLastId = rawRows[rawRows.length - 1].id;
  await updateLastProcessedId(newLastId);

  console.log(`✅ Processed ${resultRows.length} rows`);

  return resultRows.length;
};
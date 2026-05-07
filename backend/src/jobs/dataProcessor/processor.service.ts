import {
  getRawBatch,
  getSensorMetaMap,
  getPreviousMap,
  insertCalculated,
  getLastProcessedId,
  updateLastProcessedId
} from "./processor.db";

import { insertCalculatedToBigQuery } from "../bqWriter/bq.calculated.service";
import { calculateConsumption } from "./processor.utils";
import { getOrCreateSensorUUID } from "../mqttIngestion/mqtt.db";

/* ========================= */
/* 🔧 SAFE NUMBER (BQ FIX) */
/* ========================= */

const safeNumber = (val: number) => {
  if (!isFinite(val)) return 0;
  if (Math.abs(val) < 1e-10) return 0;
  return val;
};

/* ========================= */
/* 🚀 MAIN PROCESSOR */
/* ========================= */

export const processBatch = async (): Promise<number> => {

  const lastId = await getLastProcessedId();
  const rawRows = await getRawBatch(lastId, 300);

  if (!rawRows.length) {
    console.log("No data, sleeping...");
    return 0;
  }

  // ---------------- GROUP BY SENSOR ----------------
  const grouped = new Map<string, any[]>();

  for (const row of rawRows) {
    if (!grouped.has(row.sensor_id)) {
      grouped.set(row.sensor_id, []);
    }
    grouped.get(row.sensor_id)!.push(row);
  }

  const sensorIds = [...grouped.keys()];

  const metaMap = await getSensorMetaMap(sensorIds);
  const prevMap = await getPreviousMap(sensorIds);

  const resultRows: any[] = [];

  // ---------------- PROCESS EACH SENSOR ----------------
  for (const [sensorId, rows] of grouped.entries()) {

    const uuid = sensorId; 

    const meta = metaMap.get(sensorId);
    if (!meta) continue;

    // sort per sensor
    rows.sort(
      (a, b) =>
        new Date(a.timestamp_value).getTime() -
        new Date(b.timestamp_value).getTime()
    );

    const prevRow = prevMap.get(sensorId);

    let lastValue = prevRow?.current_kwh ?? undefined;
    let lastTimestamp = prevRow?.timestamp ?? undefined;

    for (const row of rows) {

      let currValue = row.value;

      // ---------------- ZERO HANDLING ----------------
      let isZero = false;

      if (currValue === 0) {
        isZero = true;

        if (lastValue !== undefined) {
          currValue = lastValue;
        } else {
          continue;
        }
      }

      // ---------------- FIRST VALUE ----------------
      if (lastValue === undefined) {

        lastValue = currValue;
        lastTimestamp = row.timestamp_value;

        resultRows.push({
          organization_id: row.organization_id,
          site_id: row.site_id,

          uuid: uuid,                    
          external_id: sensorId,         

          timestamp: row.timestamp_value,

          prev: safeNumber(currValue),
          curr: safeNumber(currValue),
          consumption: 0,

          event: isZero ? "RESET" : "OK",
          valid: !isZero,
          gap: 0
        });

        continue;
      }

      const gapMinutes =
        (new Date(row.timestamp_value).getTime() -
          new Date(lastTimestamp).getTime()) / 60000;

      if (gapMinutes < 0) continue;

      const calc = calculateConsumption(
        lastValue,
        currValue,
        gapMinutes,
        meta.max_load_kw,
        meta.logging_interval_seconds,
        meta.meter_max_value || meta.upper_bound
      );

      const isDuplicate = currValue === lastValue;

      resultRows.push({
        organization_id: row.organization_id,
        site_id: row.site_id,

        uuid: uuid,                  
        external_id: sensorId,         

        timestamp: row.timestamp_value,

        prev: safeNumber(lastValue),
        curr: safeNumber(currValue),
        consumption: safeNumber(isDuplicate ? 0 : calc.consumption),

        event: isZero
          ? "RESET"
          : (isDuplicate ? "OK" : calc.event),

        valid: isZero
          ? false
          : (isDuplicate ? true : calc.valid),

        gap: gapMinutes
      });

      // ---------------- UPDATE STATE ----------------
      lastValue = currValue;
      lastTimestamp = row.timestamp_value;
    }
  }

  if (resultRows.length === 0) {
    console.log("⚠️ No valid rows after processing");
  }

  await insertCalculated(resultRows);

  insertCalculatedToBigQuery(resultRows).catch((err) => {
    console.error("❌ BQ CALC async error:", err);
  });

  // ---------------- UPDATE CURSOR ----------------
  const newLastId = rawRows[rawRows.length - 1].id;
  await updateLastProcessedId(newLastId);

  console.log(`✅ Processed ${resultRows.length} rows`);

  return resultRows.length;
};
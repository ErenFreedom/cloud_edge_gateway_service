import { ExportInterval, LoadRange } from "./loadAnalytics.types";



const LOAD_RANGES: LoadRange[] = ["10m", "1h", "6h", "24h", "1w", "1month", "lastMonth"];
const EXPORT_INTERVALS: ExportInterval[] = ["10m", "1h", "6h", "24h", "1w", "1month"];

export const validateOptionalSensorFilters = (query: any) => {
  return {
    sensorId:
      typeof query.sensor_id === "string" && query.sensor_id.trim()
        ? query.sensor_id.trim()
        : "",

    logicalSensorKey:
      typeof query.logical_sensor_key === "string" && query.logical_sensor_key.trim()
        ? query.logical_sensor_key.trim()
        : "",
  };
};


export const validateSiteId = (siteId: any): string => {
  if (!siteId || typeof siteId !== "string") {
    throw new Error("site_id required");
  }

  return siteId;
};

export const validateLoadRange = (range: any): LoadRange => {
  if (!range || !LOAD_RANGES.includes(range)) {
    throw new Error("Invalid range");
  }

  return range;
};

export const validateExportInterval = (interval: any): ExportInterval => {
  if (!interval || !EXPORT_INTERVALS.includes(interval)) {
    throw new Error("Invalid interval");
  }

  return interval;
};

export const validateDateRange = (from: any, to: any) => {
  if (!from || !to) {
    throw new Error("from and to required");
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("Invalid from/to date");
  }

  if (fromDate >= toDate) {
    throw new Error("from must be before to");
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
};

export const parseCsvParam = (value: any): string[] => {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};
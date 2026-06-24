import {
  AddDashboardSensorRequest,
  DashboardSensorFilterOptions,
  ExportInterval,
  LoadRange,
} from "./siteMonitorLoadAnalytics.types";

import {ExportFormat} from "./siteMonitorLoadAnalytics.types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LOAD_RANGES: readonly LoadRange[] = [
  "10m",
  "1h",
  "6h",
  "today",
  "currentWeek",
  "lastWeek",
  "1month",
  "lastMonth",
];

const EXPORT_INTERVALS: readonly ExportInterval[] = [
  "10m",
  "1h",
  "6h",
  "24h",
  "1w",
  "1month",
  "lastMonth",
];

export const validateUuid = (value: unknown, fieldName: string): string => {
  if (!value || typeof value !== "string") {
    throw new Error(`${fieldName} required`);
  }

  const trimmed = value.trim();

  if (!UUID_REGEX.test(trimmed)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return trimmed;
};

export const validateSiteId = (siteId: unknown): string => {
  return validateUuid(siteId, "site_id");
};

export const validateSensorId = (sensorId: unknown): string => {
  return validateUuid(sensorId, "sensor_id");
};

export const validateLoadRange = (range: unknown): LoadRange => {
  if (!range || typeof range !== "string") {
    throw new Error("range required");
  }

  if (!LOAD_RANGES.includes(range as LoadRange)) {
    throw new Error("Invalid range");
  }

  return range as LoadRange;
};

export const validateExportInterval = (interval: unknown): ExportInterval => {
  if (!interval || typeof interval !== "string") {
    throw new Error("interval required");
  }

  if (!EXPORT_INTERVALS.includes(interval as ExportInterval)) {
    throw new Error("Invalid interval");
  }

  return interval as ExportInterval;
};

export const validateDateRange = (
  from: unknown,
  to: unknown
): { from: string; to: string } => {
  if (!from || !to || typeof from !== "string" || typeof to !== "string") {
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

export const parseCsvParam = (value: unknown): string[] => {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseUuidCsvParam = (
  value: unknown,
  fieldName: string
): string[] => {
  const values = parseCsvParam(value);

  values.forEach((item) => {
    if (!UUID_REGEX.test(item)) {
      throw new Error(`Invalid ${fieldName}`);
    }
  });

  return values;
};

export const validateOptionalSensorFilters = (
  query: Record<string, unknown>
): DashboardSensorFilterOptions => {
  const sensorId =
    typeof query.sensor_id === "string" && query.sensor_id.trim()
      ? validateSensorId(query.sensor_id)
      : undefined;

  const logicalSensorKey =
    typeof query.logical_sensor_key === "string" &&
    query.logical_sensor_key.trim()
      ? query.logical_sensor_key.trim()
      : undefined;

  const sensorIds = parseUuidCsvParam(query.sensor_ids, "sensor_ids");

  const logicalSensorKeys = parseCsvParam(query.logical_sensor_keys);

  return {
    sensorId,
    logicalSensorKey,
    sensorIds,
    logicalSensorKeys,
  };
};

export const validateAddDashboardSensorBody = (
  body: unknown
): AddDashboardSensorRequest => {
  if (!body || typeof body !== "object") {
    throw new Error("Request body required");
  }

  const typedBody = body as Record<string, unknown>;

  return {
    sensor_id: validateSensorId(typedBody.sensor_id),
  };
};

export const validatePaginationQuery = (
  query: Record<string, unknown>
): { limit: number; offset: number } => {
  const rawLimit = Number(query.limit ?? 100);
  const rawOffset = Number(query.offset ?? 0);

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), 500)
      : 100;

  const offset =
    Number.isFinite(rawOffset) && rawOffset >= 0
      ? Math.floor(rawOffset)
      : 0;

  return {
    limit,
    offset,
  };
};

export const validateSearchQuery = (
  query: Record<string, unknown>
): string | undefined => {
  if (typeof query.search !== "string") {
    return undefined;
  }

  const search = query.search.trim();

  if (!search) {
    return undefined;
  }

  if (search.length > 100) {
    throw new Error("search is too long");
  }

  return search;
};


export const validateExportFormat = (
  value: unknown
): ExportFormat => {
  if (!value || typeof value !== "string") {
    return "json";
  }

  const format = value.trim().toLowerCase();

  if (format === "csv") {
    return "csv";
  }

  if (format === "json") {
    return "json";
  }

  throw new Error("Invalid export format");
};
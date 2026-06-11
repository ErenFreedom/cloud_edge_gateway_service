export type LoadRange = "10m" | "1h" | "6h" | "24h" | "1w" | "1month" | "lastMonth";

export type ExportInterval = "10m" | "1h" | "6h" | "24h" | "1w" | "1month" | "lastMonth";

export interface LoadAnalyticsRow {
  logical_sensor_key: string;
  sensor_id: string | null;
  sensor_name: string | null;
  api_endpoint: string | null;

  current_timestamp: string | null;
  current_reading: number | null;

  previous_timestamp: string | null;
  previous_reading: number | null;

  load: number | null;
  is_valid_load: boolean;
}

export interface ExportRow {
  logical_sensor_key: string;
  sensor_id: string | null;
  sensor_name: string | null;
  bucket_timestamp: string;
  reading: number | null;
  consumption: number | null;
}

export interface ExportFilterOptions {
  logicalSensorKey?: string;
  sensorId?: string;

  logicalSensorKeys?: string[];
  sensorIds?: string[];
}
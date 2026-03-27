export interface RawRow {
  id: number;
  organization_id: string;
  site_id: string;
  sensor_id: string;

  value: number; // cumulative kWh
  timestamp_value: Date;
}

export interface SensorMeta {
  meter_max_value: number | null;
  max_load_kw: number | null;
  logging_interval_seconds: number | null;
}

export type EventType =
  | "OK"
  | "RESET"
  | "SPIKE"
  | "ROLLOVER"
  | "COMM_LOSS";
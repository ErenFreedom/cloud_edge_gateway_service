export interface SensorPayload {
  client_id: string;
  site_id: string;
  sensor_id: number;

  device: string;
  location: string;
  value: number;

  quality: string;
  quality_good: boolean;
  timestamp: string;

  sensor_name?: string;
  api_endpoint?: string;
  polling_interval?: number;

  upper_bound?: number;
  meter_max_value?: number;
  max_load_kw?: number;

  // 👇 IMPORTANT (coworker sending this)
  api_url?: string;
}

/* ✅ CLEAN METADATA TYPE */
export interface SensorMetadata {
  sensor_name?: string;
  sensor_location?: string;
  api_endpoint?: string;
  polling_interval?: number;
  upper_bound?: number;
  meter_max_value?: number;
  max_load_kw?: number;
}

export interface ProcessedRow {
  topic: string;
  payload: SensorPayload;

  organization_id: string | null;
  site_id: string | null;
  sensor_id: number | null;

  device: string | null;
  location: string | null;
  value: number | null;

  quality: string | null;
  quality_good: boolean | null;

  timestamp: Date | null;

  metadata?: SensorMetadata;
}
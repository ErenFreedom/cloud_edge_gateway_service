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
}
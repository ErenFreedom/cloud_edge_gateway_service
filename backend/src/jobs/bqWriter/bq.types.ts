export interface BigQueryRawRow {
  organization_id: string | null;
  site_id: string | null;
  sensor_id: string | null; 

  topic: string;
  payload: string;

  device: string | null;
  location: string | null;
  value: number | null;

  quality: string | null;
  quality_good: boolean | null;

  timestamp_value: Date | null;
  created_at: Date;
}
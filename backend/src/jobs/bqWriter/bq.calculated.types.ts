export interface BigQueryCalculatedRow {
  organization_id: string | null;
  site_id: string | null;
  sensor_id: string | null;

  timestamp: Date | null;

  previous_kwh: number;
  current_kwh: number;
  consumption_kwh: number;

  event_type: string;
  is_valid: boolean;
  gap_minutes: number;

  created_at: Date;
  processed_at: Date;
}
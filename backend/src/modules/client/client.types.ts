export interface TimeSeriesRequest {
  sensor_ids: string[];
  from: string;
  to: string;
  interval:
  | "10m"
  | "1h"
  | "1d"
  | "1w"
  | "1M"
  | "3M"
  | "6M"
  | "1Y";
}

export interface GenerateTokenRequest {
  site_id: string;
}
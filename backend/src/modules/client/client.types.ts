export interface TimeSeriesRequest {
  sensor_ids: string[];
  from: string;
  to: string;
  interval: "10m" | "1h" | "1d" | "1M";
}

export interface GenerateTokenRequest {
  site_id: string;
}
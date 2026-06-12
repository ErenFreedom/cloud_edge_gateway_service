import { apiClient } from "../api/apiClient";

export type LoadRange =
  | "10m"
  | "1h"
  | "6h"
  | "24h"
  | "1w"
  | "1month"
  | "lastMonth";

export type ExportInterval =
  | "10m"
  | "1h"
  | "6h"
  | "24h"
  | "1w"
  | "1month";

export interface CurrentLoadRequest {
  site_id: string;
  range: LoadRange;

  sensor_id?: string;
  logical_sensor_key?: string;
}

export interface LiveLoadRequest {
  site_id: string;

  sensor_id?: string;
  logical_sensor_key?: string;
}

export interface ExportRequest {
  site_id: string;
  from: string;
  to: string;
  interval: ExportInterval;

  sensor_id?: string;
  logical_sensor_key?: string;

  sensor_ids?: string;
  logical_sensor_keys?: string;
}

export const buildCsvParam = (values: string[]) => {
  return values
    .filter(Boolean)
    .join(",");
};

export const fetchCurrentLoadAnalytics = async (
  payload: CurrentLoadRequest
) => {
  const response = await apiClient.get(
    "/load-analytics/current",
    {
      params: payload,
    }
  );

  return response.data;
};

export const exportLoadAnalyticsCsv = async (
  payload: ExportRequest
) => {
  const response = await apiClient.get(
    "/load-analytics/export",
    {
      params: payload,
      responseType: "blob",
    }
  );

  return response.data;
};


export const fetchLiveLoadAnalytics = async (
  payload: LiveLoadRequest
) => {
  const response = await apiClient.get(
    "/load-analytics/live",
    {
      params: payload,
    }
  );

  return response.data;
};
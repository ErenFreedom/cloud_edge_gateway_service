import { apiClient } from "../api/apiClient";

/* ---------------- TYPES ---------------- */

export interface GenerateTokenPayload {
  site_id: string;
}

export interface TimeSeriesPayload {
  sensor_ids: string[];
  from: string;
  to: string;
  interval: "10m" | "1h" | "1d" | "1M";
}

/* ---------------- API CALLS ---------------- */

//  GENERATE TOKEN
export const generateClientToken = async (
  payload: GenerateTokenPayload
) => {
  const response = await apiClient.post(
    "/client/generate-token",
    payload
  );

  return response.data;
};

//  TIMESERIES EXPORT
export const fetchTimeSeries = async (
  token: string,
  payload: TimeSeriesPayload
) => {

  const response = await apiClient.post(
    "/client/timeseries",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};
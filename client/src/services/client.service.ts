import { apiClient } from "../api/apiClient";

/* ---------------- TYPES ---------------- */

export interface GenerateTokenPayload {
  site_id: string;
  sensor_ids: string[];
  from: string;
  to: string;
  interval: "10m" | "1h" | "1d" | "1M";
}

export interface SaveConfigPayload {
  site_id: string;
  sensor_ids: string[];
  from: string;
  to: string;
  interval: "10m" | "1h" | "1d" | "1M";
}

export interface Sensor {
  id: string;
  external_sensor_id: number;
  sensor_name: string;
  sensor_location: string;
  api_endpoint: string;
  polling_interval: number;
}

export interface ClientConfig {
  sensor_ids: string[];
  from: string;
  to: string;
  interval: "10m" | "1h" | "1d" | "1M";
}

/* ---------------- API CALLS ---------------- */

/* ============================= */
/* GENERATE TOKEN */
/* ============================= */

export const generateClientToken = async (
  payload: GenerateTokenPayload
) => {
  const response = await apiClient.post(
    "/client/generate-token",
    payload
  );

  return response.data;
};

/* ============================= */
/* FETCH SENSORS */
/* ============================= */

export const fetchSensors = async (site_id: string) => {
  const response = await apiClient.get(
    `/client/sensors?site_id=${site_id}`
  );

  return response.data;
};

/* ============================= */
/* FETCH CONFIG */
/* ============================= */

export const fetchConfig = async (site_id: string) => {
  const response = await apiClient.get(
    `/client/config?site_id=${site_id}`
  );

  return response.data;
};

/* ============================= */
/* SAVE CONFIG */
/* ============================= */

export const saveConfig = async (payload: SaveConfigPayload) => {
  const response = await apiClient.post(
    "/client/save-config",
    payload
  );

  return response.data;
};

/* ============================= */
/* TIMESERIES EXPORT (TOKEN BASED) */
/* ============================= */

export const fetchTimeSeries = async (token: string) => {
  const response = await apiClient.post(
    "/client/timeseries",
    {}, // 🔥 EMPTY BODY (CONFIG COMES FROM DB)
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};
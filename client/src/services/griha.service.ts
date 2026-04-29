import { apiClient } from "../api/apiClient";



export interface GrihaSensor {
  id: string;
  sensor_name: string;
  griha_type?: string;
  unit?: string;
}

export interface GrihaConfigPayload {
  site_id: string;
  mapping: Record<string, string>; 
}

export interface GrihaExportResponse {
  project_code: string;
  type: string;
  month: number;
  year: number;
  unit: string;
  total_consumption: number | null;
  from: string;
  to: string;
}

/* ========================= */
/* ADMIN APIs */
/* ========================= */

export const fetchGrihaSensors = async (site_id: string) => {
  const res = await apiClient.get(
    `/griha/sensors?site_id=${site_id}`
  );
  return res.data;
};

export const fetchGrihaConfig = async (site_id: string) => {
  const res = await apiClient.get(
    `/griha/config?site_id=${site_id}`
  );
  return res.data;
};

export const saveGrihaConfig = async (
  payload: GrihaConfigPayload
) => {
  const res = await apiClient.post(
    `/griha/save-config`,
    payload
  );
  return res.data;
};

/* ========================= */
/* CLIENT EXPORT */
/* ========================= */

export const fetchGrihaExport = async (
  token: string,
  sensorId: string,
  month: number,
  year: number
): Promise<GrihaExportResponse> => {

  const res = await apiClient.get(
    `/griha/sensor/${sensorId}?month=${month}&year=${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};
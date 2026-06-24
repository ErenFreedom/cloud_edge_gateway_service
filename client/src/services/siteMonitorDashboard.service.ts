import { apiClient } from "../api/apiClient";

/* ========================= */
/* TYPES */
/* ========================= */

export type DashboardRole =
  | "super_admin"
  | "org_site_manager"
  | "site_admin"
  | "site_monitor";

export type LoadRange =
  | "10m"
  | "1h"
  | "6h"
  | "today"
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
  | "1month"
  | "lastMonth";

export type LoadStatus =
  | "HEALTHY"
  | "BAD_QUALITY"
  | "NO_DATA"
  | "NO_CHANGE"
  | "INVALID_LOAD";

export type LiveStatus =
  | "HEALTHY"
  | "BAD_QUALITY"
  | "NO_DATA"
  | "NO_CHANGE"
  | "INVALID_CHANGE";

export interface SiteMonitorDashboardSite {
  id: string;
  organization_id: string;
  site_name: string;
  site_uuid?: string | null;
  site_code?: string | null;

  phone?: string | null;
  gst_number?: string | null;

  address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  status: string;
  created_at?: string | null;
  activated_at?: string | null;
  updated_at?: string | null;
}

export interface SiteMonitorDashboardSensor {
  id: string; // Cloud SQL sensors.id
  sensor_uuid?: string | null; // BigQuery sensor_id
  bq_sensor_id?: string | null;
  external_sensor_id?: string | null;

  sensor_name: string | null;
  location?: string | null;
  api_endpoint?: string | null;

  organization_id?: string | null;
  site_id: string;

  building_id?: string | null;
  floor_id?: string | null;
  room_id?: string | null;
  component_id?: string | null;

  approval_status?: string | null;
  operational_status?: string | null;

  active?: boolean;
  added_to_dashboard: boolean;
  dashboard_sensor_id?: string | null;
  added_at?: string | null;
  added_by?: string | null;
}

export interface SelectedDashboardSensor {
  id: string; // site_dashboard_sensors.id
  site_id: string;
  sensor_id: string; // Cloud SQL sensors.id

  sensor_uuid?: string | null;
  bq_sensor_id?: string | null;
  external_sensor_id?: string | null;

  added_by: string | null;
  created_at: string;

  sensor_name: string | null;
  api_endpoint: string | null;
  location: string | null;
  operational_status: string | null;
  approval_status: string | null;
}

export interface CurrentLoadAnalyticsRow {
  logical_sensor_key: string;
  sensor_id: string | null; // BigQuery sensor_id = sensor_uuid
  sensor_name: string | null;
  api_endpoint: string | null;

  range_mode?: "ROLLING" | "PERIOD" | string | null;
  window_start?: string | null;
  window_end?: string | null;

  current_timestamp: string | null;
  current_reading: number | null;
  current_quality_good?: boolean | null;

  previous_timestamp: string | null;
  previous_reading: number | null;
  previous_quality_good?: boolean | null;

  load: number | null;
  load_status: LoadStatus;
  is_valid_load: boolean;
}

export interface LiveSensorRow {
  logical_sensor_key: string;
  sensor_id: string | null;
  sensor_name: string | null;
  api_endpoint: string | null;

  live_value: number | null;
  last_value: number | null;
  change_value: number | null;

  quality_good: boolean | null;
  last_updated_on: string | null;

  live_status: LiveStatus;
}

export interface ExportRow {
  timestamp: string;
  sensor_name: string | null;
  reading: number | null;
  consumption: number | null;
}

export interface DashboardSitesResponse {
  sites: SiteMonitorDashboardSite[];
}

export interface DashboardSiteDetailsResponse {
  site: SiteMonitorDashboardSite;
}

export interface DashboardSensorsResponse {
  site_id: string;
  total_sensors: number;
  sensors: SiteMonitorDashboardSensor[];
}

export interface SelectedDashboardSensorsResponse {
  site_id: string;
  total_sensors: number;
  sensors: SelectedDashboardSensor[];
}

export interface CurrentLoadAnalyticsResponse {
  organization_id: string;
  site_id: string;
  range: LoadRange;
  generated_at: string;
  total_sensors: number;
  sensors: CurrentLoadAnalyticsRow[];
}

export interface LiveLoadAnalyticsResponse {
  organization_id: string;
  site_id: string;
  generated_at: string;
  total_sensors: number;
  sensors: LiveSensorRow[];
}

export interface ExportAnalyticsResponse {
  rows: ExportRow[];
  meta: {
    organization_id: string;
    site_id: string;
    from: string;
    to: string;
    interval: ExportInterval;
    generated_at: string;
    total_sensors: number;
    selected_sensor_ids: string[];
  };
}

export interface FetchAvailableSensorsParams {
  siteId: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AddDashboardSensorPayload {
  siteId: string;
  sensor_id: string; // Cloud SQL sensors.id
}

export interface RemoveDashboardSensorPayload {
  siteId: string;
  sensorId: string; // Cloud SQL sensors.id
}

export interface FetchCurrentLoadParams {
  siteId: string;
  range: LoadRange;
}

export interface FetchExportParams {
  siteId: string;
  from: string;
  to: string;
  interval: ExportInterval;
}

export interface DownloadExportCsvParams extends FetchExportParams {
  fileName?: string;
}

/* ========================= */
/* API RESPONSE UNWRAPPER */
/* ========================= */

const unwrapData = <T>(res: any): T => {
  return res.data?.data ?? res.data;
};

/* ========================= */
/* SITE APIs */
/* ========================= */

export const fetchSiteMonitorDashboardSites =
  async (): Promise<DashboardSitesResponse> => {
    const res = await apiClient.get("/site-monitor-dashboard/sites");
    return unwrapData<DashboardSitesResponse>(res);
  };

export const fetchSiteMonitorDashboardSiteDetails = async (
  siteId: string
): Promise<DashboardSiteDetailsResponse> => {
  const res = await apiClient.get(`/site-monitor-dashboard/sites/${siteId}`);
  return unwrapData<DashboardSiteDetailsResponse>(res);
};

/* ========================= */
/* SENSOR APIs */
/* ========================= */

export const fetchAvailableDashboardSensors = async ({
  siteId,
  search,
  limit = 100,
  offset = 0,
}: FetchAvailableSensorsParams): Promise<DashboardSensorsResponse> => {
  const res = await apiClient.get(
    `/site-monitor-dashboard/sites/${siteId}/sensors`,
    {
      params: {
        search,
        limit,
        offset,
      },
    }
  );

  return unwrapData<DashboardSensorsResponse>(res);
};

export const fetchSelectedDashboardSensors = async (
  siteId: string
): Promise<SelectedDashboardSensorsResponse> => {
  const res = await apiClient.get(
    `/site-monitor-dashboard/sites/${siteId}/selected-sensors`
  );

  return unwrapData<SelectedDashboardSensorsResponse>(res);
};

/**
 * Allowed only for super_admin / org_site_manager / site_admin.
 * Backend blocks site_monitor with 403.
 */
export const addDashboardSensor = async ({
  siteId,
  sensor_id,
}: AddDashboardSensorPayload): Promise<{
  message: string;
  sensor: SelectedDashboardSensor;
}> => {
  const res = await apiClient.post(
    `/site-monitor-dashboard/sites/${siteId}/selected-sensors`,
    {
      sensor_id,
    }
  );

  return unwrapData<{
    message: string;
    sensor: SelectedDashboardSensor;
  }>(res);
};

/**
 * Allowed only for super_admin / org_site_manager / site_admin.
 * Backend blocks site_monitor with 403.
 */
export const removeDashboardSensor = async ({
  siteId,
  sensorId,
}: RemoveDashboardSensorPayload): Promise<{
  message: string;
  removed: boolean;
}> => {
  const res = await apiClient.delete(
    `/site-monitor-dashboard/sites/${siteId}/selected-sensors/${sensorId}`
  );

  return unwrapData<{
    message: string;
    removed: boolean;
  }>(res);
};

/* ========================= */
/* ANALYTICS APIs */
/* ========================= */

export const fetchDashboardCurrentLoad = async ({
  siteId,
  range,
}: FetchCurrentLoadParams): Promise<CurrentLoadAnalyticsResponse> => {
  const res = await apiClient.get(
    `/site-monitor-dashboard/sites/${siteId}/load`,
    {
      params: {
        range,
      },
    }
  );

  return unwrapData<CurrentLoadAnalyticsResponse>(res);
};

export const fetchDashboardLiveLoad = async (
  siteId: string
): Promise<LiveLoadAnalyticsResponse> => {
  const res = await apiClient.get(
    `/site-monitor-dashboard/sites/${siteId}/live`
  );

  return unwrapData<LiveLoadAnalyticsResponse>(res);
};

export const fetchDashboardExport = async ({
  siteId,
  from,
  to,
  interval,
}: FetchExportParams): Promise<ExportAnalyticsResponse> => {
  const res = await apiClient.get(
    `/site-monitor-dashboard/sites/${siteId}/export`,
    {
      params: {
        from,
        to,
        interval,
        format: "json",
      },
    }
  );

  return unwrapData<ExportAnalyticsResponse>(res);
};

/* ========================= */
/* CSV DOWNLOAD */
/* ========================= */

const getFileNameFromContentDisposition = (
  contentDisposition?: string
): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || null;
};

const triggerBrowserDownload = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

export const downloadDashboardExportCsv = async ({
  siteId,
  from,
  to,
  interval,
  fileName,
}: DownloadExportCsvParams): Promise<void> => {
  const res = await apiClient.get(
    `/site-monitor-dashboard/sites/${siteId}/export`,
    {
      params: {
        from,
        to,
        interval,
        format: "csv",
      },
      responseType: "blob",
    }
  );

  const blob = new Blob([res.data], {
    type: "text/csv;charset=utf-8",
  });

  const backendFileName = getFileNameFromContentDisposition(
    res.headers?.["content-disposition"]
  );

  triggerBrowserDownload(
    blob,
    fileName ||
      backendFileName ||
      `site-dashboard-${siteId}-${from}-${to}-${interval}.csv`
  );
};
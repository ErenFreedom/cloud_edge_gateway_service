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

export interface AuthenticatedDashboardUser {
  id?: string;
  userId?: string;
  user_id?: string;

  role?: string;

  organizationId?: string;
  organization_id?: string;

  email?: string;
  full_name?: string;
}

export interface DashboardSite {
  id: string;
  organization_id: string;
  site_name: string;
  site_uuid: string | null;
  site_code?: string | null;

  phone?: string | null;
  gst_number?: string | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  status: string;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
}

export interface DashboardSensor {
  id: string;
  sensor_id?: string | null;
  sensor_name: string | null;
  api_endpoint?: string | null;
  location?: string | null;

  organization_id?: string | null;
  site_id: string;

  building_id?: string | null;
  floor_id?: string | null;
  room_id?: string | null;
  component_id?: string | null;

  approval_status?: string | null;
  operational_status?: string | null;

  added_to_dashboard: boolean;
  dashboard_sensor_id?: string | null;
  added_at?: Date | string | null;
  added_by?: string | null;
}

export interface SelectedDashboardSensor {
  id: string;
  site_id: string;
  sensor_id: string; // Cloud SQL sensors.id

  sensor_uuid?: string | null;
  bq_sensor_id?: string | null; // same as sensor_uuid
  external_sensor_id?: string | null;

  added_by: string | null;
  created_at: Date | string;

  sensor_name: string | null;
  api_endpoint: string | null;
  location: string | null;
  operational_status: string | null;
  approval_status: string | null;
}


export interface AddDashboardSensorRequest {
  sensor_id: string;
}

export interface DashboardSensorFilterOptions {
  sensorId?: string;
  logicalSensorKey?: string;
  sensorIds?: string[];
  logicalSensorKeys?: string[];
}

export interface CurrentLoadAnalyticsRow {
  logical_sensor_key: string;
  sensor_id: string | null;
  sensor_name: string | null;
  api_endpoint: string | null;

  range_mode?: "ROLLING" | "PERIOD" | string | null;
  window_start?: Date | string | null;
  window_end?: Date | string | null;

  current_timestamp: Date | string | null;
  current_reading: number | null;
  current_quality_good?: boolean | null;

  previous_timestamp: Date | string | null;
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
  last_updated_on: string | Date | null;

  live_status: LiveStatus;
}

export interface ExportRow {
  timestamp: string;
  sensor_name: string | null;
  reading: number | null;
  consumption: number | null;
}

export interface DashboardSitesResponse {
  sites: DashboardSite[];
}

export interface DashboardSiteDetailsResponse {
  site: DashboardSite;
}

export interface DashboardSensorsResponse {
  site_id: string;
  total_sensors: number;
  sensors: DashboardSensor[];
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


export type DashboardWriteRole =
  | "super_admin"
  | "org_site_manager"
  | "site_admin";

export type ExportFormat = "json" | "csv";
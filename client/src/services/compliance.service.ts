import { apiClient } from "../api/apiClient";

/* ========================= */
/* TYPES */
/* ========================= */

export interface ComplianceReportType {
  id?: string;
  value: string;
  label: string;
  description?: string;
  active?: boolean;
}

export interface ComplianceSiteConfigResponse {
  organization_id: string;
  site_id: string;
  total: number;
  sensors: ComplianceSensorConfigItem[];
}

export interface ComplianceSensor {
  id: string;
  sensor_name: string;
  site_id?: string;
  sensor_location?: string;
  external_sensor_id?: string;
  unit?: string;
}

export interface ComplianceSensorConfigItem {
  sensor_id: string;
  report_type: string;
  category: string;
  display_name: string;
  unit: string;
  sort_order?: number;
  active?: boolean;
  description?: string | null;
  metadata?: any;
}

export interface MultiComplianceConfigPayload {
  site_id: string;
  sensors: ComplianceSensorConfigItem[];
}

export interface CreateComplianceReportTypePayload {
  report_type: string;
  display_name: string;
  description?: string | null;
  active?: boolean;
}

export interface ComplianceExportParams {
  token: string;
  reportType: string;
  category: string;
  month: number;
  year: number;
}

export interface ComplianceExportResponse {
  project_code?: string;
  report_type: string;
  category?: string;
  month: number;
  year: number;
  generated_at?: string;
  sensor?: any;
  sensors?: any[];
}

/* ========================= */
/* ADMIN REPORT TYPES */
/* ========================= */

export const fetchComplianceReportTypes = async (): Promise<
  ComplianceReportType[]
> => {
  const res = await apiClient.get("/compliance/report-types");

  return res.data.map((item: any) => ({
    id: item.id || item.report_type,
    value: item.report_type,
    label: item.display_name,
    description: item.description,
    active: item.active
  }));
};

export const createComplianceReportType = async (
  payload: CreateComplianceReportTypePayload
) => {
  const res = await apiClient.post("/compliance/report-types", payload);
  return res.data;
};

/* ========================= */
/* ADMIN CONFIG */
/* ========================= */

/**
 * Save per-sensor compliance config.
 *
 * Backend route:
 * POST /api/compliance/config/multi
 */

export const fetchComplianceConfigForSite = async (
  siteId: string
): Promise<ComplianceSiteConfigResponse> => {
  const res = await apiClient.get(`/compliance/config/site/${siteId}`);
  return res.data;
};


export const saveMultiComplianceConfig = async (
  payload: MultiComplianceConfigPayload
) => {
  const res = await apiClient.post("/compliance/config/multi", payload);
  return res.data;
};

/**
 * Optional old route support.
 * Keep this only if you still want to fetch config report-type-wise.
 *
 * Backend route:
 * GET /api/compliance/config/:reportType?site_id=...
 */
export const fetchComplianceConfigByReportType = async (
  site_id: string,
  report_type: string
) => {
  const res = await apiClient.get(
    `/compliance/config/${report_type}?site_id=${site_id}`
  );
  return res.data;
};

/* ========================= */
/* CLIENT EXPORT APIs */
/* ========================= */

/**
 * Category-wise export:
 * GET /api/compliance/reports/:reportType/:category
 */
export const fetchComplianceCategoryExport = async ({
  token,
  reportType,
  category,
  month,
  year,
}: ComplianceExportParams): Promise<ComplianceExportResponse> => {
  const res = await apiClient.get(
    `/compliance/reports/${reportType}/${category}?month=${month}&year=${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

/**
 * Full monthly report export:
 * GET /api/compliance/reports/:reportType
 */
export const fetchComplianceMonthlyReport = async ({
  token,
  reportType,
  month,
  year,
}: Omit<ComplianceExportParams, "category">): Promise<ComplianceExportResponse> => {
  const res = await apiClient.get(
    `/compliance/reports/${reportType}?month=${month}&year=${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};
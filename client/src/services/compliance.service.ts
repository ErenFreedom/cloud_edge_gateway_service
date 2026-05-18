import { apiClient } from "../api/apiClient";

/* ========================= */
/* TYPES */
/* ========================= */

export interface ComplianceReportType {
  id?: string;
  value: string;
  label: string;
  description?: string;

  types?: {
    value: string;
    label: string;
  }[];
}

export interface ComplianceSensor {
  id: string;
  sensor_name: string;
  site_id?: string;
  compliance_type?: string;
  unit?: string;
}

export interface ComplianceConfigPayload {
  site_id: string;
  report_type: string;
  mapping: Record<
    string,
    {
      type: string;
      unit: string;
    }
  >;
}

export interface ComplianceExportParams {
  token: string;
  reportType: string;
  sensorId?: string;
  complianceType?: string;
  month: number;
  year: number;
}

export interface ComplianceExportResponse {
  report_type: string;
  project_code?: string;
  type?: string;
  sensor_id?: string;
  month: number;
  year: number;
  unit?: string;
  total_consumption?: number | null;
  from?: string;
  to?: string;
  data?: any;
}

/* ========================= */
/* ADMIN APIs */
/* ========================= */

export const fetchComplianceReportTypes = async (): Promise<
  ComplianceReportType[]
> => {
  const res = await apiClient.get("/compliance/report-types");

  return res.data.map((item: any) => ({
    id: item.id || item.report_type,
    value: item.report_type,
    label: item.display_name,
    description: item.description
  }));
};

export const fetchComplianceSensors = async (
  site_id: string,
  report_type: string
): Promise<ComplianceSensor[]> => {
  const res = await apiClient.get(
    `/compliance/sensors?site_id=${site_id}&report_type=${report_type}`
  );
  return res.data;
};

export const fetchComplianceConfig = async (
  site_id: string,
  report_type: string
) => {
  const res = await apiClient.get(
    `/compliance/config?site_id=${site_id}&report_type=${report_type}`
  );
  return res.data;
};

export const saveComplianceConfig = async (
  payload: ComplianceConfigPayload
) => {
  const res = await apiClient.post("/compliance/save-config", payload);
  return res.data;
};

/* ========================= */
/* CLIENT EXPORT APIs */
/* ========================= */

export const fetchComplianceSensorExport = async ({
  token,
  reportType,
  sensorId,
  month,
  year,
}: ComplianceExportParams): Promise<ComplianceExportResponse> => {
  const res = await apiClient.get(
    `/compliance/${reportType}/sensor/${sensorId}?month=${month}&year=${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

export const fetchComplianceTypeExport = async ({
  token,
  reportType,
  complianceType,
  month,
  year,
}: ComplianceExportParams): Promise<ComplianceExportResponse> => {
  const res = await apiClient.get(
    `/compliance/${reportType}/${complianceType}?month=${month}&year=${year}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};
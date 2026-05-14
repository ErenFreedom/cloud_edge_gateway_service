export interface ComplianceReportRow {
  report_type: string;

  category: string;
  display_name: string;

  unit: string;

  year: number;
  month: number;

  opening_value: number | null;
  closing_value: number | null;

  auto_consumption: number | null;
  final_consumption: number | null;

  variance: number | null;

  calculation_source: string | null;

  sample_count: number | null;

  has_reliable_snapshot: boolean;

  correction_reason: string | null;
}

export interface ComplianceReportResponse {
  project_code: string;

  report_type: string;

  month: number;
  year: number;

  generated_at: string;

  sensors: ComplianceReportRow[];
}

export interface ComplianceReportType {
  report_type: string;
  display_name: string;
  description: string | null;
  active: boolean;
}

export interface ComplianceReportCategory {
  report_type: string;

  category: string;

  display_name: string;

  unit: string;

  active: boolean;
}
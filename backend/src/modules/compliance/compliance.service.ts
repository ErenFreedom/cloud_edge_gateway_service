import {
  getMonthlyReportRowsFromBQ,
  getReportTypesFromBQ,
  upsertReportTypeToBQ,
  getReportCategoriesFromBQ,
  upsertReportCategoryToBQ,
  getReportSensorConfigFromBQ,
  upsertReportSensorConfigToBQ,
  getMonthlyCategoryReportRowFromBQ,
  getAllReportSensorConfigsForSiteFromBQ
} from "./compliance.bigquery.repository";

import {
  validateClientAccess,
  validateMonthYear,
  validateReportType,
  validateRequiredString
} from "./compliance.validator";

import {
  ComplianceReportResponse,
  ComplianceReportRow
} from "./compliance.types";

export const getMonthlyComplianceReportService = async (
  client: any,
  reportType: string,
  month: number,
  year: number
): Promise<ComplianceReportResponse> => {
  validateClientAccess(client);
  validateReportType(reportType);
  validateMonthYear(month, year);

  const rows = await getMonthlyReportRowsFromBQ(
    client.organization_id,
    client.site_id,
    reportType,
    month,
    year
  ) as ComplianceReportRow[];

  return {
    project_code: client.site_id,
    report_type: reportType,
    month,
    year,
    generated_at: new Date().toISOString(),
    sensors: rows
  };
};

export const getComplianceReportTypesService = async () => {
  return await getReportTypesFromBQ();
};

export const saveComplianceReportTypeService = async (
  body: any
) => {
  const {
    report_type,
    display_name,
    description = null,
    active = true
  } = body;

  validateReportType(report_type);

  if (!display_name) {
    throw new Error("display_name required");
  }

  await upsertReportTypeToBQ(
    report_type,
    display_name,
    description,
    active
  );

  return { message: "Report type saved" };
};

export const getComplianceReportCategoriesService = async (
  reportType: string
) => {
  validateReportType(reportType);
  return await getReportCategoriesFromBQ(reportType);
};

export const saveComplianceReportCategoryService = async (
  body: any
) => {
  const {
    report_type,
    category,
    display_name,
    unit,
    active = true
  } = body;

  validateReportType(report_type);

  if (!category) throw new Error("category required");
  if (!display_name) throw new Error("display_name required");
  if (!unit) throw new Error("unit required");

  await upsertReportCategoryToBQ(
    report_type,
    category,
    display_name,
    unit,
    active
  );

  return { message: "Report category saved" };
};

export const getComplianceConfigService = async (
  admin: any,
  reportType: string,
  siteId: string
) => {
  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  validateReportType(reportType);

  if (!siteId) {
    throw new Error("site_id required");
  }

  const rows = await getReportSensorConfigFromBQ(
    admin.organizationId,
    siteId,
    reportType
  );

  return {
    organization_id: admin.organizationId,
    site_id: siteId,
    report_type: reportType,
    total: rows.length,
    sensors: rows
  };
};

export const saveComplianceConfigService = async (
  admin: any,
  body: any
) => {
  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  const { site_id, report_type, sensors } = body;

  if (!site_id) throw new Error("site_id required");

  validateReportType(report_type);

  if (!Array.isArray(sensors)) {
    throw new Error("sensors must be an array");
  }

  for (const s of sensors) {
    if (!s.sensor_id) throw new Error("sensor_id required");
    if (!s.category) throw new Error("category required");
    if (!s.display_name) throw new Error("display_name required");
    if (!s.unit) throw new Error("unit required");
  }

  await upsertReportSensorConfigToBQ(
    admin.organizationId,
    site_id,
    report_type,
    sensors
  );

  return {
    message: "Compliance report config saved",
    report_type,
    site_id,
    total: sensors.length
  };
};



export const getMonthlyComplianceCategoryService = async (
  client: any,
  reportType: string,
  category: string,
  month: number,
  year: number
) => {

  validateClientAccess(client);

  validateRequiredString(reportType, "reportType");
  validateRequiredString(category, "category");

  validateMonthYear(month, year);

  const row =
    await getMonthlyCategoryReportRowFromBQ(
      client.organization_id,
      client.site_id,
      reportType,
      category,
      month,
      year
    );

  return {
    project_code: client.site_id,

    report_type: reportType,
    category,

    month,
    year,

    generated_at: new Date().toISOString(),

    sensor: row
  };
};


export const saveMultiComplianceConfigService = async (
  admin: any,
  body: any
) => {
  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  const { site_id, sensors } = body;

  if (!site_id) throw new Error("site_id required");

  if (!Array.isArray(sensors)) {
    throw new Error("sensors must be an array");
  }

  const grouped: Record<string, any[]> = {};

  for (const s of sensors) {
    if (!s.sensor_id) throw new Error("sensor_id required");
    if (!s.report_type) throw new Error("report_type required");
    if (!s.category) throw new Error("category/type required");
    if (!s.display_name) throw new Error("display_name required");
    if (!s.unit) throw new Error("unit required");

    if (!grouped[s.report_type]) {
      grouped[s.report_type] = [];
    }

    grouped[s.report_type].push({
      sensor_id: s.sensor_id,
      category: s.category,
      display_name: s.display_name,
      unit: s.unit,
      sort_order: s.sort_order ?? 999,
      active: s.active ?? true,
      description: s.description ?? null,
      metadata: s.metadata ?? null
    });
  }

  for (const reportType of Object.keys(grouped)) {
    await upsertReportSensorConfigToBQ(
      admin.organizationId,
      site_id,
      reportType,
      grouped[reportType]
    );
  }

  return {
    message: "Multi compliance config saved",
    site_id,
    total: sensors.length,
    report_types: Object.keys(grouped)
  };
};


export const getAllComplianceConfigsForSiteService = async (
  admin: any,
  siteId: string
) => {
  if (!admin.organizationId) {
    throw new Error("Invalid admin");
  }

  if (!siteId) {
    throw new Error("site_id required");
  }

  const rows = await getAllReportSensorConfigsForSiteFromBQ(
    admin.organizationId,
    siteId
  );

  return {
    organization_id: admin.organizationId,
    site_id: siteId,
    total: rows.length,
    sensors: rows
  };
};
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

const PROJECT_ID = "project-b5045c0e-60ef-4535-bc3";
const DATASET = "cloud_edge_gateway_master_data";

export const getMonthlyReportRowsFromBQ = async (
  organizationId: string,
  siteId: string,
  reportType: string,
  month: number,
  year: number
) => {
  const query = `
    SELECT
      report_type, category, display_name, unit, sort_order,
      year, month,
      opening_value, closing_value,
      auto_consumption, final_consumption,
      variance, calculation_source,
      sample_count, has_reliable_snapshot,
      correction_reason
    FROM \`${PROJECT_ID}.${DATASET}.report_monthly_export\`
    WHERE organization_id = @organizationId
      AND site_id = @siteId
      AND report_type = @reportType
      AND year = @year
      AND month = @month
    ORDER BY sort_order ASC
  `;

  const [rows] = await bigquery.query({
    query,
    params: { organizationId, siteId, reportType, month, year }
  });

  return rows;
};

export const getReportTypesFromBQ = async () => {
  const query = `
    SELECT report_type, display_name, description, active
    FROM \`${PROJECT_ID}.${DATASET}.report_types\`
    WHERE active = TRUE
    ORDER BY display_name ASC
  `;

  const [rows] = await bigquery.query({ query });
  return rows;
};

export const upsertReportTypeToBQ = async (
  reportType: string,
  displayName: string,
  description: string | null,
  active: boolean
) => {
  const query = `
    MERGE \`${PROJECT_ID}.${DATASET}.report_types\` T
    USING (
      SELECT
        @reportType AS report_type,
        @displayName AS display_name,
        @description AS description,
        @active AS active
    ) S
    ON T.report_type = S.report_type
    WHEN MATCHED THEN
      UPDATE SET
        display_name = S.display_name,
        description = S.description,
        active = S.active
    WHEN NOT MATCHED THEN
      INSERT (report_type, display_name, description, active, created_at)
      VALUES (S.report_type, S.display_name, S.description, S.active, CURRENT_TIMESTAMP())
  `;

  await bigquery.query({
    query,
    params: { reportType, displayName, description, active }
  });
};

export const getReportCategoriesFromBQ = async (
  reportType: string
) => {
  const query = `
    SELECT report_type, category, display_name, unit, active
    FROM \`${PROJECT_ID}.${DATASET}.report_categories\`
    WHERE report_type = @reportType
      AND active = TRUE
    ORDER BY display_name ASC
  `;

  const [rows] = await bigquery.query({
    query,
    params: { reportType }
  });

  return rows;
};

export const upsertReportCategoryToBQ = async (
  reportType: string,
  category: string,
  displayName: string,
  unit: string,
  active: boolean
) => {
  const query = `
    MERGE \`${PROJECT_ID}.${DATASET}.report_categories\` T
    USING (
      SELECT
        @reportType AS report_type,
        @category AS category,
        @displayName AS display_name,
        @unit AS unit,
        @active AS active
    ) S
    ON T.report_type = S.report_type
    AND T.category = S.category
    WHEN MATCHED THEN
      UPDATE SET
        display_name = S.display_name,
        unit = S.unit,
        active = S.active
    WHEN NOT MATCHED THEN
      INSERT (report_type, category, display_name, unit, active, created_at)
      VALUES (S.report_type, S.category, S.display_name, S.unit, S.active, CURRENT_TIMESTAMP())
  `;

  await bigquery.query({
    query,
    params: { reportType, category, displayName, unit, active }
  });
};

export const getReportSensorConfigFromBQ = async (
  organizationId: string,
  siteId: string,
  reportType: string
) => {
  const query = `
    SELECT
      organization_id,
      site_id,
      report_type,
      sensor_id,
      display_name,
      unit,
      category,
      sort_order,
      active,
      description,
      metadata,
      created_at
    FROM \`${PROJECT_ID}.${DATASET}.report_sensor_config\`
    WHERE organization_id = @organizationId
      AND site_id = @siteId
      AND report_type = @reportType
    ORDER BY sort_order ASC
  `;

  const [rows] = await bigquery.query({
    query,
    params: { organizationId, siteId, reportType }
  });

  return rows;
};

export const upsertReportSensorConfigToBQ = async (
  organizationId: string,
  siteId: string,
  reportType: string,
  sensors: any[]
) => {
  if (!sensors.length) return;

  const rows = sensors.map((s) => ({
    organization_id: organizationId,
    site_id: siteId,
    report_type: reportType,
    sensor_id: s.sensor_id,
    display_name: s.display_name,
    unit: s.unit,
    category: s.category,
    sort_order: Number(s.sort_order ?? 999),
    active: s.active ?? true,
    description: s.description ?? null,
    metadata: s.metadata ? JSON.stringify(s.metadata) : null
  }));

  const query = `
    MERGE \`${PROJECT_ID}.${DATASET}.report_sensor_config\` T
    USING UNNEST(@rows) S
    ON T.organization_id = S.organization_id
    AND T.site_id = S.site_id
    AND T.report_type = S.report_type
    AND T.sensor_id = S.sensor_id
    WHEN MATCHED THEN
      UPDATE SET
        display_name = S.display_name,
        unit = S.unit,
        category = S.category,
        sort_order = S.sort_order,
        active = S.active,
        description = S.description,
        metadata = PARSE_JSON(S.metadata)
    WHEN NOT MATCHED THEN
      INSERT (
        organization_id, site_id, report_type, sensor_id,
        display_name, unit, category, sort_order,
        active, description, metadata, created_at
      )
      VALUES (
        S.organization_id, S.site_id, S.report_type, S.sensor_id,
        S.display_name, S.unit, S.category, S.sort_order,
        S.active, S.description, PARSE_JSON(S.metadata), CURRENT_TIMESTAMP()
      )
  `;

  await bigquery.query({
    query,
    params: { rows },
    types: {
      rows: [{
        organization_id: "STRING",
        site_id: "STRING",
        report_type: "STRING",
        sensor_id: "STRING",
        display_name: "STRING",
        unit: "STRING",
        category: "STRING",
        sort_order: "INT64",
        active: "BOOL",
        description: "STRING",
        metadata: "STRING"
      }]
    }
  });
};



export const getMonthlyCategoryReportRowFromBQ = async (
  organizationId: string,
  siteId: string,
  reportType: string,
  category: string,
  month: number,
  year: number
) => {

  const query = `
    SELECT
      report_type,
      category,
      display_name,
      unit,
      sort_order,

      year,
      month,

      opening_value,
      closing_value,

      auto_consumption,
      final_consumption,

      variance,

      calculation_source,

      sample_count,

      has_reliable_snapshot,

      correction_reason

    FROM \`project-b5045c0e-60ef-4535-bc3.cloud_edge_gateway_master_data.report_monthly_export\`

    WHERE organization_id = @organizationId
      AND site_id = @siteId
      AND report_type = @reportType
      AND category = @category
      AND year = @year
      AND month = @month

    LIMIT 1
  `;

  const [rows] = await bigquery.query({
    query,
    params: {
      organizationId,
      siteId,
      reportType,
      category,
      month,
      year
    }
  });

  return rows[0] || null;
};
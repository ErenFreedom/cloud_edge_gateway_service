import {
  validateDateRange,
  validateExportInterval,
  validateLoadRange,
  validateSiteId,
} from "./loadAnalytics.validator";

import {
  getCurrentLoadRowsFromBQ,
  getExportRowsFromBQ,
} from "./loadAnalytics.bigquery.repository";

const getOrganizationId = (user: any): string => {
  const orgId = user?.organizationId || user?.organization_id;

  if (!orgId) {
    throw new Error("Organization context missing");
  }

  return orgId;
};

export const getCurrentLoadAnalyticsService = async (
  user: any,
  query: any
) => {
  const organizationId = getOrganizationId(user);
  const siteId = validateSiteId(query.site_id);
  const range = validateLoadRange(query.range);

  const rows = await getCurrentLoadRowsFromBQ(
    organizationId,
    siteId,
    range,
    query.logical_sensor_key,
    query.sensor_id
  );

  return {
    organization_id: organizationId,
    site_id: siteId,
    range,

    sensor_id: query.sensor_id || null,
    logical_sensor_key: query.logical_sensor_key || null,

    generated_at: new Date().toISOString(),
    total_sensors: rows.length,
    sensors: rows,
  };
};

export const getLoadAnalyticsExportService = async (
  user: any,
  query: any
) => {
  const organizationId = getOrganizationId(user);
  const siteId = validateSiteId(query.site_id);
  const interval = validateExportInterval(query.interval);

  const { from, to } = validateDateRange(query.from, query.to);

  const rows = await getExportRowsFromBQ(
    organizationId,
    siteId,
    from,
    to,
    interval,
    query.logical_sensor_key,
    query.sensor_id
  );

  return {
    rows,
    meta: {
      organization_id: organizationId,
      site_id: siteId,
      from,
      to,
      interval,

      sensor_id: query.sensor_id || null,
      logical_sensor_key: query.logical_sensor_key || null,

      generated_at: new Date().toISOString(),
    },
  };
};
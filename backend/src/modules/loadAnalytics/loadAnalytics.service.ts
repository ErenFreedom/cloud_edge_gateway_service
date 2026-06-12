import {
  validateDateRange,
  validateExportInterval,
  validateLoadRange,
  validateSiteId,
  parseCsvParam,
  validateOptionalSensorFilters,
} from "./loadAnalytics.validator";

import {
  getCurrentLoadRowsFromBQ,
  getExportRowsFromBQ,
  getLiveSensorRowsFromBQ
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

  const sensorIds = parseCsvParam(query.sensor_ids);
  const logicalSensorKeys = parseCsvParam(query.logical_sensor_keys);

  const rows = await getExportRowsFromBQ(
    organizationId,
    siteId,
    from,
    to,
    interval,
    {
      sensorId: query.sensor_id,
      logicalSensorKey: query.logical_sensor_key,
      sensorIds,
      logicalSensorKeys,
    }
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

      sensor_ids: sensorIds,
      logical_sensor_keys: logicalSensorKeys,

      generated_at: new Date().toISOString(),
    },
  };
};


export const getLiveLoadAnalyticsService = async (
  user: any,
  query: any
) => {
  const organizationId = getOrganizationId(user);
  const siteId = validateSiteId(query.site_id);

  const { sensorId, logicalSensorKey } =
    validateOptionalSensorFilters(query);

  const rows = await getLiveSensorRowsFromBQ(
    organizationId,
    siteId,
    logicalSensorKey,
    sensorId
  );

  return {
    organization_id: organizationId,
    site_id: siteId,

    sensor_id: sensorId || null,
    logical_sensor_key: logicalSensorKey || null,

    generated_at: new Date().toISOString(),
    total_sensors: rows.length,
    sensors: rows,
  };
};
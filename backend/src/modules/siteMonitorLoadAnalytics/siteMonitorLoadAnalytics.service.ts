import {
  AddDashboardSensorRequest,
  AuthenticatedDashboardUser,
  DashboardRole,
  DashboardSensorsResponse,
  DashboardSiteDetailsResponse,
  DashboardSitesResponse,
  ExportAnalyticsResponse,
  LiveLoadAnalyticsResponse,
  CurrentLoadAnalyticsResponse,
  SelectedDashboardSensorsResponse,
} from "./siteMonitorLoadAnalytics.types";

import {
  validateAddDashboardSensorBody,
  validateDateRange,
  validateExportInterval,
  validateLoadRange,
  validatePaginationQuery,
  validateSearchQuery,
  validateSiteId,
  validateSensorId,
} from "./siteMonitorLoadAnalytics.validator";

import {
  addDashboardSensorRepo,
  getAvailableDashboardSensorsRepo,
  getDashboardSiteByIdRepo,
  getDashboardSitesRepo,
  getSelectedDashboardBQSensorIdsRepo,
  getSelectedDashboardSensorsRepo,
  hasDashboardSiteAccessRepo,
  removeDashboardSensorRepo,
} from "./siteMonitorLoadAnalytics.repository";

import {
  getCurrentLoadRowsFromBQ,
  getExportRowsFromBQ,
  getLiveSensorRowsFromBQ,
} from "./siteMonitorLoadAnalytics.bigquery.repository";

type DashboardAccessContext = {
  userId: string;
  organizationId: string;
  role: DashboardRole;
};

class ServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const ALLOWED_DASHBOARD_ROLES: DashboardRole[] = [
  "super_admin",
  "org_site_manager",
  "site_admin",
  "site_monitor",
];

const getUserId = (user: AuthenticatedDashboardUser): string => {
  const userId = user.id || user.userId || user.user_id;

  if (!userId) {
    throw new ServiceError("User context missing", 401);
  }

  return userId;
};

const getOrganizationId = (user: AuthenticatedDashboardUser): string => {
  const organizationId = user.organizationId || user.organization_id;

  if (!organizationId) {
    throw new ServiceError("Organization context missing", 401);
  }

  return organizationId;
};

const getDashboardRole = (user: AuthenticatedDashboardUser): DashboardRole => {
  const role = user.role;

  if (!role || !ALLOWED_DASHBOARD_ROLES.includes(role as DashboardRole)) {
    throw new ServiceError("Unauthorized dashboard role", 403);
  }

  return role as DashboardRole;
};

const buildAccessContext = (
  user: AuthenticatedDashboardUser
): DashboardAccessContext => {
  return {
    userId: getUserId(user),
    organizationId: getOrganizationId(user),
    role: getDashboardRole(user),
  };
};

const SENSOR_MANAGEMENT_ROLES: DashboardRole[] = [
  "super_admin",
  "org_site_manager",
  "site_admin",
];

const assertCanManageDashboardSensors = (
  access: DashboardAccessContext
): void => {
  if (!SENSOR_MANAGEMENT_ROLES.includes(access.role)) {
    throw new ServiceError(
      "You do not have permission to manage dashboard sensors",
      403
    );
  }
};

const assertSiteAccess = async (
  access: DashboardAccessContext,
  siteId: string
): Promise<void> => {
  const hasAccess = await hasDashboardSiteAccessRepo(access, siteId);

  if (!hasAccess) {
    throw new ServiceError("Site not found or access denied", 403);
  }
};


const parseRequestedExportSensorIds = (
  value: unknown
): string[] => {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

const getAllowedExportSensorIds = (
  selectedBQSensorIds: string[],
  requestedSensorIds: string[]
): string[] => {
  if (requestedSensorIds.length === 0) {
    return selectedBQSensorIds;
  }

  const selectedSet = new Set(selectedBQSensorIds);

  return requestedSensorIds.filter((id) => selectedSet.has(id));
};

const getSelectedBQSensorIdsOrEmpty = async (
  access: DashboardAccessContext,
  siteId: string
): Promise<string[]> => {
  await assertSiteAccess(access, siteId);

  return getSelectedDashboardBQSensorIdsRepo(access, siteId);
};

export const getDashboardSitesService = async (
  user: AuthenticatedDashboardUser
): Promise<DashboardSitesResponse> => {
  const access = buildAccessContext(user);

  const sites = await getDashboardSitesRepo(access);

  return {
    sites,
  };
};

export const getDashboardSiteDetailsService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>
): Promise<DashboardSiteDetailsResponse> => {
  const access = buildAccessContext(user);
  const siteId = validateSiteId(params.siteId);

  const site = await getDashboardSiteByIdRepo(access, siteId);

  if (!site) {
    throw new ServiceError("Site not found or access denied", 404);
  }

  return {
    site,
  };
};

export const getAvailableDashboardSensorsService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>,
  query: Record<string, unknown>
): Promise<DashboardSensorsResponse> => {
  const access = buildAccessContext(user);
  const siteId = validateSiteId(params.siteId);

  await assertSiteAccess(access, siteId);

  const { limit, offset } = validatePaginationQuery(query);
  const search = validateSearchQuery(query);

  const sensors = await getAvailableDashboardSensorsRepo(access, siteId, {
    search,
    limit,
    offset,
  });

  return {
    site_id: siteId,
    total_sensors: sensors.length,
    sensors,
  };
};

export const getSelectedDashboardSensorsService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>
): Promise<SelectedDashboardSensorsResponse> => {
  const access = buildAccessContext(user);
  const siteId = validateSiteId(params.siteId);

  await assertSiteAccess(access, siteId);

  const sensors = await getSelectedDashboardSensorsRepo(access, siteId);

  return {
    site_id: siteId,
    total_sensors: sensors.length,
    sensors,
  };
};

export const addDashboardSensorService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>,
  body: unknown
): Promise<{
  message: string;
  sensor: NonNullable<Awaited<ReturnType<typeof addDashboardSensorRepo>>>;
}> => {
  const access = buildAccessContext(user);
  const siteId = validateSiteId(params.siteId);

  await assertSiteAccess(access, siteId);
  assertCanManageDashboardSensors(access);

  const payload: AddDashboardSensorRequest =
    validateAddDashboardSensorBody(body);

  const sensor = await addDashboardSensorRepo(
    access,
    siteId,
    payload.sensor_id
  );

  if (!sensor) {
    throw new ServiceError("Sensor not found or access denied", 404);
  }

  return {
    message: "Sensor added to dashboard",
    sensor,
  };
};


export const removeDashboardSensorService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>
): Promise<{
  message: string;
  removed: boolean;
}> => {
  const access = buildAccessContext(user);
  const siteId = validateSiteId(params.siteId);
  const sensorId = validateSensorId(params.sensorId);

  await assertSiteAccess(access, siteId);
  assertCanManageDashboardSensors(access);

  const removed = await removeDashboardSensorRepo(access, siteId, sensorId);

  if (!removed) {
    throw new ServiceError("Dashboard sensor not found", 404);
  }

  return {
    message: "Sensor removed from dashboard",
    removed,
  };
};


export const getDashboardCurrentLoadService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>,
  query: Record<string, unknown>
): Promise<CurrentLoadAnalyticsResponse> => {
  const access = buildAccessContext(user);

  const organizationId = access.organizationId;
  const siteId = validateSiteId(params.siteId);
  const range = validateLoadRange(query.range);

  const selectedBQSensorIds = await getSelectedBQSensorIdsOrEmpty(
    access,
    siteId
  );

  if (selectedBQSensorIds.length === 0) {
    return {
      organization_id: organizationId,
      site_id: siteId,
      range,
      generated_at: new Date().toISOString(),
      total_sensors: 0,
      sensors: [],
    };
  }

  const rows = await getCurrentLoadRowsFromBQ(
    organizationId,
    siteId,
    range,
    {
      sensorIds: selectedBQSensorIds,
    }
  );

  return {
    organization_id: organizationId,
    site_id: siteId,
    range,
    generated_at: new Date().toISOString(),
    total_sensors: rows.length,
    sensors: rows,
  };
};

export const getDashboardLiveLoadService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>
): Promise<LiveLoadAnalyticsResponse> => {
  const access = buildAccessContext(user);

  const organizationId = access.organizationId;
  const siteId = validateSiteId(params.siteId);

  const selectedBQSensorIds = await getSelectedBQSensorIdsOrEmpty(
    access,
    siteId
  );

  if (selectedBQSensorIds.length === 0) {
    return {
      organization_id: organizationId,
      site_id: siteId,
      generated_at: new Date().toISOString(),
      total_sensors: 0,
      sensors: [],
    };
  }

  const rows = await getLiveSensorRowsFromBQ(organizationId, siteId, {
    sensorIds: selectedBQSensorIds,
  });

  return {
    organization_id: organizationId,
    site_id: siteId,
    generated_at: new Date().toISOString(),
    total_sensors: rows.length,
    sensors: rows,
  };
};

export const getDashboardExportService = async (
  user: AuthenticatedDashboardUser,
  params: Record<string, unknown>,
  query: Record<string, unknown>
): Promise<ExportAnalyticsResponse> => {
  const access = buildAccessContext(user);

  const organizationId = access.organizationId;
  const siteId = validateSiteId(params.siteId);
  const interval = validateExportInterval(query.interval);
  const { from, to } = validateDateRange(query.from, query.to);

  const selectedBQSensorIds = await getSelectedBQSensorIdsOrEmpty(
    access,
    siteId
  );

  if (selectedBQSensorIds.length === 0) {
    return {
      rows: [],
      meta: {
        organization_id: organizationId,
        site_id: siteId,
        from,
        to,
        interval,
        generated_at: new Date().toISOString(),
        total_sensors: 0,
        selected_sensor_ids: [],
      },
    };
  }

  const requestedSensorIds = parseRequestedExportSensorIds(query.sensor_ids);

  const exportSensorIds = getAllowedExportSensorIds(
    selectedBQSensorIds,
    requestedSensorIds
  );

  if (exportSensorIds.length === 0) {
    return {
      rows: [],
      meta: {
        organization_id: organizationId,
        site_id: siteId,
        from,
        to,
        interval,
        generated_at: new Date().toISOString(),
        total_sensors: 0,
        selected_sensor_ids: [],
      },
    };
  }

  const rows = await getExportRowsFromBQ(
    organizationId,
    siteId,
    from,
    to,
    interval,
    {
      sensorIds: exportSensorIds,
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
      generated_at: new Date().toISOString(),
      total_sensors: exportSensorIds.length,
      selected_sensor_ids: exportSensorIds,
    },
  };
};
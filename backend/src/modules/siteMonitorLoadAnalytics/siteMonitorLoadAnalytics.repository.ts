import { pool } from "../../config/database";

import {
    DashboardRole,
    DashboardSensor,
    DashboardSite,
    SelectedDashboardSensor,
} from "./siteMonitorLoadAnalytics.types";

interface DashboardAccessInput {
    userId: string;
    organizationId: string;
    role: DashboardRole;
}

const SITE_SELECT = `
  s.id::text AS id,
  s.organization_id::text AS organization_id,
  s.site_name,
  s.site_uuid::text AS site_uuid,
  s.project_code AS site_code,
  s.phone,
  s.gst_number,
  CONCAT_WS(', ', NULLIF(s.address_line1, ''), NULLIF(s.address_line2, '')) AS address,
  s.address_line1,
  s.address_line2,
  s.state,
  s.country,
  s.latitude,
  s.longitude,
  s.status,
  s.created_at,
  s.activated_at
`;

const SENSOR_SELECT = `
  s.id::text AS id,
  s.sensor_uuid::text AS sensor_uuid,
  s.external_sensor_id,
  s.sensor_uuid::text AS bq_sensor_id,
  s.sensor_name,
  s.sensor_location AS location,
  s.api_endpoint,
  s.organization_id::text AS organization_id,
  s.site_id::text AS site_id,
  s.building_id::text AS building_id,
  s.floor_id::text AS floor_id,
  s.room_id::text AS room_id,
  s.component_id::text AS component_id,
  s.approval_status::text AS approval_status,
  s.operational_status::text AS operational_status,
  s.active,
  s.created_at
`;

export const hasDashboardSiteAccessRepo = async (
    input: DashboardAccessInput,
    siteId: string
): Promise<boolean> => {
    const { userId, organizationId, role } = input;

    if (role === "super_admin") {
        const result = await pool.query(
            `
        SELECT 1
        FROM public.sites s
        WHERE s.id = $1
          AND s.organization_id = $2
          AND s.status = 'active'
        LIMIT 1
      `,
            [siteId, organizationId]
        );

        return Boolean(result.rowCount);
    }

    if (role === "org_site_manager") {
        const result = await pool.query(
            `
        SELECT 1
        FROM public.sites s
        JOIN public.site_manager_sites sms
          ON sms.site_id = s.id
        WHERE s.id = $1
          AND s.organization_id = $2
          AND sms.manager_id = $3
          AND s.status = 'active'
        LIMIT 1
      `,
            [siteId, organizationId, userId]
        );

        return Boolean(result.rowCount);
    }

    if (role === "site_admin" || role === "site_monitor") {
        const result = await pool.query(
            `
        SELECT 1
        FROM public.sites s
        JOIN public.site_user_roles sur
          ON sur.site_id = s.id
        WHERE s.id = $1
          AND s.organization_id = $2
          AND sur.user_id = $3
          AND sur.role = $4
          AND s.status = 'active'
        LIMIT 1
      `,
            [siteId, organizationId, userId, role]
        );

        return Boolean(result.rowCount);
    }

    return false;
};

export const getDashboardSitesRepo = async (
    input: DashboardAccessInput
): Promise<DashboardSite[]> => {
    const { userId, organizationId, role } = input;

    if (role === "super_admin") {
        const result = await pool.query(
            `
        SELECT
          ${SITE_SELECT}
        FROM public.sites s
        WHERE s.organization_id = $1
          AND s.status = 'active'
        ORDER BY
          CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
          s.site_name ASC
      `,
            [organizationId]
        );

        return result.rows as DashboardSite[];
    }

    if (role === "org_site_manager") {
        const result = await pool.query(
            `
        SELECT
          ${SITE_SELECT}
        FROM public.sites s
        JOIN public.site_manager_sites sms
          ON sms.site_id = s.id
        WHERE s.organization_id = $1
          AND sms.manager_id = $2
          AND s.status = 'active'
        ORDER BY
          CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
          s.site_name ASC
      `,
            [organizationId, userId]
        );

        return result.rows as DashboardSite[];
    }

    if (role === "site_admin" || role === "site_monitor") {
        const result = await pool.query(
            `
        SELECT
          ${SITE_SELECT}
        FROM public.sites s
        JOIN public.site_user_roles sur
          ON sur.site_id = s.id
        WHERE s.organization_id = $1
          AND sur.user_id = $2
          AND sur.role = $3
          AND s.status = 'active'
        ORDER BY
          CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
          s.site_name ASC
      `,
            [organizationId, userId, role]
        );

        return result.rows as DashboardSite[];
    }

    return [];
};

export const getDashboardSiteByIdRepo = async (
    input: DashboardAccessInput,
    siteId: string
): Promise<DashboardSite | null> => {
    const hasAccess = await hasDashboardSiteAccessRepo(input, siteId);

    if (!hasAccess) {
        return null;
    }

    const result = await pool.query(
        `
      SELECT
        ${SITE_SELECT}
      FROM public.sites s
      WHERE s.id = $1
        AND s.organization_id = $2
        AND s.status = 'active'
      LIMIT 1
    `,
        [siteId, input.organizationId]
    );

    return (result.rows[0] as DashboardSite | undefined) || null;
};

export const getAvailableDashboardSensorsRepo = async (
    input: DashboardAccessInput,
    siteId: string,
    options: {
        search?: string;
        limit: number;
        offset: number;
    }
): Promise<DashboardSensor[]> => {
    const hasAccess = await hasDashboardSiteAccessRepo(input, siteId);

    if (!hasAccess) {
        return [];
    }

    const params: unknown[] = [siteId, input.organizationId];
    let searchSql = "";

    if (options.search) {
        params.push(`%${options.search}%`);
        searchSql = `
      AND (
        s.sensor_name ILIKE $${params.length}
        OR s.sensor_location ILIKE $${params.length}
        OR s.api_endpoint ILIKE $${params.length}
        OR s.external_sensor_id ILIKE $${params.length}
      )
    `;
    }

    params.push(options.limit);
    const limitIndex = params.length;

    params.push(options.offset);
    const offsetIndex = params.length;

    const result = await pool.query(
        `
      SELECT
        ${SENSOR_SELECT},
        CASE
          WHEN sds.id IS NULL THEN FALSE
          ELSE TRUE
        END AS added_to_dashboard,
        sds.id::text AS dashboard_sensor_id,
        sds.created_at AS added_at,
        sds.added_by::text AS added_by
      FROM public.sensors s
      LEFT JOIN public.site_dashboard_sensors sds
        ON sds.sensor_id = s.id
       AND sds.site_id = s.site_id
      WHERE s.site_id = $1
        AND s.organization_id = $2
        AND s.deleted_at IS NULL
        ${searchSql}
      ORDER BY
        CASE WHEN sds.id IS NULL THEN 1 ELSE 0 END,
        s.sensor_name ASC NULLS LAST,
        s.created_at DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `,
        params
    );

    return result.rows as DashboardSensor[];
};

export const getSelectedDashboardSensorsRepo = async (
    input: DashboardAccessInput,
    siteId: string
): Promise<SelectedDashboardSensor[]> => {
    const hasAccess = await hasDashboardSiteAccessRepo(input, siteId);

    if (!hasAccess) {
        return [];
    }

    const result = await pool.query(
        `
      SELECT
        sds.id::text AS id,
  sds.site_id::text AS site_id,
  sds.sensor_id::text AS sensor_id,
  sds.added_by::text AS added_by,
  sds.created_at,

  s.sensor_uuid::text AS sensor_uuid,
  s.sensor_uuid::text AS bq_sensor_id,
  s.external_sensor_id,
  s.sensor_name,
  s.api_endpoint,
  s.sensor_location AS location,
  s.operational_status::text AS operational_status,
  s.approval_status::text AS approval_status
      FROM public.site_dashboard_sensors sds
      JOIN public.sensors s
        ON s.id = sds.sensor_id
      WHERE sds.site_id = $1
        AND s.site_id = $1
        AND s.organization_id = $2
        AND s.deleted_at IS NULL
      ORDER BY s.sensor_name ASC NULLS LAST, sds.created_at ASC
    `,
        [siteId, input.organizationId]
    );

    return result.rows as SelectedDashboardSensor[];
};

export const getSelectedDashboardBQSensorIdsRepo = async (
    input: DashboardAccessInput,
    siteId: string
): Promise<string[]> => {
    const hasAccess = await hasDashboardSiteAccessRepo(input, siteId);

    if (!hasAccess) {
        return [];
    }

    const result = await pool.query(
        `
      SELECT DISTINCT
        s.sensor_uuid::text AS bq_sensor_id
      FROM public.site_dashboard_sensors sds
      JOIN public.sensors s
        ON s.id = sds.sensor_id
      WHERE sds.site_id = $1
        AND s.site_id = $1
        AND s.organization_id = $2
        AND s.deleted_at IS NULL
        AND s.sensor_uuid IS NOT NULL
      ORDER BY bq_sensor_id ASC
    `,
        [siteId, input.organizationId]
    );

    return result.rows
        .map((row: { bq_sensor_id: string | null }) => row.bq_sensor_id)
        .filter((id): id is string => Boolean(id));
};

export const addDashboardSensorRepo = async (
    input: DashboardAccessInput,
    siteId: string,
    sensorId: string
): Promise<SelectedDashboardSensor | null> => {
    const hasAccess = await hasDashboardSiteAccessRepo(input, siteId);

    if (!hasAccess) {
        return null;
    }

    const sensorCheck = await pool.query(
        `
      SELECT 1
      FROM public.sensors s
      WHERE s.id = $1
        AND s.site_id = $2
        AND s.organization_id = $3
        AND s.deleted_at IS NULL
      LIMIT 1
    `,
        [sensorId, siteId, input.organizationId]
    );

    if (!sensorCheck.rowCount) {
        return null;
    }

    const result = await pool.query(
        `
      WITH inserted AS (
        INSERT INTO public.site_dashboard_sensors (
          site_id,
          sensor_id,
          added_by
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (site_id, sensor_id)
        DO UPDATE SET sensor_id = EXCLUDED.sensor_id
        RETURNING *
      )
      SELECT
        inserted.id::text AS id,
  inserted.site_id::text AS site_id,
  inserted.sensor_id::text AS sensor_id,
  inserted.added_by::text AS added_by,
  inserted.created_at,

  s.sensor_uuid::text AS sensor_uuid,
  s.sensor_uuid::text AS bq_sensor_id,
  s.external_sensor_id,
  s.sensor_name,
  s.api_endpoint,
  s.sensor_location AS location,
  s.operational_status::text AS operational_status,
  s.approval_status::text AS approval_status
      FROM inserted
      JOIN public.sensors s
        ON s.id = inserted.sensor_id
    `,
        [siteId, sensorId, input.userId]
    );

    return (result.rows[0] as SelectedDashboardSensor | undefined) || null;
};

export const removeDashboardSensorRepo = async (
    input: DashboardAccessInput,
    siteId: string,
    sensorId: string
): Promise<boolean> => {
    const hasAccess = await hasDashboardSiteAccessRepo(input, siteId);

    if (!hasAccess) {
        return false;
    }

    const result = await pool.query(
        `
      DELETE FROM public.site_dashboard_sensors sds
      USING public.sensors s
      WHERE sds.sensor_id = s.id
        AND sds.site_id = $1
        AND sds.sensor_id = $2
        AND s.site_id = $1
        AND s.organization_id = $3
    `,
        [siteId, sensorId, input.organizationId]
    );

    return Boolean(result.rowCount);
};
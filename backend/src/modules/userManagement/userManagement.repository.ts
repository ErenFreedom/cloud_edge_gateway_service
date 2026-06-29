import { PoolClient } from "pg";

import {
  ListUsersQuery,
  UpdateUserStatusPayload,
} from "./userManagement.types";

/* ========================= */
/* REQUESTER */
/* ========================= */

export const getRequesterRepo = async (
  client: PoolClient,
  userId: string
) => {
  const { rows } = await client.query(
    `
    SELECT
      id,
      organization_id,
      role,
      status
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  return rows[0];
};

/* ========================= */
/* LIST USERS */
/* ========================= */

export const getOrganizationUsersRepo = async (
  client: PoolClient,
  organizationId: string,
  query: ListUsersQuery
) => {
  const values: any[] = [organizationId];

  const whereClauses: string[] = [
    `u.organization_id = $1`,
    `
    u.role IN (
      'super_admin',
      'org_site_manager',
      'site_admin',
      'site_viewer',
      'site_monitor'
    )
    `,
  ];

  if (query.search) {
    values.push(`%${query.search.toLowerCase()}%`);

    whereClauses.push(`
      (
        LOWER(u.full_name) LIKE $${values.length}
        OR LOWER(u.email) LIKE $${values.length}
        OR LOWER(COALESCE(u.phone, '')) LIKE $${values.length}
      )
    `);
  }

  if (query.role && query.role !== "all") {
    values.push(query.role);
    whereClauses.push(`u.role = $${values.length}`);
  }

  if (query.status && query.status !== "all") {
    values.push(query.status);
    whereClauses.push(`u.status = $${values.length}`);
  }

  if (query.site_id) {
    values.push(query.site_id);

    whereClauses.push(`
      (
        EXISTS (
          SELECT 1
          FROM site_user_roles sur_filter
          WHERE sur_filter.user_id = u.id
            AND sur_filter.site_id = $${values.length}
        )
        OR EXISTS (
          SELECT 1
          FROM site_manager_sites sms_filter
          WHERE sms_filter.manager_id = u.id
            AND sms_filter.site_id = $${values.length}
        )
      )
    `);
  }

  const sql = `
    SELECT
      u.id,
      u.organization_id,

      u.full_name,
      u.email,
      u.phone,

      u.role,
      u.status,
      u.email_verified,

      u.created_at,

      COALESCE(site_assignments.assigned_sites, '[]'::json) AS assigned_sites,
      COALESCE(manager_assignments.managed_sites, '[]'::json) AS managed_sites,

      COALESCE(site_assignments.assignment_count, 0) AS site_assignment_count,
      COALESCE(manager_assignments.assignment_count, 0) AS manager_assignment_count

    FROM users u

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS assignment_count,
        json_agg(
          json_build_object(
            'site_id', s.id,
            'site_name', s.site_name,
            'site_status', s.status,
            'role_on_site', sur.role,
            'assigned_at', NULL
          )
          ORDER BY s.site_name
        ) AS assigned_sites
      FROM site_user_roles sur
      JOIN sites s
        ON s.id = sur.site_id
      WHERE sur.user_id = u.id
    ) site_assignments ON true

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS assignment_count,
        json_agg(
          json_build_object(
            'site_id', s.id,
            'site_name', s.site_name,
            'site_status', s.status,
            'assigned_at', NULL
          )
          ORDER BY s.site_name
        ) AS managed_sites
      FROM site_manager_sites sms
      JOIN sites s
        ON s.id = sms.site_id
      WHERE sms.manager_id = u.id
    ) manager_assignments ON true

    WHERE ${whereClauses.join(" AND ")}

    ORDER BY
      CASE
        WHEN u.role = 'super_admin' THEN 1
        WHEN u.role = 'org_site_manager' THEN 2
        WHEN u.role = 'site_admin' THEN 3
        WHEN u.role = 'site_monitor' THEN 4
        WHEN u.role = 'site_viewer' THEN 5
        ELSE 6
      END,
      u.created_at DESC
  `;

  const { rows } = await client.query(sql, values);

  return rows;
};

/* ========================= */
/* SINGLE USER / MUTATION */
/* ========================= */

export const getUserForMutationRepo = async (
  client: PoolClient,
  organizationId: string,
  userId: string
) => {
  const { rows } = await client.query(
    `
    SELECT
      id,
      organization_id,
      full_name,
      email,
      phone,
      password_hash,
      aadhaar_pan_encrypted,
      birthdate,
      gender,
      role,
      status,
      email_verified,
      created_at,
      platform_role
    FROM users
    WHERE id = $1
      AND organization_id = $2
    `,
    [userId, organizationId]
  );

  return rows[0];
};

export const countUserSiteAssignmentsRepo = async (
  client: PoolClient,
  userId: string
): Promise<number> => {
  const { rows } = await client.query(
    `
    SELECT COUNT(*)::int AS count
    FROM site_user_roles
    WHERE user_id = $1
    `,
    [userId]
  );

  return Number(rows[0]?.count || 0);
};

export const countUserManagerAssignmentsRepo = async (
  client: PoolClient,
  userId: string
): Promise<number> => {
  const { rows } = await client.query(
    `
    SELECT COUNT(*)::int AS count
    FROM site_manager_sites
    WHERE manager_id = $1
    `,
    [userId]
  );

  return Number(rows[0]?.count || 0);
};

export const updateUserStatusRepo = async (
  client: PoolClient,
  userId: string,
  payload: UpdateUserStatusPayload
) => {
  const { rows } = await client.query(
    `
    UPDATE users
    SET status = $2
    WHERE id = $1
    RETURNING
      id,
      full_name,
      email,
      role,
      status,
      email_verified
    `,
    [userId, payload.status]
  );

  return rows[0];
};

/* ========================= */
/* DELETE AUDIT */
/* ========================= */

export const insertDeletedUserAuditRepo = async (
  client: PoolClient,
  params: {
    user: any;
    deletedBy: string;
    reason: string;
  }
) => {
  const { user, deletedBy, reason } = params;

  await client.query(
    `
    INSERT INTO deleted_users_audit (
      organization_id,
      user_id,
      full_name,
      email,
      phone,
      role,
      status,
      email_verified,
      deleted_reason,
      deleted_by,
      snapshot
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
    )
    `,
    [
      user.organization_id,
      user.id,
      user.full_name,
      user.email,
      user.phone,
      user.role,
      user.status,
      user.email_verified,
      reason,
      deletedBy,
      JSON.stringify(user),
    ]
  );
};

export const deleteUserRepo = async (
  client: PoolClient,
  userId: string
) => {
  await client.query(
    `
    DELETE FROM users
    WHERE id = $1
    `,
    [userId]
  );
};
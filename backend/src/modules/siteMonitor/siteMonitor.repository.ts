import { PoolClient } from "pg";
import { pool } from "../../config/database";

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const findUserByEmailRepo = async (
  email: string,
  client?: PoolClient
) => {
  const db = client || pool;

  const { rows } = await db.query(
    `
    SELECT *
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  return rows[0];
};

export const createInviteRepo = async (
  payload: {
    organizationId: string;
    siteId: string;
    email: string;
    fullName: string;
    otp: string;
    createdBy: string;
  },
  client?: PoolClient
) => {
  const db = client || pool;

  const { rows } = await db.query(
    `
    INSERT INTO site_monitor_invites (
      organization_id,
      site_id,
      email,
      full_name,
      otp_code,
      expires_at,
      created_by
    )
    VALUES (
      $1,
      $2,
      LOWER($3),
      $4,
      $5,
      now() + interval '10 minutes',
      $6
    )
    RETURNING *
    `,
    [
      payload.organizationId,
      payload.siteId,
      payload.email,
      payload.fullName,
      payload.otp,
      payload.createdBy,
    ]
  );

  return rows[0];
};

export const findPendingInviteRepo = async (
  email: string,
  otp: string,
  client?: PoolClient
) => {
  const db = client || pool;

  const { rows } = await db.query(
    `
    SELECT *
    FROM site_monitor_invites
    WHERE LOWER(email) = LOWER($1)
      AND otp_code = $2
      AND verified = false
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [email, otp]
  );

  return rows[0];
};

export const markInviteVerifiedRepo = async (
  inviteId: string,
  client?: PoolClient
) => {
  const db = client || pool;

  const { rows } = await db.query(
    `
    UPDATE site_monitor_invites
    SET verified = true,
        verified_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [inviteId]
  );

  return rows[0];
};

export const markInvitePasswordSentRepo = async (
  email: string,
  client?: PoolClient
) => {
  const db = client || pool;

  await db.query(
    `
    UPDATE site_monitor_invites
    SET generated_password_sent_at = now()
    WHERE LOWER(email) = LOWER($1)
      AND verified = true
      AND generated_password_sent_at IS NULL
    `,
    [email]
  );
};

export const createSiteMonitorUserRepo = async (
  payload: {
    organizationId: string;
    fullName: string;
    email: string;
    passwordHash: string;
    createdBy: string;
  },
  client?: PoolClient
) => {
  const db = client || pool;

  const { rows } = await db.query(
    `
    INSERT INTO users (
      organization_id,
      full_name,
      email,
      password_hash,
      role,
      status,
      email_verified,
      password_managed_by_admin,
      created_by,
      last_password_generated_at
    )
    VALUES (
      $1,
      $2,
      LOWER($3),
      $4,
      'site_monitor',
      'active',
      true,
      true,
      $5,
      now()
    )
    RETURNING *
    `,
    [
      payload.organizationId,
      payload.fullName,
      payload.email,
      payload.passwordHash,
      payload.createdBy,
    ]
  );

  return rows[0];
};

export const assignMonitorSitesRepo = async (
  userId: string,
  siteIds: string[],
  client?: PoolClient
) => {
  const db = client || pool;

  for (const siteId of siteIds) {
    await db.query(
      `
      INSERT INTO site_user_roles (
        site_id,
        user_id,
        role
      )
      VALUES ($1, $2, 'site_monitor')
      ON CONFLICT (site_id, user_id)
      DO UPDATE SET role = 'site_monitor'
      `,
      [siteId, userId]
    );
  }
};

export const replaceMonitorSitesRepo = async (
  userId: string,
  siteIds: string[],
  client?: PoolClient
) => {
  const db = client || pool;

  await db.query(
    `
    DELETE FROM site_user_roles
    WHERE user_id = $1
      AND role = 'site_monitor'
    `,
    [userId]
  );

  await assignMonitorSitesRepo(userId, siteIds, client);
};

export const getAuthorizedSitesRepo = async (
  user: {
    userId: string;
    role: string;
    organizationId: string | null;
  }
) => {
  if (user.role === "super_admin") {
    const { rows } = await pool.query(
      `
      SELECT id
      FROM sites
      WHERE organization_id = $1
      `,
      [user.organizationId]
    );

    return rows.map((r) => r.id);
  }

  if (user.role === "org_site_manager") {
    const { rows } = await pool.query(
      `
      SELECT site_id AS id
      FROM site_manager_sites
      WHERE manager_id = $1
      `,
      [user.userId]
    );

    return rows.map((r) => r.id);
  }

  if (user.role === "site_admin") {
    const { rows } = await pool.query(
      `
      SELECT site_id AS id
      FROM site_user_roles
      WHERE user_id = $1
        AND role = 'site_admin'
      `,
      [user.userId]
    );

    return rows.map((r) => r.id);
  }

  if (user.role === "site_monitor") {
    const { rows } = await pool.query(
      `
    SELECT site_id AS id
    FROM site_user_roles
    WHERE user_id = $1
      AND role = 'site_monitor'
    `,
      [user.userId]
    );

    return rows.map((r) => r.id);
  }

  return [];
};

export const verifySitesBelongToOrgRepo = async (
  organizationId: string,
  siteIds: string[]
): Promise<boolean> => {
  const { rows } = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM sites
    WHERE organization_id = $1
      AND id = ANY($2::uuid[])
    `,
    [organizationId, siteIds]
  );

  return Number(rows[0]?.count || 0) === siteIds.length;
};

export const listSiteMonitorsRepo = async (
  organizationId: string,
  allowedSiteIds: string[]
) => {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.status,
      u.email_verified,
      u.password_managed_by_admin,
      u.last_password_generated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'site_id', s.id,
            'site_name', s.site_name
          )
          ORDER BY s.site_name
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'
      ) AS sites
    FROM users u
    JOIN site_user_roles sur
      ON sur.user_id = u.id
     AND sur.role = 'site_monitor'
    JOIN sites s
      ON s.id = sur.site_id
    WHERE u.organization_id = $1
      AND u.role = 'site_monitor'
      AND sur.site_id = ANY($2::uuid[])
    GROUP BY u.id
    ORDER BY u.created_at DESC
    `,
    [organizationId, allowedSiteIds]
  );

  return rows;
};

export const getSiteMonitorByIdRepo = async (
  monitorId: string,
  organizationId: string,
  allowedSiteIds: string[]
) => {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.status,
      u.email_verified,
      u.password_managed_by_admin,
      u.last_password_generated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'site_id', s.id,
            'site_name', s.site_name
          )
          ORDER BY s.site_name
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'
      ) AS sites
    FROM users u
    JOIN site_user_roles sur
      ON sur.user_id = u.id
     AND sur.role = 'site_monitor'
    JOIN sites s
      ON s.id = sur.site_id
    WHERE u.id = $1
      AND u.organization_id = $2
      AND u.role = 'site_monitor'
      AND sur.site_id = ANY($3::uuid[])
    GROUP BY u.id
    LIMIT 1
    `,
    [monitorId, organizationId, allowedSiteIds]
  );

  return rows[0];
};

export const updateSiteMonitorRepo = async (
  monitorId: string,
  payload: {
    fullName?: string;
    phone?: string;
    status?: "active" | "disabled";
  },
  client?: PoolClient
) => {
  const db = client || pool;

  const { rows } = await db.query(
    `
    UPDATE users
    SET
      full_name = COALESCE($2, full_name),
      phone = COALESCE($3, phone),
      status = COALESCE($4, status)
    WHERE id = $1
      AND role = 'site_monitor'
    RETURNING *
    `,
    [
      monitorId,
      payload.fullName ?? null,
      payload.phone ?? null,
      payload.status ?? null,
    ]
  );

  return rows[0];
};

export const changeMonitorPasswordRepo = async (
  monitorId: string,
  passwordHash: string,
  client?: PoolClient
) => {
  const db = client || pool;

  const { rows } = await db.query(
    `
    UPDATE users
    SET password_hash = $2,
        password_managed_by_admin = true,
        last_password_generated_at = now()
    WHERE id = $1
      AND role = 'site_monitor'
    RETURNING *
    `,
    [monitorId, passwordHash]
  );

  return rows[0];
};

export const deleteSiteMonitorRepo = async (
  monitorId: string,
  client?: PoolClient
) => {
  const db = client || pool;

  await db.query(
    `
    DELETE FROM site_user_roles
    WHERE user_id = $1
      AND role = 'site_monitor'
    `,
    [monitorId]
  );

  const { rows } = await db.query(
    `
    UPDATE users
    SET status = 'disabled'
    WHERE id = $1
      AND role = 'site_monitor'
    RETURNING *
    `,
    [monitorId]
  );

  return rows[0];
};
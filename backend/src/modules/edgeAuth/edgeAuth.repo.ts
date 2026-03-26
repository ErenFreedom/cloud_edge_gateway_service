
import { pool } from "../../config/database";

export const findUserWithSiteRepo = async (email: string) => {
  const { rows } = await pool.query(
    `
    SELECT u.*, s.id as site_id,s.organization_id, s.machine_fingerprint, s.device_secret, s.site_secret_hash
    FROM users u
    JOIN site_user_roles sur ON sur.user_id = u.id
    JOIN sites s ON s.id = sur.site_id
    WHERE u.email = $1
    AND u.role = 'site_admin'
    LIMIT 1
    `,
    [email]
  );

  return rows[0];
};

export const getSiteByIdRepo = async (siteId: string) => {
  const { rows } = await pool.query(
    `SELECT * FROM sites WHERE id = $1`,
    [siteId]
  );
  return rows[0];
};

export const activateSiteRepo = async (
  siteId: string,
  fingerprint: string,
  deviceSecret: string
) => {
  const { rows } = await pool.query(
    `
    UPDATE sites
    SET
      machine_fingerprint = $1,
      device_secret = $2,
      status = 'active',
      activated_at = now()
    WHERE id = $3
    RETURNING *
    `,
    [fingerprint, deviceSecret, siteId]
  );

  return rows[0];
};

export const createActivationRequestRepo = async (
  siteId: string,
  fingerprint: string
) => {
  await pool.query(
    `
    INSERT INTO site_activation_requests (site_id, machine_fingerprint)
    VALUES ($1, $2)
    `,
    [siteId, fingerprint]
  );
};

export const getPendingRequestsRepo = async () => {
  const { rows } = await pool.query(
    `
    SELECT sar.*, s.site_name, s.organization_id
    FROM site_activation_requests sar
    JOIN sites s ON s.id = sar.site_id
    WHERE sar.status = 'pending'
    ORDER BY sar.requested_at DESC
    `
  );

  return rows;
};

export const getActivationRequestByIdRepo = async (requestId: string) => {
  const { rows } = await pool.query(
    `
    SELECT sar.*, s.organization_id
    FROM site_activation_requests sar
    JOIN sites s ON s.id = sar.site_id
    WHERE sar.id = $1
    `,
    [requestId]
  );

  return rows[0];
};


export const updateActivationRequestStatusRepo = async (
  requestId: string,
  status: "approved" | "rejected"
) => {
  await pool.query(
    `
    UPDATE site_activation_requests
    SET status = $1,
        approved_at = now()
    WHERE id = $2
    `,
    [status, requestId]
  );
};

export const updateSiteStatusRepo = async (
  siteId: string,
  status: "suspended" | "scheduled_for_deletion"
) => {
  await pool.query(
    `
    UPDATE sites
    SET status = $1
    WHERE id = $2
    `,
    [status, siteId]
  );
};
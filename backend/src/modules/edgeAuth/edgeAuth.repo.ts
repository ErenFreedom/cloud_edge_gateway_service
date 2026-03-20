
import { pool } from "../../config/database";

export const findUserWithSiteRepo = async (email: string) => {
  const { rows } = await pool.query(
    `
    SELECT u.*, s.id as site_id, s.machine_fingerprint, s.device_secret, s.site_secret_hash
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
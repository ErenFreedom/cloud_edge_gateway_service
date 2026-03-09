import { pool } from '../../config/database';



export const findOrganizationById = async (id: string) => {
  const { rows } = await pool.query(
    `
    SELECT
        o.*,
        u.email AS super_admin_email
    FROM organizations o
    LEFT JOIN users u
      ON u.organization_id = o.id
     AND u.role = 'super_admin'
    WHERE o.id = $1
    `,
    [id]
  );

  return rows[0];
};


export const disableUsersByOrg = async (orgId: string) => {
  await pool.query(
    `UPDATE users
     SET status = 'disabled'
     WHERE organization_id = $1`,
    [orgId]
  );
};

export const enableUsersByOrg = async (orgId: string) => {
  await pool.query(
    `UPDATE users
     SET status = 'active'
     WHERE organization_id = $1`,
    [orgId]
  );
};

export const suspendSitesByOrg = async (orgId: string) => {
  await pool.query(
    `UPDATE sites
     SET status = 'suspended'
     WHERE organization_id = $1`,
    [orgId]
  );
};

export const activateSitesByOrg = async (orgId: string) => {
  await pool.query(
    `UPDATE sites
     SET status = 'active'
     WHERE organization_id = $1`,
    [orgId]
  );
};


export const suspendOrganizationWithReason = async (
  orgId: string,
  reason: string
) => {
  await pool.query(
    `
    UPDATE organizations
    SET status = 'suspended',
        suspension_reason = $2
    WHERE id = $1
    `,
    [orgId, reason]
  );
};


export const scheduleDeletionWithReason = async (
  orgId: string,
  reason: string
) => {
  await pool.query(
    `
    UPDATE organizations
    SET status = 'deletion_pending',
        deletion_reason = $2,
        deletion_requested_at = now(),
        deletion_scheduled_at = now() + interval '30 days'
    WHERE id = $1
    `,
    [orgId, reason]
  );
};



export const reactivateOrganizationWithReason = async (
  orgId: string,
  reason: string
) => {
  await pool.query(
    `
    UPDATE organizations
    SET status = 'active',
        suspension_reason = NULL,
        deletion_reason = NULL,
        deletion_requested_at = NULL,
        deletion_scheduled_at = NULL
    WHERE id = $1
    `,
    [orgId]
  );
};



export const deleteOrganizationHard = async (orgId: string) => {
  await pool.query(
    `DELETE FROM organizations WHERE id = $1`,
    [orgId]
  );
};



export const getOrganizationsPendingDeletion = async () => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM organizations
    WHERE status = 'deletion_pending'
      AND deletion_scheduled_at <= now()
    `
  );
  return rows;
};



export const getAllOrganizations = async () => {
  const { rows } = await pool.query(
    `
    SELECT
        o.id,
        o.org_name,
        o.org_phone,
        o.org_address,
        u.email AS super_admin_email,
        o.status,
        o.suspension_reason,
        o.deletion_reason,
        o.created_at,
        o.activated_at,
        o.deletion_scheduled_at
    FROM organizations o
    LEFT JOIN users u
        ON u.organization_id = o.id
       AND u.role = 'super_admin'
    ORDER BY o.created_at DESC
    `
  );

  return rows;
};
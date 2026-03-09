
import { pool } from '../../config/database';

export const insertOrganizationRequest = async (data: any) => {
  const query = `
    INSERT INTO organization_requests (
      org_name, org_phone, org_address, pincode,
      gst_number, registration_number,
      super_admin_name, super_admin_email,
      super_admin_phone, password_hash,
      aadhaar_pan_encrypted, birthdate, gender
    )
    VALUES (
      $1,$2,$3,$4,
      $5,$6,
      $7,$8,
      $9,$10,
      $11,$12,$13
    )
    RETURNING *;
  `;

  const values = [
    data.org_name,
    data.org_phone,
    data.org_address,
    data.pincode,
    data.gst_number,
    data.registration_number,
    data.super_admin_name,
    data.super_admin_email,
    data.super_admin_phone,
    data.password_hash,
    data.aadhaar_pan_encrypted,
    data.birthdate,
    data.gender,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getOrganizationRequests = async (status?: string) => {
  const query = status
    ? `SELECT * FROM organization_requests WHERE status = $1 ORDER BY created_at DESC`
    : `SELECT * FROM organization_requests ORDER BY created_at DESC`;

  const { rows } = await pool.query(query, status ? [status] : []);
  return rows;
};

export const updateOrganizationRequestStatus = async (
  id: string,
  status: string,
  rejection_reason?: string
) => {
  const query = `
    UPDATE organization_requests
    SET status = $1,
        reviewed_at = now(),
        rejection_reason = $2
    WHERE id = $3
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    status,
    rejection_reason || null,
    id,
  ]);

  return rows[0];
};
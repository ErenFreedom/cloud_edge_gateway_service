import { pool } from '../../config/database';

export const createSiteRepo = async (client: any, data: any) => {
  const { rows } = await client.query(
    `
    INSERT INTO sites (
      organization_id,
      site_name,
      phone,
      address_line1,
      address_line2,
      state,
      country,
      gst_number,
      status,
      site_admin_email_activation_pending
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'inactive',true)
    RETURNING *;
    `,
    [
      data.organization_id,
      data.site_name,
      data.phone,
      data.address_line1,
      data.address_line2,
      data.state,
      data.country,
      data.gst_number,
    ]
  );
  return rows[0];
};

export const createUserRepo = async (client: any, data: any) => {
  const { rows } = await client.query(
    `
    INSERT INTO users (
      organization_id,
      full_name,
      email,
      password_hash,
      aadhaar_pan_encrypted,
      birthdate,
      gender,
      role,
      status,
      email_verified
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',false)
    RETURNING *;
    `,
    [
      data.organization_id,
      data.full_name,
      data.email,
      data.password_hash,
      data.aadhaar_pan_encrypted,
      data.birthdate,
      data.gender,
      data.role,
    ]
  );
  return rows[0];
};

export const createSiteAdminOtpRepo = async (
  client: any,
  userId: string,
  siteId: string,
  otp: string
) => {
  const { rows } = await client.query(
    `
    INSERT INTO site_admin_otps (
      user_id,
      site_id,
      otp_code,
      expires_at
    )
    VALUES ($1,$2,$3,now() + interval '10 minutes')
    RETURNING *;
    `,
    [userId, siteId, otp]
  );
  return rows[0];
};

export const findValidSiteAdminOtp = async (
  otpId: string,
  otp: string
) => {
  const { rows } = await pool.query(
    `
    SELECT * FROM site_admin_otps
    WHERE id = $1
    AND otp_code = $2
    AND verified = false
    AND expires_at > now()
    `,
    [otpId, otp]
  );
  return rows[0];
};

export const markSiteAdminOtpVerified = async (otpId: string) => {
  await pool.query(
    `UPDATE site_admin_otps SET verified = true WHERE id = $1`,
    [otpId]
  );
};
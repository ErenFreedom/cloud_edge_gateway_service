import { PoolClient } from "pg";
import { pool } from "../../config/database";

import {
  CreateSitePayload
} from "./site.types";


export const createSiteRepo = async (
  client: PoolClient,
  organizationId: string,
  data: CreateSitePayload
) => {

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
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      'pending_activation',
      true
    )
    RETURNING *;
    `,
    [
      organizationId,
      data.site_name,
      data.phone ?? null,
      data.address_line1,
      data.address_line2 ?? null,
      data.state,
      data.country,
      data.gst_number ?? null
    ]
  );

  return rows[0];

};



export const createUserRepo = async (
  client: PoolClient,
  organizationId: string,
  user: CreateSitePayload["site_admin"],
  passwordHash: string,
  aadhaarEncrypted: string
) => {

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
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      'site_admin',
      'pending',
      false
    )
    RETURNING *;
    `,
    [
      organizationId,
      user.full_name,
      user.email,
      passwordHash,
      aadhaarEncrypted,
      user.birthdate,
      user.gender
    ]
  );

  return rows[0];

};




export const createSiteAdminOtpRepo = async (
  client: PoolClient,
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
    VALUES (
      $1,$2,$3,
      now() + interval '10 minutes'
    )
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
    SELECT *
    FROM site_admin_otps
    WHERE id = $1
    AND otp_code = $2
    AND verified = false
    AND expires_at > now()
    `,
    [otpId, otp]
  );

  return rows[0];

};




export const markSiteAdminOtpVerified = async (
  otpId: string
) => {

  await pool.query(
    `
    UPDATE site_admin_otps
    SET verified = true
    WHERE id = $1
    `,
    [otpId]
  );

};




export const activateSiteRepo = async (
  client: PoolClient,
  siteId: string
) => {

  const { rows } = await client.query(
    `
    UPDATE sites
    SET
      status = 'active',
      activated_at = now(),
      site_admin_email_activation_pending = false
    WHERE id = $1
    RETURNING *;
    `,
    [siteId]
  );

  return rows[0];

};




export const getSiteByIdRepo = async (
  siteId: string
) => {

  const { rows } = await pool.query(
    `
    SELECT *
    FROM sites
    WHERE id = $1
    `,
    [siteId]
  );

  return rows[0];

};




export const getSitesByOrganizationRepo = async (
  organizationId: string
) => {

  const { rows } = await pool.query(
    `
    SELECT
      id,
      site_name,
      phone,
      address_line1,
      address_line2,
      state,
      country,
      gst_number,
      status,
      created_at,
      activated_at
    FROM sites
    WHERE organization_id = $1
    ORDER BY created_at DESC
    `,
    [organizationId]
  );

  return rows;

};
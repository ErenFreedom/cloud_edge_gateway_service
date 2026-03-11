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
      site_uuid,
      machine_fingerprint,
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


export const updateSiteCredentialsRepo = async (
  siteId: string,
  siteUuid: string,
  secretHash: string
) => {

  const { rows } = await pool.query(
    `
    UPDATE sites
    SET
      site_uuid = $1,
      site_secret_hash = $2,
      activated_at = now()
    WHERE id = $3
    RETURNING site_uuid
    `,
    [siteUuid, secretHash, siteId]
  );

  return rows[0];

};


export const assignUserToSiteRepo = async (
  client: PoolClient,
  siteId: string,
  userId: string,
  role: 'site_admin' | 'site_viewer'
) => {

  const { rows } = await client.query(
    `
    INSERT INTO site_user_roles (
      site_id,
      user_id,
      role
    )
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [siteId, userId, role]
  );

  return rows[0];
};


export const findUserByEmailRepo = async (
  client: PoolClient,
  email: string
) => {

  const { rows } = await client.query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    `,
    [email]
  );

  return rows[0];

};


export const updateSiteInfoRepo = async (
  client: PoolClient,
  siteId: string,
  data: any
) => {

  const { rows } = await client.query(
    `
    UPDATE sites
    SET
      site_name = COALESCE($1, site_name),
      phone = COALESCE($2, phone),
      address_line1 = COALESCE($3, address_line1),
      address_line2 = COALESCE($4, address_line2),
      state = COALESCE($5, state),
      country = COALESCE($6, country),
      gst_number = COALESCE($7, gst_number)
    WHERE id = $8
    RETURNING *
    `,
    [
      data.site_name,
      data.phone,
      data.address_line1,
      data.address_line2,
      data.state,
      data.country,
      data.gst_number,
      siteId
    ]
  )

  return rows[0]

}

export const removeViewerRepo = async (
  client: PoolClient,
  siteId: string,
  userId: string
) => {

  await client.query(
    `
    DELETE FROM site_user_roles
    WHERE site_id = $1
    AND user_id = $2
    AND role = 'site_viewer'
    `,
    [siteId, userId]
  )

}


export const replaceSiteAdminRepo = async (
  client: PoolClient,
  siteId: string,
  newAdminId: string
) => {

  await client.query(
    `
    DELETE FROM site_user_roles
    WHERE site_id = $1
    AND role = 'site_admin'
    `,
    [siteId]
  )

  await client.query(
    `
    INSERT INTO site_user_roles (site_id,user_id,role)
    VALUES ($1,$2,'site_admin')
    `,
    [siteId,newAdminId]
  )

}


export const getUserByIdRepo = async (
  client: PoolClient,
  userId: string
) => {

  const { rows } = await client.query(
    `SELECT * FROM users WHERE id=$1`,
    [userId]
  )

  return rows[0]

}


export const updateUserInfoRepo = async (
  client: PoolClient,
  userId: string,
  data: any
) => {

  const { rows } = await client.query(
    `
    UPDATE users
    SET
      full_name = COALESCE($1, full_name),
      phone = COALESCE($2, phone),
      birthdate = COALESCE($3, birthdate),
      gender = COALESCE($4, gender),
      aadhaar_pan_encrypted = COALESCE($5, aadhaar_pan_encrypted)
    WHERE id=$6
    RETURNING *
    `,
    [
      data.full_name,
      data.phone,
      data.birthdate,
      data.gender,
      data.aadhaar_pan_encrypted,
      userId
    ]
  )

  return rows[0]

}


export const updateUserPasswordRepo = async (
  client: PoolClient,
  userId: string,
  passwordHash: string
) => {

  await client.query(
    `
    UPDATE users
    SET password_hash=$1
    WHERE id=$2
    `,
    [passwordHash,userId]
  )

}

export const updateUserEmailRepo = async (
  client: PoolClient,
  userId: string,
  email: string
) => {

  await client.query(
    `
    UPDATE users
    SET email=$1
    WHERE id=$2
    `,
    [email,userId]
  )

}
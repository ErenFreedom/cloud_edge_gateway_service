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
  latitude,
  longitude,
  status,
  site_admin_email_activation_pending
)
VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
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
      data.gst_number ?? null,


      data.latitude,
      data.longitude
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
      phone,
      password_hash,
      aadhaar_pan_encrypted,
      birthdate,
      gender,
      role,
      status,
      email_verified
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
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
      user.phone ?? null,
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

  latitude,
  longitude,

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
      site_secret_hash = $2
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
    ON CONFLICT (site_id,user_id)
    DO NOTHING
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
  gst_number = COALESCE($7, gst_number),


  latitude = COALESCE($8, latitude),
  longitude = COALESCE($9, longitude)

WHERE id = $10
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


      data.latitude,
      data.longitude,

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
    [siteId, newAdminId]
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
    [passwordHash, userId]
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
    [email, userId]
  )

}

export const getSitesForManagerRepo = async (
  client: PoolClient,
  managerId: string
) => {

  const result = await client.query(
    `
    SELECT s.*
    FROM sites s
    JOIN org_site_manager_sites osms
      ON osms.site_id = s.id
    WHERE osms.manager_id = $1
    `,
    [managerId]
  )

  return result.rows

}


export const verifyManagerSiteAccessRepo = async (
  client: PoolClient,
  managerId: string,
  siteId: string
) => {

  const result = await client.query(
    `
    SELECT 1
    FROM org_site_manager_sites
    WHERE manager_id = $1
    AND site_id = $2
    `,
    [managerId, siteId]
  )

  return (result.rowCount ?? 0) > 0

}


export const getSiteDetailsRepo = async (
  client: PoolClient,
  siteId: string
) => {

  /* -------- SITE INFO -------- */

  const siteResult = await client.query(
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

  latitude,
  longitude,

  site_uuid,
  machine_fingerprint,
  status,
  created_at,
  activated_at

    FROM sites
    WHERE id = $1
    `,
    [siteId]
  );

  if (!siteResult.rows.length) {
    return null;
  }

  /* -------- SITE USERS -------- */

  const usersResult = await client.query(
    `
    SELECT
      u.id,
      u.organization_id,
      u.full_name,
      u.email,
      u.phone,

      '******' AS password_hash,
      '******' AS aadhaar_pan,

      u.birthdate,
      u.gender,
      u.role,
      u.status,
      u.created_at,
      u.email_verified,
      u.platform_role

    FROM users u
    JOIN site_user_roles sur
      ON sur.user_id = u.id

    WHERE sur.site_id = $1
    `,
    [siteId]
  );

  const users = usersResult.rows;

  const siteAdmin = users.find(
    (u) => u.role === "site_admin"
  );

  const viewers = users.filter(
    (u) => u.role === "site_viewer"
  );

  return {
    site: siteResult.rows[0],
    site_admin: siteAdmin || null,
    viewers
  };

};



export const createEmailChangeOtpRepo = async (
  client: PoolClient,
  userId: string,
  newEmail: string,
  otp: string
) => {

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  )

  const result = await client.query(
    `
    INSERT INTO email_change_otps
    (user_id,new_email,otp,expires_at)
    VALUES ($1,$2,$3,$4)
    RETURNING id
    `,
    [userId, newEmail, otp, expiresAt]
  )

  return result.rows[0]

}


export const findValidEmailChangeOtpRepo = async (
  otpId: string,
  otp: string
) => {

  const result = await pool.query(
    `
    SELECT *
    FROM email_change_otps
    WHERE id=$1
      AND otp=$2
      AND verified=false
      AND expires_at > NOW()
    `,
    [otpId, otp]
  )

  return result.rows[0]

}

export const markEmailChangeOtpVerifiedRepo = async (
  client: PoolClient,
  otpId: string
) => {

  await client.query(
    `
    UPDATE email_change_otps
    SET verified=true
    WHERE id=$1
    `,
    [otpId]
  )

}

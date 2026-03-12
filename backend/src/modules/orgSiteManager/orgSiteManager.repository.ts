import { PoolClient } from "pg";

export const findUserByEmailRepo = async (
  client: PoolClient,
  email: string
) => {

  const result = await client.query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    `,
    [email]
  )

  return result.rows[0]

}



export const createOrgSiteManagerRepo = async (
  client: PoolClient,
  organizationId: string,
  payload: any,
  passwordHash: string,
  encryptedIdentity: string
) => {

  const result = await client.query(
    `
    INSERT INTO users
    (
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
    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8,
      'org_site_manager',
      'pending',
      false
    )
    RETURNING *
    `,
    [
      organizationId,
      payload.full_name,
      payload.email,
      payload.phone,
      passwordHash,
      encryptedIdentity,
      payload.birthdate,
      payload.gender
    ]
  )

  return result.rows[0]

}



export const assignManagerToSiteRepo = async (
  client: PoolClient,
  managerId: string,
  siteId: string
) => {

  await client.query(
    `
    INSERT INTO org_site_manager_sites
    (manager_id, site_id)
    VALUES ($1,$2)
    `,
    [managerId, siteId]
  )

}



export const checkSiteAlreadyAssignedRepo = async (
  client: PoolClient,
  siteId: string
) => {

  const result = await client.query(
    `
    SELECT *
    FROM org_site_manager_sites
    WHERE site_id = $1
    `,
    [siteId]
  )

  return result.rows.length > 0

}



export const createManagerOtpRepo = async (
  client: PoolClient,
  userId: string,
  otp: string
) => {

  const result = await client.query(
    `
    INSERT INTO login_otps
    (user_id, otp)
    VALUES ($1,$2)
    RETURNING id
    `,
    [userId, otp]
  )

  return result.rows[0]

}


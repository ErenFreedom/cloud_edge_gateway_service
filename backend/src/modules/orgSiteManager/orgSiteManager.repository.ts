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


export const verifyManagerOtpRepo = async (
  client: PoolClient,
  userId: string,
  otp: string
) => {

  const result = await client.query(
    `
    SELECT *
    FROM login_otps
    WHERE user_id = $1
      AND otp_code = $2
      AND verified = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, otp]
  );

  return result.rows[0];
};

export const markOtpVerifiedRepo = async (
  client: PoolClient,
  otpId: string
) => {

  await client.query(
    `
    UPDATE login_otps
    SET verified = true
    WHERE id = $1
    `,
    [otpId]
  );
};

export const activateManagerRepo = async (
  client: PoolClient,
  userId: string
) => {

  await client.query(
    `
    UPDATE users
    SET email_verified = true,
        status = 'active'
    WHERE id = $1
    `,
    [userId]
  );
};



export const assignManagerToSiteRepo = async (
  client: PoolClient,
  managerId: string,
  siteId: string
) => {

  await client.query(
    `
    INSERT INTO site_manager_sites
    (manager_id, site_id)
    VALUES ($1, $2)
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
    SELECT 1
    FROM site_manager_sites
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
    (user_id, otp_code, verified, expires_at)
    VALUES ($1, $2, false, NOW() + INTERVAL '10 minutes')
    RETURNING id
    `,
    [userId, otp]
  )

  return result.rows[0]

}



export const findManagerByIdRepo = async (
  client: PoolClient,
  managerId: string
) => {
  const result = await client.query(
    `
    SELECT id, role
    FROM users
    WHERE id = $1
    `,
    [managerId]
  )

  return result.rows[0]
}


export const removeManagerSiteRepo = async (
  client: PoolClient,
  managerId: string,
  siteId: string
) => {

  await client.query(
    `
    DELETE FROM site_manager_sites
    WHERE manager_id = $1 AND site_id = $2
    `,
    [managerId, siteId]
  )

}


export const getAllManagersRepo = async (
  client: PoolClient,
  organizationId: string
) => {

  const result = await client.query(
    `
    SELECT id, email, full_name
    FROM users
    WHERE organization_id = $1
    AND role = 'org_site_manager'
    `,
    [organizationId]
  )

  return result.rows;
};

export const getAllSitesRepo = async (
  client: PoolClient,
  organizationId: string
) => {

  const result = await client.query(
    `
    SELECT id, site_name
    FROM sites
    WHERE organization_id = $1
    `,
    [organizationId]
  )

  return result.rows;
};


export const getManagerScopeRepo = async (
  client: PoolClient,
  managerId: string
) => {

  const result = await client.query(
    `
    SELECT s.id, s.site_name
    FROM site_manager_sites ms
    JOIN sites s ON s.id = ms.site_id
    WHERE ms.manager_id = $1
    `,
    [managerId]
  )

  return result.rows;
};


export const countManagerSitesRepo = async (
  client: PoolClient,
  managerId: string
) => {

  const result = await client.query(
    `
    SELECT COUNT(*) as count
    FROM site_manager_sites
    WHERE manager_id = $1
    `,
    [managerId]
  )

  return Number(result.rows[0].count);
};


export const getManagerSitesRepo = async (
  client: PoolClient,
  managerId: string
) => {

  const result = await client.query(
    `
    SELECT s.*
    FROM site_manager_sites sms
    JOIN sites s ON s.id = sms.site_id
    WHERE sms.manager_id = $1
    `,
    [managerId]
  );

  return result.rows;
};
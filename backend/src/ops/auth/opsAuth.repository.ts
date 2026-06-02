import { pool } from '../../config/database';

export const findOpsUserByEmail = async (email: string) => {
  const result = await pool.query(
    `
    SELECT 
      id,
      email,
      password_hash,
      role,
      status,
      organization_id
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0];
};

export const findOpsUserById = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT 
      id,
      email,
      role,
      status,
      organization_id
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0];
};

export const insertOpsLoginOtp = async (
  userId: string,
  otp: string
) => {
  const result = await pool.query(
    `
    INSERT INTO login_otps (
      user_id,
      otp_code,
      expires_at,
      verified
    )
    VALUES (
      $1,
      $2,
      NOW() + INTERVAL '10 minutes',
      false
    )
    RETURNING id
    `,
    [userId, otp]
  );

  return result.rows[0];
};

export const findValidOpsOtp = async (
  tempLoginId: string,
  otp: string
) => {
  const result = await pool.query(
    `
    SELECT *
    FROM login_otps
    WHERE id = $1
      AND otp_code = $2
      AND verified = false
      AND expires_at > NOW()
    LIMIT 1
    `,
    [tempLoginId, otp]
  );

  return result.rows[0];
};

export const markOpsOtpVerified = async (otpId: string) => {
  await pool.query(
    `
    UPDATE login_otps
    SET verified = true
    WHERE id = $1
    `,
    [otpId]
  );
};


export const findOtpByTempLoginId = async (
  tempLoginId: string
) => {
  const result = await pool.query(
    `
    SELECT *
    FROM login_otps
    WHERE id = $1
    LIMIT 1
    `,
    [tempLoginId]
  );

  return result.rows[0];
};
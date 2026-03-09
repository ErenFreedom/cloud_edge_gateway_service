import { pool } from '../../config/database';

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email]
  );

  return rows[0];
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return rows[0];
};

/**
 * Insert login OTP
 */
export const insertLoginOtp = async (
  userId: string,
  otp: string
) => {
  const { rows } = await pool.query(
    `
    INSERT INTO login_otps (
      user_id,
      otp_code,
      expires_at
    )
    VALUES (
      $1,
      $2,
      now() + interval '10 minutes'
    )
    RETURNING *;
    `,
    [userId, otp]
  );

  return rows[0];
};

/**
 * Find valid OTP
 */
export const findValidOtp = async (
  tempLoginId: string,
  otp: string
) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM login_otps
    WHERE id = $1
      AND otp_code = $2
      AND verified = false
      AND expires_at > now()
    LIMIT 1;
    `,
    [tempLoginId, otp]
  );

  return rows[0];
};

/**
 * Mark OTP as verified
 */
export const markOtpVerified = async (id: string) => {
  await pool.query(
    `
    UPDATE login_otps
    SET verified = true
    WHERE id = $1;
    `,
    [id]
  );
};
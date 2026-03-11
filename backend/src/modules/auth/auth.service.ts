import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import {
  findUserByEmail,
  insertLoginOtp,
  findValidOtp,
  markOtpVerified,
  findUserById
} from './auth.repository';
import { sendEmail } from '../../common/utils/email';

/**
 * LOGIN SERVICE
 */
export const loginService = async (
  email: string,
  password: string
) => {
  const user = await findUserByEmail(email);

  if (!user) throw new Error('Invalid credentials');

  const match = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!match) throw new Error('Invalid credentials');

  if (user.status !== 'active')
    throw new Error('Account inactive');

  /**
   * 🔥 PLATFORM ADMIN → DIRECT LOGIN
   */
  if (user.role === 'platform_admin') {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        organizationId: null
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        organizationId: null
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      requiresOtp: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * 🔥 OTHER USERS → OTP FLOW
   */
  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const otpRecord = await insertLoginOtp(user.id, otp);

  await sendEmail(
    user.email,
    'Your Login OTP',
    `<h3>Your login OTP is: ${otp}</h3>`
  );

  return {
    message: 'OTP sent to your email',
    tempLoginId: otpRecord.id,
    requiresOtp: true
  };
};

/**
 * VERIFY OTP (For non-platform users)
 */
export const verifyLoginOtpService = async (
  tempLoginId: string,
  otp: string
) => {
  const record = await findValidOtp(tempLoginId, otp);

  if (!record) throw new Error('Invalid or expired OTP');

  await markOtpVerified(record.id);

  const user = await findUserById(record.user_id);

  if (!user) throw new Error('User not found');

  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      organizationId: user.organization_id ?? null
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      organizationId: user.organization_id ?? null
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
};

/**
 * REFRESH TOKEN
 */
export const refreshService = async (
  refreshToken: string
) => {
  try {
    const payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as any;

    const accessToken = jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        organizationId: payload.organizationId
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    return { accessToken };
  } catch {
    throw new Error('Invalid refresh token');
  }
};
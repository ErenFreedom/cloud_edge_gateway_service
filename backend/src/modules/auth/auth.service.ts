import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { env } from "../../config/env";

import {
  findUserByEmail,
  insertLoginOtp,
  findValidOtp,
  markOtpVerified,
  findUserById,
} from "./auth.repository";

import { sendEmail } from "../../common/utils/email";

import {
  createAuthSession,
  deleteAuthSession,
  getAuthSession,
  rotateSessionRefreshToken,
  validateRefreshTokenForSession,
} from "../../services/redis_server/authSession.service";

type AuthMeta = {
  ip?: string;
  userAgent?: string;
};

const DASHBOARD = "admin" as const;

const signAccessToken = (
  user: any,
  sessionId: string
) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id ?? null,
      sessionId,
      dashboard: DASHBOARD,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

const signRefreshToken = (
  user: any,
  sessionId: string
) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id ?? null,
      sessionId,
      dashboard: DASHBOARD,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
};

const createTokensAndSession = async (
  user: any,
  meta?: AuthMeta
) => {
  const sessionId = crypto.randomUUID();

  const accessToken = signAccessToken(user, sessionId);
  const refreshToken = signRefreshToken(user, sessionId);

  await createAuthSession({
    sessionId,
    userId: user.id,
    role: user.role,
    organizationId: user.organization_id ?? null,
    dashboard: DASHBOARD,
    refreshToken,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id ?? null,
    },
  };
};

export const loginService = async (
  email: string,
  password: string,
  meta?: AuthMeta
) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const match = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!match) {
    throw new Error("Invalid credentials");
  }

  if (user.status !== "active") {
    throw new Error("Account inactive");
  }

  if (user.role === "platform_admin") {
    const sessionResult = await createTokensAndSession(
      user,
      meta
    );

    return {
      ...sessionResult,
      requiresOtp: false,
    };
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const otpRecord = await insertLoginOtp(user.id, otp);

  await sendEmail(
    user.email,
    "Your Login OTP",
    `<h3>Your login OTP is: ${otp}</h3>`
  );

  return {
    message: "OTP sent to your email",
    tempLoginId: otpRecord.id,
    requiresOtp: true,
  };
};

export const verifyLoginOtpService = async (
  tempLoginId: string,
  otp: string,
  meta?: AuthMeta
) => {
  const record = await findValidOtp(tempLoginId, otp);

  if (!record) {
    throw new Error("Invalid or expired OTP");
  }

  await markOtpVerified(record.id);

  const user = await findUserById(record.user_id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "active") {
    throw new Error("Account inactive");
  }

  return await createTokensAndSession(user, meta);
};

export const refreshService = async (
  refreshToken: string
) => {
  try {
    const payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as any;

    if (payload.dashboard !== DASHBOARD) {
      throw new Error("Invalid token dashboard");
    }

    if (!payload.sessionId) {
      throw new Error("Session missing");
    }

    const session =
      await validateRefreshTokenForSession(
        DASHBOARD,
        payload.sessionId,
        refreshToken
      );

    const newRefreshToken = jwt.sign(
      {
        userId: session.userId,
        role: session.role,
        organizationId: session.organizationId,
        sessionId: session.sessionId,
        dashboard: DASHBOARD,
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    await rotateSessionRefreshToken(
      DASHBOARD,
      session.sessionId,
      newRefreshToken
    );

    const accessToken = jwt.sign(
      {
        userId: session.userId,
        role: session.role,
        organizationId: session.organizationId,
        sessionId: session.sessionId,
        dashboard: DASHBOARD,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch {
    throw new Error("Invalid refresh token");
  }
};

export const logoutService = async (
  refreshToken?: string
) => {
  if (!refreshToken) return;

  try {
    const payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as any;

    if (
      payload.dashboard === DASHBOARD &&
      payload.sessionId
    ) {
      const session = await getAuthSession(
        DASHBOARD,
        payload.sessionId
      );

      if (session) {
        await deleteAuthSession(
          DASHBOARD,
          payload.sessionId
        );
      }
    }
  } catch {
    return;
  }
};
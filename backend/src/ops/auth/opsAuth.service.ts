import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { env } from "../../config/env";
import { sendEmail } from "../../common/utils/email";

import {
  findOpsUserByEmail,
  insertOpsLoginOtp,
  findValidOpsOtp,
  markOpsOtpVerified,
  findOpsUserById,
  findOtpByTempLoginId,
} from "./opsAuth.repository";

import {
  createAuthSession,
  deleteAuthSession,
  getAuthSession,
  rotateSessionRefreshToken,
  validateRefreshTokenForSession,
} from "../../services/redis_server/authSession.service";

const OPS_ALLOWED_ROLES = ["super_admin"] as const;
const DASHBOARD = "ops" as const;
const PURPOSE = "ops_dashboard";

type OpsAuthMeta = {
  ip?: string;
  userAgent?: string;
};

const isOpsAllowedRole = (role: string) => {
  return OPS_ALLOWED_ROLES.includes(role as any);
};

const signOpsAccessToken = (
  user: any,
  sessionId: string
) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId,
      dashboard: DASHBOARD,
      purpose: PURPOSE,
    },
    env.OPS_JWT_ACCESS_SECRET,
    { expiresIn: env.OPS_JWT_ACCESS_EXPIRES_IN }
  );
};

const signOpsRefreshToken = (
  user: any,
  sessionId: string
) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId,
      dashboard: DASHBOARD,
      purpose: PURPOSE,
    },
    env.OPS_JWT_REFRESH_SECRET,
    { expiresIn: env.OPS_JWT_REFRESH_EXPIRES_IN }
  );
};

const createOpsTokensAndSession = async (
  user: any,
  meta?: OpsAuthMeta
) => {
  const sessionId = crypto.randomUUID();

  const accessToken = signOpsAccessToken(user, sessionId);
  const refreshToken = signOpsRefreshToken(user, sessionId);

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
      organizationId: user.organization_id,
    },
  };
};

export const opsLoginService = async (
  email: string,
  password: string
) => {
  const user = await findOpsUserByEmail(email);
 

  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(
    password,
    user.password_hash
  );

  

  if (!match) throw new Error("Invalid credentials");

  if (user.status !== "active") {
    throw new Error("Account inactive");
  }

  if (!user.organization_id) {
    throw new Error("Organization not found for this user");
  }

  if (!isOpsAllowedRole(user.role)) {
    throw new Error("You are not allowed to access Ops Dashboard");
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const otpRecord = await insertOpsLoginOtp(user.id, otp);

  await sendEmail(
    user.email,
    "Your Ops Dashboard Login OTP",
    `
      <h2>Ops Dashboard Login</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `
  );

  return {
    message: "OTP sent to your email",
    tempLoginId: otpRecord.id,
    requiresOtp: true,
  };
};

export const verifyOpsOtpService = async (
  tempLoginId: string,
  otp: string,
  meta?: OpsAuthMeta
) => {
  const record = await findValidOpsOtp(tempLoginId, otp);

  if (!record) {
    throw new Error("Invalid or expired OTP");
  }

  await markOpsOtpVerified(record.id);

  const user = await findOpsUserById(record.user_id);

  if (!user) throw new Error("User not found");

  if (user.status !== "active") {
    throw new Error("Account inactive");
  }

  if (!isOpsAllowedRole(user.role)) {
    throw new Error("You are not allowed to access Ops Dashboard");
  }

  return await createOpsTokensAndSession(user, meta);
};

export const refreshOpsTokenService = async (
  refreshToken: string
) => {
  try {
    const payload = jwt.verify(
      refreshToken,
      env.OPS_JWT_REFRESH_SECRET
    ) as any;

    if (payload.purpose !== PURPOSE) {
      throw new Error("Invalid token purpose");
    }

    if (payload.dashboard !== DASHBOARD) {
      throw new Error("Invalid dashboard session");
    }

    if (!payload.sessionId) {
      throw new Error("Session missing");
    }

    const session = await validateRefreshTokenForSession(
      DASHBOARD,
      payload.sessionId,
      refreshToken
    );

    const userPayload = {
      id: session.userId,
      email: payload.email,
      role: session.role,
      organization_id: session.organizationId,
    };

    const newRefreshToken = signOpsRefreshToken(
      userPayload,
      session.sessionId
    );

    await rotateSessionRefreshToken(
      DASHBOARD,
      session.sessionId,
      newRefreshToken
    );

    const accessToken = signOpsAccessToken(
      userPayload,
      session.sessionId
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch {
    throw new Error("Invalid refresh token");
  }
};

export const logoutOpsService = async (
  refreshToken?: string
) => {
  if (!refreshToken) return;

  try {
    const payload = jwt.verify(
      refreshToken,
      env.OPS_JWT_REFRESH_SECRET
    ) as any;

    if (
      payload.purpose === PURPOSE &&
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

export const resendOpsOtpService = async (
  tempLoginId: string
) => {
  const otpRecord = await findOtpByTempLoginId(
    tempLoginId
  );

  if (!otpRecord) {
    throw new Error("Login session not found");
  }

  const user = await findOpsUserById(
    otpRecord.user_id
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (!isOpsAllowedRole(user.role)) {
    throw new Error("You are not allowed to access Ops Dashboard");
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const newRecord = await insertOpsLoginOtp(
    user.id,
    otp
  );

  await sendEmail(
    user.email,
    "Your Ops Dashboard Login OTP",
    `
      <h2>Ops Dashboard Login</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `
  );

  return {
    message: "OTP resent successfully",
    tempLoginId: newRecord.id,
  };
};
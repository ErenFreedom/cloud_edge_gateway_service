import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { sendEmail } from "../../common/utils/email";

import {
  findOpsUserByEmail,
  insertOpsLoginOtp,
  findValidOpsOtp,
  markOpsOtpVerified,
  findOpsUserById,
  findOtpByTempLoginId
} from "./opsAuth.repository";

const OPS_ALLOWED_ROLES = ["super_admin"] as const;

const isOpsAllowedRole = (role: string) => {
  return OPS_ALLOWED_ROLES.includes(role as any);
};

const signOpsAccessToken = (user: any) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      purpose: "ops_dashboard",
    },
    env.OPS_JWT_ACCESS_SECRET,
    { expiresIn: env.OPS_JWT_ACCESS_EXPIRES_IN }
  );
};

const signOpsRefreshToken = (user: any) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      purpose: "ops_dashboard",
    },
    env.OPS_JWT_REFRESH_SECRET,
    { expiresIn: env.OPS_JWT_REFRESH_EXPIRES_IN }
  );
};

export const opsLoginService = async (
  email: string,
  password: string
) => {
  const user = await findOpsUserByEmail(email);

  if (!user) throw new Error("Invalid credentials");

  const match = await bcrypt.compare(password, user.password_hash);

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

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
  otp: string
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

  const accessToken = signOpsAccessToken(user);
  const refreshToken = signOpsRefreshToken(user);

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

export const refreshOpsTokenService = async (
  refreshToken: string
) => {
  try {
    const payload = jwt.verify(
      refreshToken,
      env.OPS_JWT_REFRESH_SECRET
    ) as any;

    if (payload.purpose !== "ops_dashboard") {
      throw new Error("Invalid token purpose");
    }

    const accessToken = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
        purpose: "ops_dashboard",
      },
      env.OPS_JWT_ACCESS_SECRET,
      { expiresIn: env.OPS_JWT_ACCESS_EXPIRES_IN }
    );

    return { accessToken };
  } catch {
    throw new Error("Invalid refresh token");
  }
};


export const resendOpsOtpService =
  async (
    tempLoginId: string
  ) => {
    const otpRecord =
      await findOtpByTempLoginId(
        tempLoginId
      );

    if (!otpRecord) {
      throw new Error(
        "Login session not found"
      );
    }

    const user =
      await findOpsUserById(
        otpRecord.user_id
      );

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    if (
      !isOpsAllowedRole(
        user.role
      )
    ) {
      throw new Error(
        "You are not allowed to access Ops Dashboard"
      );
    }

    const otp =
      Math.floor(
        100000 +
          Math.random() *
            900000
      ).toString();

    const newRecord =
      await insertOpsLoginOtp(
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
      message:
        "OTP resent successfully",
      tempLoginId:
        newRecord.id,
    };
  };
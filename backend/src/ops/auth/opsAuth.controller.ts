import { Request, Response } from "express";

import {
  opsLoginService,
  verifyOpsOtpService,
  refreshOpsTokenService,
  resendOpsOtpService,
  logoutOpsService,
} from "./opsAuth.service";

import {
  validateOpsLogin,
  validateOpsOtp,
  validateResendOpsOtp,
} from "./opsAuth.validator";

const opsRefreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const opsLoginController = async (
  req: Request,
  res: Response
) => {
  try {
    validateOpsLogin(req.body);

    const result = await opsLoginService(
      req.body.email,
      req.body.password
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Ops login failed",
    });
  }
};

export const verifyOpsOtpController = async (
  req: Request,
  res: Response
) => {
  try {
    validateOpsOtp(req.body);

    const result = await verifyOpsOtpService(
      req.body.tempLoginId,
      req.body.otp,
      {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      }
    );

    res.cookie(
      "opsRefreshToken",
      result.refreshToken,
      opsRefreshCookieOptions
    );

    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "OTP verification failed",
    });
  }
};

export const refreshOpsTokenController = async (
  req: Request,
  res: Response
) => {
  try {
    const refreshToken =
      req.cookies?.opsRefreshToken ||
      req.body.refreshToken;

    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const result =
      await refreshOpsTokenService(refreshToken);

    res.cookie(
      "opsRefreshToken",
      result.refreshToken,
      opsRefreshCookieOptions
    );

    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    return res.status(401).json({
      message: error.message || "Refresh failed",
    });
  }
};

export const resendOpsOtpController = async (
  req: Request,
  res: Response
) => {
  try {
    validateResendOpsOtp(req.body);

    const result = await resendOpsOtpService(
      req.body.tempLoginId
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message:
        error.message ||
        "Failed to resend OTP",
    });
  }
};

export const logoutOpsController = async (
  req: Request,
  res: Response
) => {
  const refreshToken =
    req.cookies?.opsRefreshToken ||
    req.body.refreshToken;

  await logoutOpsService(refreshToken);

  res.clearCookie("opsRefreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.json({
    message: "Logged out",
  });
};
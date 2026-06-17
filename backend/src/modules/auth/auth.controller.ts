import { Request, Response } from "express";

import {
  loginService,
  verifyLoginOtpService,
  refreshService,
  logoutService,
} from "./auth.service";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const login = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;

  const result = await loginService(
    email,
    password,
    {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    }
  );

  if (
    result.requiresOtp === false &&
    "refreshToken" in result
  ) {
    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions
    );

    return res.json({
      accessToken: result.accessToken,
      requiresOtp: false,
      user: result.user,
    });
  }

  res.json(result);
};

export const verifyLoginOtp = async (
  req: Request,
  res: Response
) => {
  const { tempLoginId, otp } = req.body;

  const {
    accessToken,
    refreshToken,
    user,
  } = await verifyLoginOtpService(
    tempLoginId,
    otp,
    {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    }
  );

  res.cookie(
    "refreshToken",
    refreshToken,
    refreshCookieOptions
  );

  res.json({
    accessToken,
    user,
  });
};

export const refresh = async (
  req: Request,
  res: Response
) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      message: "No refresh token",
    });
  }

  const result = await refreshService(token);

  res.cookie(
    "refreshToken",
    result.refreshToken,
    refreshCookieOptions
  );

  res.json({
    accessToken: result.accessToken,
  });
};

export const logout = async (
  req: Request,
  res: Response
) => {
  const token = req.cookies.refreshToken;

  await logoutService(token);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.json({
    message: "Logged out",
  });
};
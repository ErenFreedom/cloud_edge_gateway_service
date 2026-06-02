import { Request, Response } from "express";
import {
  opsLoginService,
  verifyOpsOtpService,
  refreshOpsTokenService,
  resendOpsOtpService
} from "./opsAuth.service";
import {
  validateOpsLogin,
  validateOpsOtp,
  validateResendOpsOtp
} from "./opsAuth.validator";

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
      req.body.otp
    );

    return res.status(200).json(result);
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new Error("Refresh token required");
    }

    const result = await refreshOpsTokenService(refreshToken);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({
      message: error.message || "Refresh failed",
    });
  }
};


export const resendOpsOtpController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      validateResendOpsOtp(
        req.body
      );

      const result =
        await resendOpsOtpService(
          req.body
            .tempLoginId
        );

      return res
        .status(200)
        .json(result);
    } catch (
      error: any
    ) {
      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Failed to resend OTP",
        });
    }
  };
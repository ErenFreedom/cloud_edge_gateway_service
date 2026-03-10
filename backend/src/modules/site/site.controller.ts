import { Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";
import { getSitesService } from "./site.service";
import {
  createSiteService,
  verifySiteAdminOtpService
} from "./site.service";




export const createSite = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const superAdminId = req.user?.userId;

    if (!superAdminId)
      return res.status(401).json({
        message: "Unauthorized"
      });

    const result = await createSiteService(
      superAdminId,
      req.body
    );

    res.status(201).json(result);

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};




export const verifySiteAdminOtp = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const { otpId, otp } = req.body;

    const result = await verifySiteAdminOtpService(
      otpId,
      otp
    );

    res.json(result);

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};


export const getSites = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      });

    const sites = await getSitesService(
      user.userId,
      user.role,
      user.organizationId
    );

    res.json(sites);

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};
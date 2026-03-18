import { Request,Response } from "express";

import { AuthRequest } from "../../middleware/auth.middleware";

import {
  createSiteService,
  verifySiteAdminOtpService,
  unlockSiteCredentialsService,
  regenerateSiteCredentialsService,
  editSiteService,
  editSiteUserService,
  getSitesService,
  getSiteDetailsService,
  requestEmailChangeService,
  verifyEmailChangeService
} from "./site.service";

export const createSite = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const userId = req.user?.userId;

    if (!userId)
      return res.status(401).json({
        message: "Unauthorized"
      });

    const result = await createSiteService(
      userId,
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



export const unlockSiteCredentials = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      });

    const { password, siteId } = req.body;

    const result = await unlockSiteCredentialsService(
      user.userId,
      password,
      siteId
    );

    res.json(result);

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};



export const regenerateSiteCredentials = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      });

    const { password, siteId } = req.body;

    const result =
      await regenerateSiteCredentialsService(
        user.userId,
        password,
        siteId
      );

    res.json({
      message: "New credentials generated",
      credentials: result
    });

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};



export const editSite = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      });

    const siteId = req.params.siteId as string;

    const result = await editSiteService(
      user.userId,
      siteId,
      req.body
    );

    res.json(result);

  }
  catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};



export const editSiteUser = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      });

    const result =
      await editSiteUserService(
        user.userId,
        req.body
      );

    res.json(result);

  }
  catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};


export const getSiteDetailsController = async (
  req: Request<{ siteId: string }>,
  res: Response
) => {

  try {

    const user = (req as any).user;

    const { siteId } = req.params;

    const result =
      await getSiteDetailsService(
        user.userId,
        user.role,
        siteId
      );

    res.json(result);

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    });

  }

};


export const requestEmailChangeController = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      })

    const result =
      await requestEmailChangeService(
        user.userId,
        req.body
      )

    res.json(result)

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    })

  }

}


export const verifyEmailChangeController = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user

    if (!user)
      return res.status(401).json({
        message: "Unauthorized"
      })

    const result =
      await verifyEmailChangeService(
        user.userId,   
        req.body
      )

    res.json(result)

  } catch (error: any) {

    res.status(400).json({
      message: error.message
    })

  }

}
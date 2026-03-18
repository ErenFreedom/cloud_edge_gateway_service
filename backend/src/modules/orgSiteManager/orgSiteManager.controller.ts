import { Request, Response } from "express"
import { createOrgSiteManagerService , assignSitesToManagerService, removeSitesFromManagerService
  , getManagersAndSitesService, getManagerScopeService, verifyManagerOtpService, getMySitesService
} from "./orgSiteManager.service"
import { AuthRequest } from "../../middleware/auth.middleware"

export const createOrgSiteManager = async (
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
      await createOrgSiteManagerService(
        user.userId,
        req.body
      )

    res.json(result)

  }
  catch (error: any) {

    res.status(400).json({
      message: error.message
    })

  }

}


export const verifyManagerOtp = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { managerId, otp } = req.body;

    const result = await verifyManagerOtpService(
      user.userId,
      managerId,
      otp
    );

    res.json(result);

  } catch (err: any) {

    res.status(400).json({
      message: err.message
    });

  }
};



export const assignSitesToManager = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user

    if (!user)
      return res.status(401).json({ message: "Unauthorized" })

    const { managerId, siteIds } = req.body

    const result = await assignSitesToManagerService(
      user.userId,
      managerId,
      siteIds
    )

    res.json(result)

  } catch (err: any) {

    res.status(400).json({ message: err.message })

  }

}


export const removeSitesFromManager = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user

    if (!user)
      return res.status(401).json({ message: "Unauthorized" })

    const { managerId, siteIds } = req.body

    const result = await removeSitesFromManagerService(
      user.userId,
      managerId,
      siteIds
    )

    res.json(result)

  } catch (err: any) {

    res.status(400).json({ message: err.message })

  }


  
}


export const getManagersAndSites = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({ message: "Unauthorized" });

    const result =
      await getManagersAndSitesService(user.userId);

    res.json(result);

  } catch (err: any) {

    res.status(400).json({ message: err.message });

  }

};

export const getManagerScope = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({ message: "Unauthorized" });

    const managerId = Array.isArray(req.params.managerId)
      ? req.params.managerId[0]
      : req.params.managerId;

    const result =
      await getManagerScopeService(
        user.userId,
        managerId
      );

    res.json(result);

  } catch (err: any) {

    res.status(400).json({ message: err.message });

  }

};


export const getMySites = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const user = req.user;

    if (!user)
      return res.status(401).json({ message: "Unauthorized" });

    const result = await getMySitesService(user.userId);

    res.json(result);

  } catch (err: any) {

    res.status(400).json({
      message: err.message
    });

  }
};
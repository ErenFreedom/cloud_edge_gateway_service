import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";

import {
  inviteSiteMonitorService,
  verifySiteMonitorOtpService,
  listSiteMonitorsService,
  getSiteMonitorByIdService,
  updateSiteMonitorService,
  changeSiteMonitorPasswordService,
  deleteSiteMonitorService,
} from "./siteMonitor.service";

const getAuthUser = (req: AuthRequest) => {
  if (!req.user) {
    throw new Error("Unauthorized");
  }

  return req.user;
};

const getParamId = (id: unknown): string => {
  if (!id || typeof id !== "string") {
    throw new Error("Invalid id");
  }

  return id;
};

export const inviteSiteMonitorController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await inviteSiteMonitorService(
      getAuthUser(req),
      req.body
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const verifySiteMonitorOtpController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await verifySiteMonitorOtpService(req.body);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const listSiteMonitorsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await listSiteMonitorsService(
      getAuthUser(req)
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const getSiteMonitorByIdController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const monitorId = getParamId(req.params.id);

    const result = await getSiteMonitorByIdService(
      getAuthUser(req),
      monitorId
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateSiteMonitorController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const monitorId = getParamId(req.params.id);

    const result = await updateSiteMonitorService(
      getAuthUser(req),
      monitorId,
      req.body
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const changeSiteMonitorPasswordController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await changeSiteMonitorPasswordService(
      getAuthUser(req),
      req.body
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteSiteMonitorController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const monitorId = getParamId(req.params.id);

    const result = await deleteSiteMonitorService(
      getAuthUser(req),
      monitorId
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};
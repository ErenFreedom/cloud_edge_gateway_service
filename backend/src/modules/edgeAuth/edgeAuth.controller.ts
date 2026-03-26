
import { Request, Response } from "express";
import {
  edgeLoginService,
  activateSiteService,
  requestActivationService,
  getPendingRequestsService,
  approveActivationService,
  rejectActivationService,
  suspendSiteService,
  deleteSiteService
} from "./edgeAuth.service";

export const edgeLoginController = async (req: Request, res: Response) => {
  try {
    const result = await edgeLoginService(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const activateSiteController = async (req: Request, res: Response) => {
  try {
    const result = await activateSiteService(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const requestActivationController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await requestActivationService(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getPendingRequestsController = async (
  _req: Request,
  res: Response
) => {
  try {
    const result = await getPendingRequestsService();
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const approveActivationController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await approveActivationService(req.body.request_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const rejectActivationController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await rejectActivationService(req.body.request_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const suspendSiteController = async (req: Request, res: Response) => {
  try {
    const result = await suspendSiteService(req.body.site_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteSiteController = async (req: Request, res: Response) => {
  try {
    const result = await deleteSiteService(req.body.site_id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
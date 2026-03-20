
import { Request, Response } from "express";
import {
  edgeLoginService,
  activateSiteService
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
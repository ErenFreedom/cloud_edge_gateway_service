import { Response } from "express";
import {
  getTimeSeriesService,
  generateClientTokenService,
  getSensorsService,
  getClientConfigService,
  saveClientConfigService
} from "./client.service";
import { validateTimeSeries, validateGenerateToken } from "./client.validator";


/* ============================= */
/* GENERATE TOKEN */
/* ============================= */

export const generateClientToken = async (req: any, res: Response) => {
  try {
    validateGenerateToken(req.body);

    const data = await generateClientTokenService(
      req.user, // super admin JWT
      req.body
    );

    res.json(data);

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const getClientConfig = async (req: any, res: Response) => {
  try {
    const { site_id } = req.query;

    if (!site_id) {
      throw new Error("site_id required");
    }

    const data = await getClientConfigService(
      req.user,
      site_id
    );

    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const saveClientConfig = async (req: any, res: Response) => {
  try {

    const data = await saveClientConfigService(
      req.user,
      req.body
    );

    res.json(data);

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

/* ============================= */
/* TIMESERIES (CLIENT TOKEN BASED) */
/* ============================= */

export const getTimeSeries = async (req: any, res: Response) => {
  try {

    

    const data = await getTimeSeriesService(req.client);

    res.json(data);

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};



export const getSensors = async (req: any, res: Response) => {
  try {

    const { site_id } = req.query;

    if (!site_id) {
      throw new Error("site_id required");
    }

    const data = await getSensorsService(
      req.user,     // ✅ FIXED
      site_id       // ✅ FIXED
    );

    res.json(data);

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

import { Response } from "express";
import { getTimeSeriesService, generateClientTokenService } from "./client.service";
import { validateTimeSeries, validateGenerateToken } from "./client.validator";


export const generateClientToken = async (req: any, res: Response) => {
  try {
    validateGenerateToken(req.body);

    const data = await generateClientTokenService(
      req.user, //  super admin JWT
      req.body
    );

    res.json(data);

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getTimeSeries = async (req: any, res: Response) => {
  try {
    validateTimeSeries(req.body);

    const data = await getTimeSeriesService(
      req.client,
      req.body
    );

    res.json(data);

  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
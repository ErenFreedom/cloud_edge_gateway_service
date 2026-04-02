import { Response } from "express";
import { getTimeSeriesService } from "./client.service";
import { validateTimeSeries } from "./client.validator";

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
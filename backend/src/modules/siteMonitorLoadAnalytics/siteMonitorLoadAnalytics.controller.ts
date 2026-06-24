import { Request, Response } from "express";

import {
  addDashboardSensorService,
  getAvailableDashboardSensorsService,
  getDashboardCurrentLoadService,
  getDashboardExportService,
  getDashboardLiveLoadService,
  getDashboardSiteDetailsService,
  getDashboardSitesService,
  getSelectedDashboardSensorsService,
  removeDashboardSensorService,
} from "./siteMonitorLoadAnalytics.service";

import {validateExportFormat} from './siteMonitorLoadAnalytics.validator';

type ControllerError = Error & {
  statusCode?: number;
};

const getControllerError = (error: unknown): {
  statusCode: number;
  message: string;
} => {
  const typedError = error as ControllerError;

  return {
    statusCode: typedError.statusCode || 500,
    message: typedError.message || "Internal server error",
  };
};


const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const convertExportRowsToCsv = (
  rows: Array<{
    timestamp: string;
    sensor_name: string | null;
    reading: number | null;
    consumption: number | null;
  }>
): string => {
  const headers = [
    "timestamp",
    "sensor_name",
    "reading",
    "consumption",
  ];

  const csvRows = rows.map((row) =>
    [
      row.timestamp,
      row.sensor_name,
      row.reading,
      row.consumption,
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
};


export const getDashboardSitesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getDashboardSitesService((req as any).user);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getDashboardSiteDetailsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getDashboardSiteDetailsService(
      (req as any).user,
      req.params
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getAvailableDashboardSensorsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getAvailableDashboardSensorsService(
      (req as any).user,
      req.params,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getSelectedDashboardSensorsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getSelectedDashboardSensorsService(
      (req as any).user,
      req.params
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const addDashboardSensorController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await addDashboardSensorService(
      (req as any).user,
      req.params,
      req.body
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const removeDashboardSensorController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await removeDashboardSensorService(
      (req as any).user,
      req.params
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getDashboardCurrentLoadController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getDashboardCurrentLoadService(
      (req as any).user,
      req.params,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getDashboardLiveLoadController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getDashboardLiveLoadService(
      (req as any).user,
      req.params
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getDashboardExportController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getDashboardExportService(
      (req as any).user,
      req.params,
      req.query
    );

    const format = validateExportFormat(req.query.format);

    if (format === "csv") {
      const csv = convertExportRowsToCsv(result.rows);

      const siteId = req.params.siteId;
      const from = typeof req.query.from === "string" ? req.query.from : "from";
      const to = typeof req.query.to === "string" ? req.query.to : "to";
      const interval =
        typeof req.query.interval === "string" ? req.query.interval : "interval";

      const safeFileName = `site-dashboard-${siteId}-${from}-${to}-${interval}.csv`
        .replace(/[^a-zA-Z0-9._-]/g, "_");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFileName}"`
      );

      res.status(200).send(csv);
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = getControllerError(error);

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};
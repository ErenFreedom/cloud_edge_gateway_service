import { Request, Response } from "express";
import {
  getCurrentLoadAnalyticsService,
  getLoadAnalyticsExportService,
  getLiveLoadAnalyticsService,
} from "./loadAnalytics.service";

const escapeCsv = (value: any): string => {
  if (value === null || value === undefined) return "";

  const str = String(value);

  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

const toCsv = (rows: any[]) => {
  const headers = [
    "timestamp",
    "sensor_name",
    "reading",
    "consumption",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCsv(row[h])).join(",")
    ),
  ];

  return lines.join("\n");
};


export const getCurrentLoadAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getCurrentLoadAnalyticsService(
      (req as any).user,
      req.query
    );

    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const exportLoadAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { rows, meta } = await getLoadAnalyticsExportService(
      (req as any).user,
      req.query
    );

    const csv = toCsv(rows);

    const filenameParts = [
      "load-analytics",
      meta.site_id,
      meta.interval,
    ];

    if (meta.sensor_id) {
      filenameParts.push(meta.sensor_id);
    }

    const filename = `${filenameParts.join("-")}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.status(200).send(csv);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const getLiveLoadAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = await getLiveLoadAnalyticsService(
      (req as any).user,
      req.query
    );

    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
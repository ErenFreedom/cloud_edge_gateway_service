export type GrihaType =
  | "utility"
  | "hvac"
  | "ups"
  | "lighting"
  | "water"
  | "stp"
  | "irrigation"
  | "other";

/* ------------------------- */
/* OLD  */
/* ------------------------- */

export interface GrihaReadingResponse {
  Project_Code: string;
  Date: string;
  Type: string;

  Last_Month_Reading_Total: number | null;
  Last_Month_Date: string | null;

  Current_Month_Reading: number | null;
  Current_Month_Date: string | null;

  Unit_Type: string;
}

export interface GrihaConsumptionResponse {
  Project_Code: string;
  Date: string;
  Type: string;

  From: string;
  To: string;

  Consumption: number | null;

  Unit_Type: string;
}

/* ------------------------- */
/* NEW (FINAL EXPORT) */
/* ------------------------- */

export interface GrihaExportResponse {
  project_code: string;
  type: string;

  month: number;
  year: number;

  unit: string;

  total_consumption: number | null;

  from: string;
  to: string;
}

/* ------------------------- */
/* CONFIG */
/* ------------------------- */

export interface GrihaConfigPayload {
  site_id: string;
  mapping: {
    utility?: string;
    hvac?: string;
    ups?: string;
    lighting?: string;
    water?: string;
    stp?: string;
    irrigation?: string;
  };
}
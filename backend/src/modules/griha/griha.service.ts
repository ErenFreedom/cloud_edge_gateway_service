import dayjs from "dayjs";

import {
  getSensorsRepo,
  saveGrihaConfigRepo,
  getGrihaConfigRepo,
  getSensorMetaRepo,
} from "./griha.repository";

import { getMonthlyConsumptionFromBQ } from "./griha.bigquery.repository";

import {
  validateSaveGrihaConfig,
  validateClientAccess,
  validateMonthYear,
  validateGrihaType
} from "./griha.validator";

/* ========================= */
/* SENSOR MAP (GLOBAL) */
/* ========================= */

const SENSOR_MAP: any = {
  utility_grid: {
    id: "7e869bc4-3392-410b-a366-058e2d59b84d",
    unit: "kWh"
  },
  municipal_water: {
    id: "c36be17d-5dec-4feb-a806-d7f9e4ca10cf",
    unit: "kL"
  },
  dg1: {
    id: "ec3154e8-9c83-4b2d-a2b6-5fdcc1fc509e",
    unit: "kWh"
  },
  dg2: {
    id: "469354aa-4b40-4058-b945-40a4da3285a6",
    unit: "kWh"
  },
  dg3: {
    id: "dc5c182b-b983-46e3-8b2b-9f84547ff7c1",
    unit: "kWh"
  },
  renewable_energy: {
    id: "2214d111-1c64-4e84-8edc-150fda6ec48a",
    unit: "kWh"
  },
  stp_treated_water: {
    id: "0f1599a1-216b-4971-9d17-a33d8111ac70",
    unit: "kL"
  }
};

/* ========================= */
/* GET SENSORS */
/* ========================= */

export const getSensorsService = async (
  user: any,
  siteId: string
) => {
  return await getSensorsRepo(
    user.organizationId,
    siteId
  );
};

/* ========================= */
/* SAVE CONFIG */
/* ========================= */

export const saveGrihaConfigService = async (
  user: any,
  body: any
) => {

  validateSaveGrihaConfig(body);

  Object.values(body.mapping).forEach((m: any) => {
    if (m?.type) {
      validateGrihaType(m.type);
    }
  });

  await saveGrihaConfigRepo(
    user.organizationId,
    body.site_id,
    body.mapping
  );

  return { message: "Griha config saved" };
};

/* ========================= */
/* GET CONFIG */
/* ========================= */

export const getGrihaConfigService = async (
  user: any,
  siteId: string
) => {
  return await getGrihaConfigRepo(
    user.organizationId,
    siteId
  );
};

/* ========================= */
/* EXISTING EXPORT (FIXED) */
/* ========================= */

export const getGrihaSensorExportService = async (
  client: any,
  sensorId: string,
  month: number,
  year: number
) => {

  validateClientAccess(client);
  validateMonthYear(month, year);

  const sensor = await getSensorMetaRepo(sensorId);

  if (!sensor) throw new Error("Sensor not found");

  if (
    sensor.organization_id !== client.organization_id ||
    sensor.site_id !== client.site_id
  ) {
    throw new Error("Unauthorized sensor access");
  }

  const value = await getMonthlyConsumptionFromBQ(
    sensorId,
    month,
    year
  );

  const from = dayjs(`${year}-${month}-01`).startOf("month").toISOString();
  const to = dayjs(from).add(1, "month").toISOString();

  const config = await getGrihaConfigRepo(
    client.organization_id,
    client.site_id
  );

  const mapping = config?.[sensorId];

  return {
    project_code: client.site_id,
    type: mapping?.type || "other",
    month,
    year,
    unit: mapping?.unit || sensor.unit || "kWh",
    total_consumption: value,
    from,
    to
  };
};

/* ========================= */
/* HOTFIX SINGLE */
/* ========================= */

export const getGrihaHotfixService = async (
  client: any,
  type: string,
  month: number,
  year: number
) => {

  validateClientAccess(client);
  validateMonthYear(month, year);

  const sensor = SENSOR_MAP[type];

  if (!sensor) throw new Error("Invalid type");

  const value = await getMonthlyConsumptionFromBQ(
    sensor.id,
    month,
    year
  );

  const from = dayjs(`${year}-${month}-01`).startOf("month").toISOString();
  const to = dayjs(from).add(1, "month").toISOString();

  return {
    project_code: client.site_id,
    type,
    month,
    year,
    unit: sensor.unit,
    total_consumption: value,
    from,
    to
  };
};

/* ========================= */
/* DG CUMULATIVE */
/* ========================= */

export const getGrihaDGCumulativeService = async (
  client: any,
  month: number,
  year: number
) => {

  validateClientAccess(client);
  validateMonthYear(month, year);

  const dgSensors = ["dg1", "dg2", "dg3"];

  let total = 0;

  for (const key of dgSensors) {
    const sensor = SENSOR_MAP[key];
    const val = await getMonthlyConsumptionFromBQ(sensor.id, month, year);
    total += val || 0;
  }

  const from = dayjs(`${year}-${String(month).padStart(2, "0")}-01`)
    .startOf("month")
    .toISOString();

  const to = dayjs(from)
    .add(1, "month")
    .toISOString();

  return {
    project_code: client.site_id,
    type: "genset_energy",
    month,
    year,
    unit: "kWh",
    total_consumption: total,
    from,
    to
  };
};
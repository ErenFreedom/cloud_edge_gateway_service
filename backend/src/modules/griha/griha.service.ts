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
    id: "c47667ec-6690-4aca-bafe-d95318a73062",
    unit: "kWh"
  },
  municipal_water: {
    id: "e47ab67f-1770-439d-b8ce-a5885179e6ad",
    unit: "kL"
  },
  dg1: {
    id: "a4e60a55-58ca-4b29-be95-447741c6b273",
    unit: "kWh"
  },
  dg2: {
    id: "21839d5c-33fe-40f9-b77b-a84081a22a55",
    unit: "kWh"
  },
  dg3: {
    id: "100f29b1-52ff-4a00-be5b-094dea4707b1",
    unit: "kWh"
  },
  renewable_energy: {
    id: "125d64d9-c881-46a3-8ef7-2adc6b2b8f5c",
    unit: "kWh"
  },
  stp_treated_water: {
    id: "90dd860e-f406-4380-a34c-2016968184f9",
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
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
  validateMonthYear
} from "./griha.validator";

/* ========================= */
/* GET SENSORS (ADMIN) */
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
/* SAVE CONFIG (ADMIN) */
/* ========================= */

export const saveGrihaConfigService = async (
  user: any,
  body: any
) => {

  validateSaveGrihaConfig(body);

  await saveGrihaConfigRepo(
    user.organizationId,
    body.site_id,
    body.mapping
  );

  return { message: "Griha config saved" };
};

/* ========================= */
/* GET CONFIG (ADMIN) */
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
/* EXPORT (FINAL SENSOR API) */
/* ========================= */

export const getGrihaSensorExportService = async (
  client: any,
  sensorId: string,
  month: number,
  year: number
) => {

  /* -------- VALIDATION -------- */

  validateClientAccess(client);
  validateMonthYear(month, year);


  const sensor = await getSensorMetaRepo(sensorId);

  if (!sensor) {
    throw new Error("Sensor not found");
  }


  if (
    sensor.organization_id !== client.organization_id ||
    sensor.site_id !== client.site_id
  ) {
    throw new Error("Unauthorized sensor access");
  }


  const from = dayjs(`${year}-${month}-01`)
    .startOf("month")
    .toISOString();

  const to = dayjs(from)
    .add(1, "month")
    .toISOString();


  const value = await getMonthlyConsumptionFromBQ(
    sensorId,
    from,
    to
  );

  /* -------- RESPONSE -------- */

  return {
    project_code: client.site_id, // later will replace with site.project_code
    type: sensor.griha_type || "other",

    month,
    year,

    unit: sensor.unit || "kWh",

    total_consumption: value,

    from,
    to
  };
};
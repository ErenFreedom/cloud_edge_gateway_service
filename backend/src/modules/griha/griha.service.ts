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
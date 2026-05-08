import {
  getSensorsService,
  saveGrihaConfigService,
  getGrihaConfigService,
  getGrihaSensorExportService,
  getGrihaHotfixService,
  getGrihaDGCumulativeService
} from "./griha.service";

/* ========================= */
/* ADMIN APIs */
/* ========================= */

export const getSensors = async (req: any, res: any) => {
  try {

    const { site_id } = req.query;

    const data = await getSensorsService(
      req.user,
      site_id
    );

    res.json(data);

  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const saveConfig = async (req: any, res: any) => {
  try {

    const data = await saveGrihaConfigService(
      req.user,
      req.body
    );

    res.json(data);

  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getConfig = async (req: any, res: any) => {
  try {

    const { site_id } = req.query;

    const data = await getGrihaConfigService(
      req.user,
      site_id
    );

    res.json(data);

  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ========================= */
/* CLIENT EXPORT API */
/* ========================= */

export const getSensorExport = async (req: any, res: any) => {
  try {

    const { sensorId } = req.params;
    const { month, year } = req.query;

    const data = await getGrihaSensorExportService(
      req.client,
      sensorId,
      Number(month),
      Number(year)
    );

    res.json(data);

  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};


export const getGrihaTypes = async (req: any, res: any) => {
  res.json([
    { value: "municipal_water", label: "Municipal Water Supply" },
    { value: "borewell_water", label: "Borewell Water Supply" },
    { value: "utility_grid", label: "Utility Grid (Electricity)" },

    { value: "genset", label: "Genset Energy" },
    { value: "renewable", label: "Renewable Energy" },
    { value: "stp_treated", label: "Treated STP Water" },
    { value: "rainwater", label: "Captured Rainwater" }
  ]);
};


export const getGrihaHotfix = async (req: any, res: any) => {
  try {

    const { type } = req.params;
    const { month, year } = req.query;

    const data = await getGrihaHotfixService(
      req.client,
      type,
      Number(month),
      Number(year)
    );

    res.json(data);

  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ========================= */
/* HOTFIX DG CUMULATIVE */
/* ========================= */

export const getGrihaDGCumulative = async (req: any, res: any) => {
  try {

    const { month, year } = req.query;

    const data = await getGrihaDGCumulativeService(
      req.client,
      Number(month),
      Number(year)
    );

    res.json(data);

  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
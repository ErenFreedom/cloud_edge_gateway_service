import {
  getSensorsService,
  saveGrihaConfigService,
  getGrihaConfigService,
  getGrihaSensorExportService
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
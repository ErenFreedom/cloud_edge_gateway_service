import {
  getMonthlyComplianceReportService,
  getComplianceReportTypesService,
  saveComplianceReportTypeService,
  getComplianceReportCategoriesService,
  saveComplianceReportCategoryService,
  getComplianceConfigService,
  saveComplianceConfigService,
  getMonthlyComplianceCategoryService,
  saveMultiComplianceConfigService,
} from "./compliance.service";

export const getMonthlyComplianceReport = async (req: any, res: any) => {
  try {
    const { reportType } = req.params;
    const { month, year } = req.query;

    const data = await getMonthlyComplianceReportService(
      req.client,
      reportType,
      Number(month),
      Number(year)
    );

    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getComplianceReportTypes = async (req: any, res: any) => {
  try {
    const data = await getComplianceReportTypesService();
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const saveComplianceReportType = async (req: any, res: any) => {
  try {
    const data = await saveComplianceReportTypeService(req.body);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getComplianceReportCategories = async (req: any, res: any) => {
  try {
    const { reportType } = req.params;

    const data = await getComplianceReportCategoriesService(reportType);

    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const saveComplianceReportCategory = async (req: any, res: any) => {
  try {
    const data = await saveComplianceReportCategoryService(req.body);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getComplianceConfig = async (req: any, res: any) => {
  try {
    const { reportType } = req.params;
    const { site_id } = req.query;

    const data = await getComplianceConfigService(
      req.user,
      reportType,
      String(site_id)
    );

    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const saveComplianceConfig = async (req: any, res: any) => {
  try {
    const data = await saveComplianceConfigService(
      req.user,
      req.body
    );

    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const getMonthlyComplianceCategoryReport =
  async (req: any, res: any) => {

    try {

      const { reportType, category } = req.params;
      const { month, year } = req.query;

      const data =
        await getMonthlyComplianceCategoryService(
          req.client,
          reportType,
          category,
          Number(month),
          Number(year)
        );

      res.json(data);

    } catch (e: any) {

      res.status(400).json({
        message: e.message
      });

    }
};


export const saveMultiComplianceConfig = async (req: any, res: any) => {
  try {
    const data = await saveMultiComplianceConfigService(
      req.user,
      req.body
    );

    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
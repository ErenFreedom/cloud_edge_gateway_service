import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";

import {
  addDashboardSensorController,
  getAvailableDashboardSensorsController,
  getDashboardCurrentLoadController,
  getDashboardExportController,
  getDashboardLiveLoadController,
  getDashboardSiteDetailsController,
  getDashboardSitesController,
  getSelectedDashboardSensorsController,
  removeDashboardSensorController,
} from "./siteMonitorLoadAnalytics.controller";

const router = Router();

router.use(authMiddleware);

/**
 * Dashboard site access
 */
router.get("/sites", getDashboardSitesController);
router.get("/sites/:siteId", getDashboardSiteDetailsController);

/**
 * Dashboard sensor management
 */
router.get("/sites/:siteId/sensors", getAvailableDashboardSensorsController);

router.get(
  "/sites/:siteId/selected-sensors",
  getSelectedDashboardSensorsController
);

router.post(
  "/sites/:siteId/selected-sensors",
  addDashboardSensorController
);

router.delete(
  "/sites/:siteId/selected-sensors/:sensorId",
  removeDashboardSensorController
);

/**
 * Dashboard analytics
 */
router.get("/sites/:siteId/load", getDashboardCurrentLoadController);
router.get("/sites/:siteId/live", getDashboardLiveLoadController);
router.get("/sites/:siteId/export", getDashboardExportController);

export default router;
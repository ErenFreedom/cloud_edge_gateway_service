import { Router } from "express";

import {
  inviteSiteMonitorController,
  verifySiteMonitorOtpController,
  listSiteMonitorsController,
  getSiteMonitorByIdController,
  updateSiteMonitorController,
  changeSiteMonitorPasswordController,
  deleteSiteMonitorController,
} from "./siteMonitor.controller";

import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/verify-otp",
  verifySiteMonitorOtpController
);

router.post(
  "/invite",
  authMiddleware,
  inviteSiteMonitorController
);

router.get(
  "/",
  authMiddleware,
  listSiteMonitorsController
);

/**
 * IMPORTANT:
 * Keep this BEFORE "/:id"
 */


router.post(
  "/change-password",
  authMiddleware,
  changeSiteMonitorPasswordController
);

router.get(
  "/:id",
  authMiddleware,
  getSiteMonitorByIdController
);

router.put(
  "/:id",
  authMiddleware,
  updateSiteMonitorController
);

router.delete(
  "/:id",
  authMiddleware,
  deleteSiteMonitorController
);

export default router;
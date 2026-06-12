import express from "express";
import {
  exportLoadAnalyticsController,
  getCurrentLoadAnalyticsController,
  getLiveLoadAnalyticsController,
} from "./loadAnalytics.controller";

import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/current",
  authMiddleware,
  getCurrentLoadAnalyticsController
);

router.get(
  "/export",
  authMiddleware,
  exportLoadAnalyticsController
);

router.get(
  "/live",
  authMiddleware,
  getLiveLoadAnalyticsController
);

export default router;
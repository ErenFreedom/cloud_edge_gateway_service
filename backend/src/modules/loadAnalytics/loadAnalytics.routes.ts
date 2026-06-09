import express from "express";
import {
  exportLoadAnalyticsController,
  getCurrentLoadAnalyticsController,
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

export default router;
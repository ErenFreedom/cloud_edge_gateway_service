import express from "express";

import {
  getMonthlyComplianceReport,
  getComplianceReportTypes,
  saveComplianceReportType,
  getComplianceReportCategories,
  saveComplianceReportCategory,
  getComplianceConfig,
  saveComplianceConfig,
  getMonthlyComplianceCategoryReport
} from "./compliance.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { clientAuth } from "../../middleware/client.Auth";

const router = express.Router();

/* ========================= */
/* CLIENT EXPORT */
/* ========================= */

router.get(
  "/reports/:reportType",
  clientAuth,
  getMonthlyComplianceReport
);

/* ========================= */
/* ADMIN REPORT METADATA */
/* ========================= */

router.get(
  "/report-types",
  authMiddleware,
  getComplianceReportTypes
);

router.post(
  "/report-types",
  authMiddleware,
  saveComplianceReportType
);

router.get(
  "/report-types/:reportType/categories",
  authMiddleware,
  getComplianceReportCategories
);

router.post(
  "/categories",
  authMiddleware,
  saveComplianceReportCategory
);

/* ========================= */
/* ADMIN REPORT CONFIG */
/* ========================= */

router.get(
  "/config/:reportType",
  authMiddleware,
  getComplianceConfig
);

router.post(
  "/config",
  authMiddleware,
  saveComplianceConfig
);


router.get(
  "/reports/:reportType/:category",
  clientAuth,
  getMonthlyComplianceCategoryReport
);

export default router;
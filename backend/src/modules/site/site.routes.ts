import { Router } from "express";

import {
  createSiteValidator,
  editSiteValidator,
  editSiteUserValidator,
  requestEmailChangeValidator,
  verifyEmailChangeValidator
} from "./site.validator";

import { validateRequest } from "../../middleware/validateRequest";

import {
  createSite,
  verifySiteAdminOtp,
  getSites,
  unlockSiteCredentials,
  regenerateSiteCredentials,
  editSite,
  editSiteUser,
  getSiteDetailsController,
  requestEmailChangeController,
  verifyEmailChangeController
} from "./site.controller";

import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();


router.get(
  "/list",
  authMiddleware,
  getSites
);


router.post(
  "/create",
  authMiddleware,
  createSiteValidator,
  validateRequest,
  createSite
);


router.post(
  "/verify-admin-otp",
  verifySiteAdminOtp
);


router.post(
  "/unlock-site",
  authMiddleware,
  unlockSiteCredentials
);


router.post(
  "/regenerate-credentials",
  authMiddleware,
  regenerateSiteCredentials
);


router.put(
  "/:siteId",
  authMiddleware,
  editSiteValidator,
  validateRequest,
  editSite
);


router.put(
  "/users/edit",
  authMiddleware,
  editSiteUserValidator,
  validateRequest,
  editSiteUser
);


router.get(
  "/:siteId/details",
  authMiddleware,
  getSiteDetailsController
);


router.post(
  "/user/request-email-change",
  requestEmailChangeValidator,
  validateRequest,
  requestEmailChangeController
);

router.post(
  "/user/verify-email-change",
  verifyEmailChangeValidator,
  validateRequest,
  verifyEmailChangeController
);

export default router;
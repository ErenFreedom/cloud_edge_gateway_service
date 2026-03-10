import { Router } from "express";

import {
  createSite,
  verifySiteAdminOtp,
  getSites,
  unlockSiteCredentials,
  regenerateSiteCredentials,
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

export default router;
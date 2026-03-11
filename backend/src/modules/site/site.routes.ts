import { Router } from "express";
import { editSiteValidator, editSiteUserValidator } from "./site.validator"
import {
  createSite,
  verifySiteAdminOtp,
  getSites,
  unlockSiteCredentials,
  regenerateSiteCredentials,
  editSite,
  editSiteUser
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


router.put(
  "/:siteId",
  authMiddleware,
  editSiteValidator,
  editSite
)

router.put(
  "/users/edit",
  authMiddleware,
  editSiteUserValidator,
  editSiteUser
)

export default router;
import { Router } from "express"

import { authMiddleware }
from "../../middleware/auth.middleware"

import {
  createOrgSiteManager,
  assignSitesToManager,
  removeSitesFromManager,
  getManagersAndSites,
  getManagerScope,
  verifyManagerOtp,
  getMySites
} from "./orgSiteManager.controller"

import {
  validateAssignSites
} from "./orgSiteManager.validator"


const router = Router()

router.post(
  "/create",
  authMiddleware,
  createOrgSiteManager
)


router.post(
  "/assign-sites",
  authMiddleware,
  validateAssignSites,
  assignSitesToManager
)

router.post(
  "/remove-sites",
  authMiddleware,
  validateAssignSites,
  removeSitesFromManager
)


router.get(
  "/init-data",
  authMiddleware,
  getManagersAndSites
);

router.get(
  "/scope/:managerId",
  authMiddleware,
  getManagerScope
);

router.post(
  "/verify-otp",
  authMiddleware,
  verifyManagerOtp
);

router.get(
  "/my-sites",
  authMiddleware,
  getMySites
);


export default router
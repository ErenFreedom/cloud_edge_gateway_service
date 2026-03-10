import { Router } from "express";

import {
  createSite,
  verifySiteAdminOtp,
  getSites
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

export default router;
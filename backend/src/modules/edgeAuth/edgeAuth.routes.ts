import { Router } from "express";
import {
  edgeLoginController,
  activateSiteController,
  requestActivationController,
  getPendingRequestsController,
  approveActivationController,
  rejectActivationController,
  suspendSiteController,
  deleteSiteController
} from "./edgeAuth.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

/**
 *  EDGE PUBLIC ROUTES (NO AUTH)
 */
router.post("/login-site-admin", edgeLoginController);
router.post("/request-activation", requestActivationController);
//router.post("/activate-site", activateSiteController);

/**
 *  ADMIN ROUTES (PROTECTED)
 */
router.get(
  "/activation-requests",
  authMiddleware,
  roleMiddleware("super_admin"),
  getPendingRequestsController
);

router.post(
  "/approve-activation",
  authMiddleware,
  roleMiddleware("super_admin"),
  approveActivationController
);

router.post(
  "/reject-activation",
  authMiddleware,
  roleMiddleware("super_admin"),
  rejectActivationController
);

router.post(
  "/suspend-site",
  authMiddleware,
  roleMiddleware("super_admin"),
  suspendSiteController
);

router.post(
  "/delete-site",
  authMiddleware,
  roleMiddleware("super_admin"),
  deleteSiteController
);

export default router;
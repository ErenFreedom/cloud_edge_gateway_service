import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";


import {
  deleteOrphanUserController,
  listOrganizationUsersController,
  updateUserManagementStatusController,
} from "./userManagement.controller";

const router = Router();

/* ========================= */
/* USER MANAGEMENT */
/* ========================= */

router.get(
  "/users",
  authMiddleware,
  listOrganizationUsersController
);

router.patch(
  "/users/:userId/status",
  authMiddleware,
  updateUserManagementStatusController
);

router.delete(
  "/users/:userId",
  authMiddleware,
  deleteOrphanUserController
);

export default router;
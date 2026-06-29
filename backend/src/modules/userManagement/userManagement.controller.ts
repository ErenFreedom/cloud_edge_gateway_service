import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";

import {
  deleteOrphanUserService,
  listOrganizationUsersService,
  updateUserManagementStatusService,
} from "./userManagement.service";

import {
  validateDeleteUserPayload,
  validateListUsersQuery,
  validateUpdateUserStatusPayload,
  validateUserIdParam,
} from "./userManagement.validators";

/* ========================= */
/* LIST USERS */
/* ========================= */

export const listOrganizationUsersController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const query = validateListUsersQuery(req.query);

    const result = await listOrganizationUsersService(
      user.userId,
      query
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to fetch users",
    });
  }
};

/* ========================= */
/* UPDATE USER STATUS */
/* ========================= */

export const updateUserManagementStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = validateUserIdParam(req.params.userId);

    const payload = validateUpdateUserStatusPayload(req.body);

    const result = await updateUserManagementStatusService(
      user.userId,
      userId,
      payload
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update user status",
    });
  }
};

/* ========================= */
/* DELETE ORPHAN USER */
/* ========================= */

export const deleteOrphanUserController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = validateUserIdParam(req.params.userId);

    const payload = validateDeleteUserPayload(req.body);

    const result = await deleteOrphanUserService(
      user.userId,
      userId,
      payload
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to delete orphan user",
    });
  }
};
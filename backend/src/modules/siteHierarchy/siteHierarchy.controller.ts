import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";

import {
  getSiteHierarchyService,

  createBuildingService,
  createFloorService,
  createRoomService,
  createComponentService,

  updateBuildingService,
  updateFloorService,
  updateRoomService,
  updateComponentService,

  deleteBuildingService,
  deleteFloorService,
  deleteRoomService,
  deleteComponentService,

  getSensorAssignmentsService,
  bulkAssignSensorLocationService,
  clearSensorLocationService,
  addSensorTagService,
  removeSensorTagService,
} from "./siteHierarchy.service";

const getUser = (req: AuthRequest) => {
  if (!req.user) {
    throw new Error("Unauthorized");
  }

  return req.user;
};

export const getSiteHierarchyController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;

    const result = await getSiteHierarchyService(user, siteId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

/* ---------------- CREATE ---------------- */

export const createBuildingController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;

    const result = await createBuildingService(
      user,
      siteId,
      req.body
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const createFloorController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const buildingId = req.params.buildingId as string;

    const result = await createFloorService(
      user,
      siteId,
      buildingId,
      req.body
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const createRoomController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const floorId = req.params.floorId as string;

    const result = await createRoomService(
      user,
      siteId,
      floorId,
      req.body
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const createComponentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const roomId = req.params.roomId as string;

    const result = await createComponentService(
      user,
      siteId,
      roomId,
      req.body
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

/* ---------------- UPDATE ---------------- */

export const updateBuildingController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const buildingId = req.params.buildingId as string;

    const result = await updateBuildingService(
      user,
      siteId,
      buildingId,
      req.body
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const updateFloorController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const floorId = req.params.floorId as string;

    const result = await updateFloorService(
      user,
      siteId,
      floorId,
      req.body
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const updateRoomController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const roomId = req.params.roomId as string;

    const result = await updateRoomService(
      user,
      siteId,
      roomId,
      req.body
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const updateComponentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const componentId = req.params.componentId as string;

    const result = await updateComponentService(
      user,
      siteId,
      componentId,
      req.body
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

/* ---------------- DELETE ---------------- */

export const deleteBuildingController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const buildingId = req.params.buildingId as string;

    const result = await deleteBuildingService(
      user,
      siteId,
      buildingId
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteFloorController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const floorId = req.params.floorId as string;

    const result = await deleteFloorService(
      user,
      siteId,
      floorId
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteRoomController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const roomId = req.params.roomId as string;

    const result = await deleteRoomService(
      user,
      siteId,
      roomId
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteComponentController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const componentId = req.params.componentId as string;

    const result = await deleteComponentService(
      user,
      siteId,
      componentId
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

/* ---------------- SENSOR ASSIGNMENTS ---------------- */

export const getSensorAssignmentsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;

    const result = await getSensorAssignmentsService(
      user,
      siteId
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const bulkAssignSensorLocationController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;

    const result = await bulkAssignSensorLocationService(
      user,
      siteId,
      req.body
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const clearSensorLocationController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;

    const result = await clearSensorLocationService(
      user,
      siteId,
      req.body
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

/* ---------------- TAGS ---------------- */

export const addSensorTagController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const sensorId = req.params.sensorId as string;

    const result = await addSensorTagService(
      user,
      siteId,
      sensorId,
      req.body
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const removeSensorTagController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = getUser(req);
    const siteId = req.params.siteId as string;
    const sensorId = req.params.sensorId as string;
    const tagId = req.params.tagId as string;

    const result = await removeSensorTagService(
      user,
      siteId,
      sensorId,
      tagId
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};
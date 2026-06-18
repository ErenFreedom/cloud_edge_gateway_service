import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";

import {
  getSiteHierarchyController,

  createBuildingController,
  createFloorController,
  createRoomController,
  createComponentController,

  updateBuildingController,
  updateFloorController,
  updateRoomController,
  updateComponentController,

  deleteBuildingController,
  deleteFloorController,
  deleteRoomController,
  deleteComponentController,

  getSensorAssignmentsController,
  bulkAssignSensorLocationController,
  clearSensorLocationController,

  addSensorTagController,
  removeSensorTagController,
} from "./siteHierarchy.controller";

import {
  siteIdParamValidator,

  createBuildingValidator,
  createFloorValidator,
  createRoomValidator,
  createComponentValidator,

  updateBuildingValidator,
  updateFloorValidator,
  updateRoomValidator,
  updateComponentValidator,

  deleteBuildingValidator,
  deleteFloorValidator,
  deleteRoomValidator,
  deleteComponentValidator,

  bulkAssignSensorLocationValidator,
  clearSensorLocationValidator,

  addSensorTagValidator,
  removeSensorTagValidator,
} from "./siteHierarchy.validator";

const router = Router();

/* ---------------- HIERARCHY TREE ---------------- */

router.get(
  "/sites/:siteId",
  authMiddleware,
  siteIdParamValidator,
  validateRequest,
  getSiteHierarchyController
);

/* ---------------- CREATE ---------------- */

router.post(
  "/sites/:siteId/buildings",
  authMiddleware,
  createBuildingValidator,
  validateRequest,
  createBuildingController
);

router.post(
  "/sites/:siteId/buildings/:buildingId/floors",
  authMiddleware,
  createFloorValidator,
  validateRequest,
  createFloorController
);

router.post(
  "/sites/:siteId/floors/:floorId/rooms",
  authMiddleware,
  createRoomValidator,
  validateRequest,
  createRoomController
);

router.post(
  "/sites/:siteId/rooms/:roomId/components",
  authMiddleware,
  createComponentValidator,
  validateRequest,
  createComponentController
);

/* ---------------- UPDATE ---------------- */

router.put(
  "/sites/:siteId/buildings/:buildingId",
  authMiddleware,
  updateBuildingValidator,
  validateRequest,
  updateBuildingController
);

router.put(
  "/sites/:siteId/floors/:floorId",
  authMiddleware,
  updateFloorValidator,
  validateRequest,
  updateFloorController
);

router.put(
  "/sites/:siteId/rooms/:roomId",
  authMiddleware,
  updateRoomValidator,
  validateRequest,
  updateRoomController
);

router.put(
  "/sites/:siteId/components/:componentId",
  authMiddleware,
  updateComponentValidator,
  validateRequest,
  updateComponentController
);

/* ---------------- DELETE ---------------- */

router.delete(
  "/sites/:siteId/buildings/:buildingId",
  authMiddleware,
  deleteBuildingValidator,
  validateRequest,
  deleteBuildingController
);

router.delete(
  "/sites/:siteId/floors/:floorId",
  authMiddleware,
  deleteFloorValidator,
  validateRequest,
  deleteFloorController
);

router.delete(
  "/sites/:siteId/rooms/:roomId",
  authMiddleware,
  deleteRoomValidator,
  validateRequest,
  deleteRoomController
);

router.delete(
  "/sites/:siteId/components/:componentId",
  authMiddleware,
  deleteComponentValidator,
  validateRequest,
  deleteComponentController
);

/* ---------------- SENSOR ASSIGNMENTS ---------------- */

router.get(
  "/sites/:siteId/sensor-assignments",
  authMiddleware,
  siteIdParamValidator,
  validateRequest,
  getSensorAssignmentsController
);

router.put(
  "/sites/:siteId/sensors/bulk-assign-location",
  authMiddleware,
  bulkAssignSensorLocationValidator,
  validateRequest,
  bulkAssignSensorLocationController
);

router.put(
  "/sites/:siteId/sensors/clear-location",
  authMiddleware,
  clearSensorLocationValidator,
  validateRequest,
  clearSensorLocationController
);

/* ---------------- TAGS ---------------- */

router.post(
  "/sites/:siteId/sensors/:sensorId/tags",
  authMiddleware,
  addSensorTagValidator,
  validateRequest,
  addSensorTagController
);

router.delete(
  "/sites/:siteId/sensors/:sensorId/tags/:tagId",
  authMiddleware,
  removeSensorTagValidator,
  validateRequest,
  removeSensorTagController
);

export default router;
import { body, param } from "express-validator";

/* PARAMS */

export const siteIdParamValidator = [
  param("siteId")
    .isUUID()
    .withMessage("Invalid site id"),
];

export const buildingIdParamValidator = [
  param("buildingId")
    .isUUID()
    .withMessage("Invalid building id"),
];

export const floorIdParamValidator = [
  param("floorId")
    .isUUID()
    .withMessage("Invalid floor id"),
];

export const roomIdParamValidator = [
  param("roomId")
    .isUUID()
    .withMessage("Invalid room id"),
];

export const componentIdParamValidator = [
  param("componentId")
    .isUUID()
    .withMessage("Invalid component id"),
];

export const sensorIdParamValidator = [
  param("sensorId")
    .isUUID()
    .withMessage("Invalid sensor id"),
];

export const tagIdParamValidator = [
  param("tagId")
    .isUUID()
    .withMessage("Invalid tag id"),
];

/* CREATE */

export const createBuildingValidator = [
  ...siteIdParamValidator,

  body("building_name")
    .trim()
    .notEmpty()
    .withMessage("Building name is required"),

  body("building_code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Building code must be 1-50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

export const createFloorValidator = [
  ...siteIdParamValidator,
  ...buildingIdParamValidator,

  body("floor_name")
    .trim()
    .notEmpty()
    .withMessage("Floor name is required"),

  body("floor_number")
    .optional()
    .custom((value) => {
      if (
        typeof value === "number" ||
        typeof value === "string"
      ) {
        return true;
      }

      throw new Error("Floor number must be string or number");
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

export const createRoomValidator = [
  ...siteIdParamValidator,
  ...floorIdParamValidator,

  body("room_name")
    .trim()
    .notEmpty()
    .withMessage("Room name is required"),

  body("room_code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Room code must be 1-50 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

export const createComponentValidator = [
  ...siteIdParamValidator,
  ...roomIdParamValidator,

  body("component_name")
    .trim()
    .notEmpty()
    .withMessage("Component name is required"),

  body("component_type")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Component type cannot exceed 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

/* UPDATE */

export const updateBuildingValidator = [
  ...siteIdParamValidator,
  ...buildingIdParamValidator,

  body("building_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Building name cannot be empty"),

  body("building_code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Building code must be 1-50 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

export const updateFloorValidator = [
  ...siteIdParamValidator,
  ...floorIdParamValidator,

  body("floor_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Floor name cannot be empty"),

  body("floor_number")
    .optional({ nullable: true })
    .custom((value) => {
      if (
        value === null ||
        typeof value === "number" ||
        typeof value === "string"
      ) {
        return true;
      }

      throw new Error("Floor number must be string or number");
    }),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

export const updateRoomValidator = [
  ...siteIdParamValidator,
  ...roomIdParamValidator,

  body("room_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Room name cannot be empty"),

  body("room_code")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Room code must be 1-50 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

export const updateComponentValidator = [
  ...siteIdParamValidator,
  ...componentIdParamValidator,

  body("component_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Component name cannot be empty"),

  body("component_type")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Component type cannot exceed 100 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("display_order")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),
];

/* DELETE */

export const deleteBuildingValidator = [
  ...siteIdParamValidator,
  ...buildingIdParamValidator,
];

export const deleteFloorValidator = [
  ...siteIdParamValidator,
  ...floorIdParamValidator,
];

export const deleteRoomValidator = [
  ...siteIdParamValidator,
  ...roomIdParamValidator,
];

export const deleteComponentValidator = [
  ...siteIdParamValidator,
  ...componentIdParamValidator,
];

/* SENSOR ASSIGNMENT */

export const bulkAssignSensorLocationValidator = [
  ...siteIdParamValidator,

  body("sensor_ids")
    .isArray({ min: 1 })
    .withMessage("At least one sensor is required"),

  body("sensor_ids.*")
    .isUUID()
    .withMessage("Invalid sensor id"),

  body("building_id")
    .isUUID()
    .withMessage("Building id is required"),

  body("floor_id")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Invalid floor id"),

  body("room_id")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Invalid room id"),

  body("component_id")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Invalid component id"),

  body("manual_tags")
    .optional()
    .isArray()
    .withMessage("Manual tags must be an array"),

  body("manual_tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Manual tag must be 1-100 characters"),
];

export const clearSensorLocationValidator = [
  ...siteIdParamValidator,

  body("sensor_ids")
    .isArray({ min: 1 })
    .withMessage("At least one sensor is required"),

  body("sensor_ids.*")
    .isUUID()
    .withMessage("Invalid sensor id"),
];

/* TAGS */

export const addSensorTagValidator = [
  ...siteIdParamValidator,
  ...sensorIdParamValidator,

  body("tag_key")
    .trim()
    .notEmpty()
    .withMessage("Tag key is required")
    .isLength({ max: 100 })
    .withMessage("Tag key cannot exceed 100 characters"),

  body("tag_value")
    .trim()
    .notEmpty()
    .withMessage("Tag value is required")
    .isLength({ max: 255 })
    .withMessage("Tag value cannot exceed 255 characters"),

  body("tag_type")
    .optional()
    .isIn(["manual", "system", "analytics", "compliance"])
    .withMessage("Invalid tag type"),
];

export const removeSensorTagValidator = [
  ...siteIdParamValidator,
  ...sensorIdParamValidator,
  ...tagIdParamValidator,
];
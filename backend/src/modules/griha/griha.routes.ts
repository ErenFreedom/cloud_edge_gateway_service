import express from "express";

import {
  getSensors,
  saveConfig,
  getConfig,
  getSensorExport,
  getGrihaTypes,
  getGrihaHotfix,
  getGrihaDGCumulative
} from "./griha.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { clientAuth } from "../../middleware/client.Auth";

const router = express.Router();

/* ========================= */
/* ADMIN */
/* ========================= */

router.get(
  "/sensors",
  authMiddleware,
  getSensors
);

router.get(
  "/config",
  authMiddleware,
  getConfig
);

router.post(
  "/save-config",
  authMiddleware,
  saveConfig
);

router.get("/types", 
  authMiddleware,
  getGrihaTypes
);

/* ========================= */
/* CLIENT EXPORT */
/* ========================= */

router.get(
  "/sensor/:sensorId",
  clientAuth,
  getSensorExport
);


router.get(
  "/hotfix/:type",
  clientAuth,
  getGrihaHotfix
);

router.get(
  "/hotfix/dg-cumulative",
  clientAuth,
  getGrihaDGCumulative
);

export default router;
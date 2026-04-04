import express from "express";

import {
  getTimeSeries,
  generateClientToken,
  getSensors,
  getClientConfig,
  saveClientConfig
} from "./client.controller";

import { clientAuth } from "../../middleware/client.Auth";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();


router.post(
  "/generate-token",
  authMiddleware,
  generateClientToken
);

router.get(
  "/sensors",
  authMiddleware,   //  admin JWT
  getSensors
);

router.get(
  "/config",
  authMiddleware,
  getClientConfig
);

router.post(
  "/save-config",
  authMiddleware,
  saveClientConfig
);

router.post(
  "/timeseries",
  clientAuth,     // uses token
  getTimeSeries
);

export default router;
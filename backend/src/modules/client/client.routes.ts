import express from "express";

import {
  getTimeSeries,
  generateClientToken,
  getSensors
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
  authMiddleware,   // ✅ admin JWT
  getSensors
);

router.post(
  "/timeseries",
  clientAuth,     // uses token
  getTimeSeries
);

export default router;
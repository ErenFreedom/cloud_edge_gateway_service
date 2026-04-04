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
  authMiddleware,       //  admin JWT
  generateClientToken
);


router.get(
  "/sensors",
  authMiddleware,     
  getSensors
);


router.post(
  "/timeseries",
  clientAuth,           //  client token
  getTimeSeries
);

export default router;
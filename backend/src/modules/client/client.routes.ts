import express from "express";

import {
  getTimeSeries,
  generateClientToken
} from "./client.controller";

import { clientAuth } from "../../middleware/client.Auth";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();


router.post(
  "/generate-token",
  authMiddleware,       //  admin JWT
  generateClientToken
);


router.post(
  "/timeseries",
  clientAuth,           //  client token
  getTimeSeries
);

export default router;
import express from "express";
import { getTimeSeries } from "./client.controller";
import { clientAuth } from "../../middleware/client.Auth";

const router = express.Router();

router.post("/timeseries", clientAuth, getTimeSeries);

export default router;
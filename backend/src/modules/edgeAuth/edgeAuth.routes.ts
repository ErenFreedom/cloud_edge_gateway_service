
import { Router } from "express";
import {
  edgeLoginController,
  activateSiteController
} from "./edgeAuth.controller";

const router = Router();

router.post("/login-site-admin", edgeLoginController);
router.post("/activate-site", activateSiteController);

export default router;
import { Router } from "express";
import {
  opsLoginController,
  verifyOpsOtpController,
  refreshOpsTokenController,
  resendOpsOtpController,
  logoutOpsController
} from "./opsAuth.controller";

const router = Router();

router.post(
  "/login",
   opsLoginController
);


router.post(
  "/verify-otp", 
  verifyOpsOtpController
);


router.post(
  "/refresh", 
  refreshOpsTokenController
);


router.post(
  "/resend-otp",
  resendOpsOtpController
);

router.post(
  "/logout",
  logoutOpsController
);

export default router;
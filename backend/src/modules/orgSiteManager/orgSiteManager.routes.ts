import { Router } from "express"

import { authMiddleware }
from "../../middleware/auth.middleware"

import {
  createOrgSiteManager
} from "./orgSiteManager.controller"

const router = Router()

router.post(
  "/create",
  authMiddleware,
  createOrgSiteManager
)

export default router
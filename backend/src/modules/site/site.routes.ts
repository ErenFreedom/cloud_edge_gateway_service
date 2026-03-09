import { Router } from 'express';
import {
  createSite,
  verifySiteAdminOtp,
} from './site.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createSite);
router.post('/verify-otp', verifySiteAdminOtp);

export default router;
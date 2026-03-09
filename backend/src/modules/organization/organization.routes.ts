
import { Router } from 'express';
import {
  createOrganizationRequest,
  getOrganizationRequests,
  approveOrganization,
  rejectOrganization,
  verifyOrganizationOtp
} from './organization.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

const router = Router();

router.post('/request', createOrganizationRequest);
router.post('/verify-otp', verifyOrganizationOtp);
router.get(
  '/requests',
  authMiddleware,
  roleMiddleware('platform_admin'),
  getOrganizationRequests
);

router.post(
  '/:id/approve',
  authMiddleware,
  roleMiddleware('platform_admin'),
  approveOrganization
);

router.post(
  '/:id/reject',
  authMiddleware,
  roleMiddleware('platform_admin'),
  rejectOrganization
);

export default router;
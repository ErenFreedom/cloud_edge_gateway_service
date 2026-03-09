import { Router } from 'express';
import {
  suspendOrganization,
  reactivateOrganization,
  scheduleDeletion,
  getApprovedOrganizations
} from './platform.controller';



const router = Router();



router.post('/suspend', suspendOrganization);
router.post('/reactivate', reactivateOrganization);
router.post('/schedule-deletion', scheduleDeletion);
router.get('/', getApprovedOrganizations);

export default router;
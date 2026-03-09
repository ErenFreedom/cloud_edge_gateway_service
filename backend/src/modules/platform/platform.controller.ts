import { Request, Response } from 'express';
import {
  suspendOrganizationService,
  reactivateOrganizationService,
  scheduleOrganizationDeletionService,
  getApprovedOrganizationsService
} from './platform.service';



export const suspendOrganization = async (req: Request, res: Response) => {
  const { organizationId, reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'Reason is required' });
  }

  const result = await suspendOrganizationService(
    organizationId,
    reason
  );

  res.json(result);
};



export const reactivateOrganization = async (req: Request, res: Response) => {
  const { organizationId, reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'Reason is required' });
  }

  const result = await reactivateOrganizationService(
    organizationId,
    reason
  );

  res.json(result);
};



export const scheduleDeletion = async (req: Request, res: Response) => {
  const { organizationId, reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'Reason is required' });
  }

  const result = await scheduleOrganizationDeletionService(
    organizationId,
    reason
  );

  res.json(result);
};



export const getApprovedOrganizations = async (
  _req: Request,
  res: Response
) => {
  const data = await getApprovedOrganizationsService();
  res.json(data);
};
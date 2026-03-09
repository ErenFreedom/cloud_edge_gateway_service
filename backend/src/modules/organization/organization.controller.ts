
import { Request, Response } from 'express';
import {
  createOrganizationRequestService,
  getOrganizationRequestsService,
  approveOrganizationService,
  rejectOrganizationService,
  verifyOrganizationOtpService,
} from './organization.service';

export const createOrganizationRequest = async (
  req: Request,
  res: Response
) => {
  const result = await createOrganizationRequestService(req.body);
  res.status(201).json(result);
};

export const getOrganizationRequests = async (
  req: Request,
  res: Response
) => {
  const result = await getOrganizationRequestsService(
    req.query.status as string
  );
  res.json(result);
};

export const approveOrganization = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await approveOrganizationService(id);
  res.json(result);
};

export const rejectOrganization = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await rejectOrganizationService(
    id,
    req.body.reason
  );

  res.json(result);
};

export const verifyOrganizationOtp = async (
  req: Request,
  res: Response
) => {
  const { requestId, otp } = req.body;

  const result = await verifyOrganizationOtpService(
    requestId,
    otp
  );

  res.json(result);
};
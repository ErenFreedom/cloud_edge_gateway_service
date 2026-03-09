import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createSiteService,
  verifySiteAdminOtpService,
} from './site.service';

export const createSite = async (
  req: AuthRequest,
  res: Response
) => {
  const superAdminId = req.user?.userId;
  if (!superAdminId)
    return res.status(401).json({ message: 'Unauthorized' });

  const result = await createSiteService(
    superAdminId,
    req.body
  );

  res.status(201).json(result);
};

export const verifySiteAdminOtp = async (
  req: AuthRequest,
  res: Response
) => {
  const { otpId, otp } = req.body;

  const result = await verifySiteAdminOtpService(
    otpId,
    otp
  );

  res.json(result);
};
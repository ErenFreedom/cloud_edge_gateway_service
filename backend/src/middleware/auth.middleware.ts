import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    organizationId: string | null;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as any;

    req.user = {
      userId: payload.userId,
      role: payload.role,
      organizationId: payload.organizationId ?? null
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
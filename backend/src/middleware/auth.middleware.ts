import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import { env } from "../config/env";

import {
  getAuthSession,
  touchAuthSession,
} from "../services/redis_server/authSession.service";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    role: string;
    organizationId: string | null;
    sessionId: string;
    dashboard: "admin";
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as any;

    if (payload.dashboard !== "admin") {
      return res.status(401).json({
        message: "Invalid dashboard session",
      });
    }

    if (!payload.sessionId) {
      return res.status(401).json({
        message: "Session missing",
      });
    }

    const session = await getAuthSession(
      "admin",
      payload.sessionId
    );

    if (!session) {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    if (session.userId !== payload.userId) {
      return res.status(401).json({
        message: "Invalid session",
      });
    }

    await touchAuthSession(
      "admin",
      payload.sessionId
    );

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId:
        payload.organizationId ?? null,
      sessionId: payload.sessionId,
      dashboard: "admin",
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
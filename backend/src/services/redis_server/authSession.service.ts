import crypto from "crypto";
import { redisClient } from "./redis.client";
import { env } from "../../config/env";

export type DashboardType = "admin" | "ops";

export interface AuthSessionPayload {
  userId: string;
  role: string;
  organizationId: string | null;
  dashboard: DashboardType;
  refreshToken: string;
  ip?: string;
  userAgent?: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  role: string;
  organizationId: string | null;
  dashboard: DashboardType;
  refreshTokenHash: string;
  createdAt: string;
  lastSeenAt: string;
  ip?: string;
  userAgent?: string;
}

const sessionKey = (
  dashboard: DashboardType,
  sessionId: string
) => `auth:session:${dashboard}:${sessionId}`;

const userSessionKey = (
  dashboard: DashboardType,
  userId: string
) => `auth:user-session:${dashboard}:${userId}`;

export const hashToken = (token: string): string => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export const createAuthSession = async (
  payload: AuthSessionPayload
): Promise<AuthSession> => {
  const existingSessionId = await redisClient.get(
    userSessionKey(payload.dashboard, payload.userId)
  );

  if (existingSessionId) {
    await redisClient.del(
      sessionKey(payload.dashboard, existingSessionId)
    );
  }

  const sessionId = crypto.randomUUID();

  const now = new Date().toISOString();

  const session: AuthSession = {
    sessionId,
    userId: payload.userId,
    role: payload.role,
    organizationId: payload.organizationId,
    dashboard: payload.dashboard,
    refreshTokenHash: hashToken(payload.refreshToken),
    createdAt: now,
    lastSeenAt: now,
    ip: payload.ip,
    userAgent: payload.userAgent,
  };

  await redisClient.setEx(
    sessionKey(payload.dashboard, sessionId),
    env.SESSION_TTL_SECONDS,
    JSON.stringify(session)
  );

  await redisClient.setEx(
    userSessionKey(payload.dashboard, payload.userId),
    env.SESSION_TTL_SECONDS,
    sessionId
  );

  return session;
};

export const getAuthSession = async (
  dashboard: DashboardType,
  sessionId: string
): Promise<AuthSession | null> => {
  const raw = await redisClient.get(
    sessionKey(dashboard, sessionId)
  );

  if (!raw) return null;

  return JSON.parse(raw) as AuthSession;
};

export const touchAuthSession = async (
  dashboard: DashboardType,
  sessionId: string
) => {
  const session = await getAuthSession(dashboard, sessionId);

  if (!session) return null;

  session.lastSeenAt = new Date().toISOString();

  await redisClient.setEx(
    sessionKey(dashboard, sessionId),
    env.SESSION_TTL_SECONDS,
    JSON.stringify(session)
  );

  await redisClient.setEx(
    userSessionKey(dashboard, session.userId),
    env.SESSION_TTL_SECONDS,
    sessionId
  );

  return session;
};

export const rotateSessionRefreshToken = async (
  dashboard: DashboardType,
  sessionId: string,
  newRefreshToken: string
) => {
  const session = await getAuthSession(dashboard, sessionId);

  if (!session) {
    throw new Error("Session expired");
  }

  session.refreshTokenHash = hashToken(newRefreshToken);
  session.lastSeenAt = new Date().toISOString();

  await redisClient.setEx(
    sessionKey(dashboard, sessionId),
    env.SESSION_TTL_SECONDS,
    JSON.stringify(session)
  );

  await redisClient.setEx(
    userSessionKey(dashboard, session.userId),
    env.SESSION_TTL_SECONDS,
    sessionId
  );

  return session;
};

export const deleteAuthSession = async (
  dashboard: DashboardType,
  sessionId: string
) => {
  const session = await getAuthSession(dashboard, sessionId);

  if (session) {
    await redisClient.del(
      userSessionKey(dashboard, session.userId)
    );
  }

  await redisClient.del(
    sessionKey(dashboard, sessionId)
  );
};

export const validateRefreshTokenForSession = async (
  dashboard: DashboardType,
  sessionId: string,
  refreshToken: string
) => {
  const session = await getAuthSession(dashboard, sessionId);

  if (!session) {
    throw new Error("Session expired");
  }

  const incomingHash = hashToken(refreshToken);

  if (incomingHash !== session.refreshTokenHash) {
    await deleteAuthSession(dashboard, sessionId);
    throw new Error("Invalid refresh token");
  }

  return session;
};
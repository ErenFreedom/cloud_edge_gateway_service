import dotenv from "dotenv";
import type { SignOptions } from "jsonwebtoken";

dotenv.config({
  path: ".env.local",
});

function required(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Missing required env variable: ${key}`
    );
  }

  return value;
}

export const env = {
  PORT: process.env.PORT || "5000",

  /* DATABASE */
  DB_HOST: required("DB_HOST"),
  DB_PORT: Number(required("DB_PORT")),
  DB_USER: required("DB_USER"),
  DB_PASSWORD: required("DB_PASSWORD"),
  DB_NAME: required("DB_NAME"),

  /* MAIN APP JWT */
  JWT_ACCESS_SECRET: required(
    "JWT_ACCESS_SECRET"
  ),

  JWT_REFRESH_SECRET: required(
    "JWT_REFRESH_SECRET"
  ),

  JWT_ACCESS_EXPIRES_IN:
    (
      process.env.JWT_ACCESS_EXPIRES_IN ||
      "30m"
    ) as SignOptions["expiresIn"],

  JWT_REFRESH_EXPIRES_IN:
    (
      process.env.JWT_REFRESH_EXPIRES_IN ||
      "30d"
    ) as SignOptions["expiresIn"],

  /* OPS DASHBOARD JWT */
  OPS_JWT_ACCESS_SECRET: required(
    "OPS_JWT_ACCESS_SECRET"
  ),

  OPS_JWT_REFRESH_SECRET: required(
    "OPS_JWT_REFRESH_SECRET"
  ),

  OPS_JWT_ACCESS_EXPIRES_IN:
    (
      process.env
        .OPS_JWT_ACCESS_EXPIRES_IN ||
      "30m"
    ) as SignOptions["expiresIn"],

  OPS_JWT_REFRESH_EXPIRES_IN:
    (
      process.env
        .OPS_JWT_REFRESH_EXPIRES_IN ||
      "7d"
    ) as SignOptions["expiresIn"],

  /* EMAIL */
  EMAIL_USER: required("EMAIL_USER"),
  EMAIL_PASS: required("EMAIL_PASS"),

  /* REDIS */
  REDIS_URL:
    process.env.REDIS_URL ||
    "redis://127.0.0.1:6379",

  SESSION_TTL_SECONDS: Number(
    process.env.SESSION_TTL_SECONDS ||
    2592000
  ),
};
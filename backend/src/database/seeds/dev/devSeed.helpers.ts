import crypto from "crypto";
import bcrypt from "bcrypt";
import { Pool, PoolClient } from "pg";

export const createSeedPool = () => {
  const host = process.env.SEED_DB_HOST;
  const port = Number(process.env.SEED_DB_PORT || 5432);
  const database = process.env.SEED_DB_NAME;
  const user = process.env.SEED_DB_USER;
  const password = process.env.SEED_DB_PASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error("Seed DB env values missing");
  }

  return new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: host === "localhost" ? false : { rejectUnauthorized: false },
  });
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const hashSecret = async (secret: string) => {
  return bcrypt.hash(secret, 10);
};

export const deterministicUuid = (input: string) => {
  const hex = crypto.createHash("sha256").update(input).digest("hex");

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    "4" + hex.substring(13, 16),
    "8" + hex.substring(17, 20),
    hex.substring(20, 32),
  ].join("-");
};

export const upsert = async (
  client: PoolClient,
  table: string,
  data: Record<string, any>,
  conflictColumns: string[]
) => {
  const columns = Object.keys(data);
  const values = Object.values(data);

  const placeholders = columns.map((_, i) => `$${i + 1}`);

  const updateColumns = columns.filter(
    (col) => !conflictColumns.includes(col)
  );

  const updateSql = updateColumns
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(", ");

  const sql = `
    INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    ON CONFLICT (${conflictColumns.join(", ")})
    DO UPDATE SET ${updateSql}
  `;

  await client.query(sql, values);
};
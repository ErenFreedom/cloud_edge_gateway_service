import path from "path";
import dotenv from "dotenv";
import { createSeedPool } from "../seeds/dev/devSeed.helpers";
import { seedDevData } from "../seeds/dev/seedDevData";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.seed.dev"),
});

const run = async () => {
  const pool = createSeedPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await seedDevData(client);

    await client.query("COMMIT");

    console.log("🎉 Seed transaction committed");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("❌ Dev seed failed");
    console.error(error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

run();
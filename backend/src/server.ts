import app from "./app";
import { env } from "./config/env";
import { pool } from "./config/database";
import { connectRedis } from "./services/redis_server/redis.client";

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection verified");

    await connectRedis();

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
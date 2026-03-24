import dotenv from "dotenv";
import { pool } from "../../config/database";
import "./mqtt.consumer"; 

dotenv.config();

const startMQTTJob = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MQTT Job DB Connected");

    console.log("MQTT Ingestion Job Started 🚀");

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("MQTT Job failed:", err.message);
    } else {
      console.error("MQTT Job failed:", err);
    }
    process.exit(1);
  }
};

startMQTTJob();
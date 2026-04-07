import { BigQuery } from "@google-cloud/bigquery";
import path from "path";

const bigquery = new BigQuery({
  projectId: process.env.BQ_PROJECT_ID,
});

const DATASET = "cloud_edge_gateway_master_data";

async function loadRaw() {
  const filePath = path.resolve(__dirname, "../data/raw_data.csv");

  const metadata = {
    sourceFormat: "CSV",
    skipLeadingRows: 1,
    writeDisposition: "WRITE_APPEND",
  };

  const [job] = await bigquery
    .dataset(DATASET)
    .table("iot_raw")
    .load(filePath, metadata);

  console.log(`✅ RAW load job ${job.id} completed`);
}

async function loadCalculated() {
  const filePath = path.resolve(__dirname, "../data/calculated_data.csv");

  const metadata = {
    sourceFormat: "CSV",
    skipLeadingRows: 1,
    writeDisposition: "WRITE_APPEND",
  };

  const [job] = await bigquery
    .dataset(DATASET)
    .table("iot_calculated")
    .load(filePath, metadata);

  console.log(`✅ CALC load job ${job.id} completed`);
}

async function main() {
  try {
    await loadRaw();
    await loadCalculated();

    console.log("🚀 ALL DATA LOADED TO BIGQUERY");
  } catch (err) {
    console.error("❌ Load failed:", err);
  }
}

main();
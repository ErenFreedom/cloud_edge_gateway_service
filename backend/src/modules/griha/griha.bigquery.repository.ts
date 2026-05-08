import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

export const getMonthlyConsumptionFromBQ = async (
  sensorId: string,
  month: number,
  year: number
) => {

  const query = `
  SELECT consumption AS total_consumption
  FROM \`project-b5045c0e-60ef-4535-bc3.cloud_edge_gateway_master_data.griha_final_clean\`
  WHERE sensor_id = @sensorId
    AND month = @month
    AND year = @year
  LIMIT 1
`;

  const [rows] = await bigquery.query({
    query,
    params: { sensorId, month, year }
  });

  return rows[0]?.total_consumption ?? null;
};
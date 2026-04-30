import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

export const getMonthlyConsumptionFromBQ = async (
  sensorId: string,
  from: string,
  to: string
) => {

  const query = `
    SELECT 
      SUM(consumption_kwh) AS total_consumption
    FROM \`project-b5045c0e-60ef-4535-bc3.cloud_edge_gateway_master_data.iot_calculated\`
    WHERE sensor_id = @sensorId
      AND timestamp >= @from
      AND timestamp < @to
  `;

  const options = {
    query,
    params: {
      sensorId,
      from,
      to
    }
  };

  const [rows] = await bigquery.query(options);

  
  const value = rows[0]?.total_consumption;

  return value !== null && value !== undefined
    ? Number(value)
    : null;
};
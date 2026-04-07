import { pool } from "../../config/database";

/* ============================= */
/* DELETE OLD RAW DATA */
/* ============================= */

export const deleteOldRawData = async () => {
  const res = await pool.query(`
    DELETE FROM raw_data
    WHERE timestamp_value < NOW() - INTERVAL '7 days'
  `);

  console.log(` RAW deleted: ${res.rowCount}`);
};

/* ============================= */
/* DELETE OLD CALCULATED DATA */
/* ============================= */

export const deleteOldCalculatedData = async () => {
  const res = await pool.query(`
    DELETE FROM calculated_data
    WHERE timestamp < NOW() - INTERVAL '7 days'
  `);

  console.log(`CALC deleted: ${res.rowCount}`);
};
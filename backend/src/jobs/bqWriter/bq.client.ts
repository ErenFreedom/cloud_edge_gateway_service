import { BigQuery } from "@google-cloud/bigquery";

export const bigquery = new BigQuery({
    projectId: process.env.BQ_PROJECT_ID,

});
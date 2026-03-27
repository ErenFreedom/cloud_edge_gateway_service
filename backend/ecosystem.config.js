module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/server.js",
    },
    {
      name: "mqtt-ingestion",
      script: "dist/jobs/mqttIngestion/index.js",
    },
    {
      name: "data-processor",
      script: "dist/jobs/dataProcessor/index.js"
    }
  ]
};
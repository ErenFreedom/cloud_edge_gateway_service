module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/server.js",
    },
    {
      name: "mqtt-ingestion",
      script: "dist/jobs/mqttIngestion/index.js",
    }
  ]
};
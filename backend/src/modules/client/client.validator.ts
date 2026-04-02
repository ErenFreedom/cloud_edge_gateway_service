export const validateTimeSeries = (body: any) => {
  if (!body.sensor_ids || !Array.isArray(body.sensor_ids)) {
    throw new Error("sensor_ids required");
  }

  if (!body.from || !body.to) {
    throw new Error("from & to required");
  }

  if (!body.interval) {
    throw new Error("interval required");
  }

  const allowed = ["10m", "1h", "1d", "1M"];
  if (!allowed.includes(body.interval)) {
    throw new Error("invalid interval");
  }
};
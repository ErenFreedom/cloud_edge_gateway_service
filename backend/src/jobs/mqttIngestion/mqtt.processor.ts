import { SensorPayload, ProcessedRow } from "./mqtt.types";

export const processMessage = (
  topic: string,
  data: unknown
): ProcessedRow | null => {
  try {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid payload type");
    }

    const payload = data as SensorPayload;

    if (!payload.sensor_id || !payload.timestamp) {
      console.error("❌ Missing required fields:", payload);
      return null;
    }

    return {
      topic,
      payload,

      organization_id: payload.client_id ?? null,
      site_id: payload.site_id ?? null,
      sensor_id: payload.sensor_id ?? null,

      device: payload.device ?? null,
      location: payload.location ?? null,
      value: payload.value ?? null,

      quality: payload.quality ?? null,
      quality_good: payload.quality_good ?? null,

      timestamp: payload.timestamp
        ? new Date(payload.timestamp)
        : null,

      metadata: {
        sensor_name: payload.sensor_name,
        sensor_location: payload.location,

        // ✅ FIXED (api_url → api_endpoint)
        api_endpoint: payload.api_url ?? payload.api_endpoint,

        polling_interval: payload.polling_interval,
        upper_bound: payload.upper_bound,
        meter_max_value: payload.meter_max_value,
        max_load_kw: payload.max_load_kw
      }
    };

  } catch (err) {
    console.error("Processing error:", err);
    return null;
  }
};
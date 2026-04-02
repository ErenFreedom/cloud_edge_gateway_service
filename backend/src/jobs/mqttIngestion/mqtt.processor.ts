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

    if (
      payload.sensor_id === undefined ||
      payload.timestamp === undefined
    ) {
      throw new Error("Missing required fields");
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

      timestamp: payload.timestamp ? new Date(payload.timestamp) : null,

      metadata: payload
    };

  } catch (err) {
    console.error("Processing error:", err);
    return null;
  }
};
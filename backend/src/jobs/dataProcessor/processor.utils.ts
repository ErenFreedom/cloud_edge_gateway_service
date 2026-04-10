import { EventType } from "./processor.types";

export const calculateConsumption = (
  prev: number,
  curr: number,
  gapMinutes: number,
  maxLoadKw?: number,
  intervalSec?: number,
  meterMax?: number
): { consumption: number; event: EventType; valid: boolean } => {

  // ---------------- COMM LOSS ----------------
  if (intervalSec && gapMinutes > (2 * intervalSec) / 60) {
    return { consumption: 0, event: "COMM_LOSS", valid: false };
  }

  // ---------------- RESET / ROLLOVER ----------------
  if (curr < prev) {

    // TRUE rollover (only when drop is VERY large)
    if (meterMax && (prev - curr) > 0.9 * meterMax) {
      return {
        consumption: (meterMax - prev) + curr,
        event: "ROLLOVER",
        valid: true
      };
    }

    // small drop → RESET (ignore)
    return { consumption: 0, event: "RESET", valid: false };
  }

  const delta = curr - prev;

  // ---------------- SPIKE DETECTION ----------------
  if (maxLoadKw && intervalSec) {
    const maxPossible = maxLoadKw * (intervalSec / 3600);

    if (delta > maxPossible) {
      return { consumption: 0, event: "SPIKE", valid: false };
    }
  }

  // ---------------- NORMAL ----------------
  return { consumption: delta, event: "OK", valid: true };
};
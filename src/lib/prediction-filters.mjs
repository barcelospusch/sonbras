import { isNighttime } from "@dimitri.pusch/occjs";
import { observationAltitude } from "./astronomy.mjs";
export function filterSitePredictions(
  events,
  {
    latitude,
    longitude,
    altitude,
    duration,
    drop,
    start,
    end,
    night,
    maxMagnitude = /** @type {number | null} */ (null),
    maxUncertaintyKm = /** @type {number | null} */ (null),
  },
) {
  let missingCoordinates = 0;
  const filtered = events
    .map((event) => ({
      ...event,
      observationAltitude: observationAltitude(event, latitude, longitude),
    }))
    .filter((event) => {
      const instant = Date.parse(event.date_time);
      if (
        !Number.isFinite(instant) ||
        instant < Date.parse(start) ||
        instant > Date.parse(end)
      )
        return false;
      if (!Number.isFinite(event.observationAltitude)) {
        missingCoordinates++;
        return false;
      }
      if (event.observationAltitude < altitude) return false;
      if (
        duration > 0 &&
        (typeof event.event_duration !== "number" ||
          event.event_duration < duration)
      )
        return false;
      if (
        drop > 0 &&
        (typeof event.magnitude_drop !== "number" ||
          event.magnitude_drop < drop)
      )
        return false;
      if (
        maxMagnitude !== null &&
        (typeof event.g_star !== "number" ||
          !Number.isFinite(event.g_star) ||
          event.g_star > maxMagnitude)
      )
        return false;
      if (
        maxUncertaintyKm !== null &&
        (typeof event.closest_approach_uncertainty_km !== "number" ||
          !Number.isFinite(event.closest_approach_uncertainty_km) ||
          event.closest_approach_uncertainty_km < 0 ||
          event.closest_approach_uncertainty_km > maxUncertaintyKm)
      )
        return false;
      return !night || isNighttime(latitude, longitude, event.date_time, 0);
    })
    .sort((a, b) => Date.parse(a.date_time) - Date.parse(b.date_time));
  return { events: filtered, missingCoordinates };
}

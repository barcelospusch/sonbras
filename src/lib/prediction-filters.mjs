import { isNighttime } from "@occjs/occjs";
import {
  observationHorizontalCoordinates,
  starMagnitudePerSecond,
} from "./astronomy.mjs";
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
    azimuthStart = null,
    azimuthEnd = null,
    maxBodyMagnitude = null,
    maxStarMagnitudePerSecond = null,
    maxUncertaintyKm = /** @type {number | null} */ (null),
  },
) {
  let missingCoordinates = 0;
  const filtered = events
    .map((event) => {
      const position = observationHorizontalCoordinates(event, latitude, longitude);
      return {
        ...event,
        starMagnitudePerSecond: starMagnitudePerSecond(event),
        observationAltitude: position.altitude,
        observationAzimuth: position.azimuth,
      };
    })
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
      if (azimuthStart !== null || azimuthEnd !== null) {
        const azimuth = event.observationAzimuth;
        const start = azimuthStart ?? 0;
        const end = azimuthEnd ?? 360;
        const inRange = start <= end
          ? (azimuth >= start && azimuth <= end) || (azimuth === 0 && end === 360)
          : azimuth >= start || azimuth <= end;
        if (!inRange) return false;
      }
      const bodyMagnitude = event.apparent_magnitude;
      if (
        maxBodyMagnitude !== null &&
        (!Number.isFinite(bodyMagnitude) || bodyMagnitude > maxBodyMagnitude)
      )
        return false;
      if (
        maxStarMagnitudePerSecond !== null &&
        (event.starMagnitudePerSecond === null ||
          event.starMagnitudePerSecond > maxStarMagnitudePerSecond)
      )
        return false;
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

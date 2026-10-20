export class PredictionQueryError extends Error {}

export function predictionSearchParams(site, filters) {
  return new URLSearchParams({
    latitude: String(site.latitude),
    longitude: String(site.longitude),
    radius: String(site.radiusKm),
    altitude: String(site.minObservationAltitude),
    start: `${filters.start}T00:00:00Z`,
    end: `${filters.end}T23:59:59.999Z`,
    duration: filters.duration,
    drop: filters.drop,
    maxMagnitude: filters.maxMagnitude,
    maxUncertaintyKm: filters.maxUncertaintyKm,
    night: String(filters.night),
  });
}

/** @param {URLSearchParams} p */
export function parsePredictionQuery(p) {
  const latitude = Number(p.get("latitude")),
    longitude = Number(p.get("longitude"));
  const radius = Number(p.get("radius")),
    altitude = Number(p.get("altitude"));
  const duration = Number(p.get("duration") || 0),
    drop = Number(p.get("drop") || 0);
  const magnitudeValue = p.get("maxMagnitude")?.trim();
  const maxMagnitude = magnitudeValue ? Number(magnitudeValue) : null;
  const uncertaintyValue = p.get("maxUncertaintyKm")?.trim();
  const maxUncertaintyKm = uncertaintyValue ? Number(uncertaintyValue) : null;
  const start = p.get("start") || "",
    end = p.get("end") || "";
  const span = Date.parse(end) - Date.parse(start);
  if (
    ["latitude", "longitude", "radius", "altitude"].some(
      (key) => !p.get(key)?.trim(),
    ) ||
    ![latitude, longitude, radius, altitude, duration, drop, span].every(
      Number.isFinite,
    ) ||
    (maxMagnitude !== null && !Number.isFinite(maxMagnitude)) ||
    (maxUncertaintyKm !== null &&
      (!Number.isFinite(maxUncertaintyKm) || maxUncertaintyKm < 0)) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    radius <= 0 ||
    radius > 5000 ||
    altitude < 0 ||
    altitude > 90 ||
    duration < 0 ||
    drop < 0 ||
    span < 0 ||
    span > 93 * 86400000
  ) {
    throw new PredictionQueryError(
      "Verifique as coordenadas, os filtros e o período (máximo de 93 dias).",
    );
  }
  return {
    latitude,
    longitude,
    radius,
    altitude,
    duration,
    drop,
    start,
    end,
    maxMagnitude,
    maxUncertaintyKm,
    night: p.get("night") !== "false",
  };
}

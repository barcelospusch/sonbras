import { polyval } from "@occjs/occjs";

export function predictionMapPath(raw) {
  const {
    t0, t1,
    coeff_latitude: latitude,
    coeff_longitude: longitude,
    min_latitude: south = -90,
    max_latitude: north = 90,
    min_longitude: west = -180,
    max_longitude: east = 180,
  } = (typeof raw === "string" ? JSON.parse(raw) : raw) ?? {};
  const span = (Date.parse(t1) - Date.parse(t0)) / 1000;
  if (
    !(span > 0) ||
    ![latitude, longitude].every(
      (values) => Array.isArray(values) && values.length && values.every(Number.isFinite),
    )
  ) return null;

  const segments = [];
  let segment = [];
  let center;
  // Use the same temporal sampling and prediction bounds as the global map.
  for (let i = 0; i <= 1500; i++) {
    const time = (2 * i / 1500 - 1) * span;
    const lat = polyval(latitude, time);
    const lon = ((polyval(longitude, time) + 180) % 360 + 360) % 360 - 180;
    const withinLongitude = west <= east
      ? lon >= west && lon <= east
      : lon >= west || lon <= east;

    if (lat >= Math.max(-90, south) && lat <= Math.min(90, north) && withinLongitude) {
      segment.push([lon, lat]);
      if (i === 750) center = [lon, lat];
    } else if (segment.length) {
      if (segment.length > 1) segments.push(segment);
      segment = [];
    }
  }
  if (segment.length > 1) segments.push(segment);
  if (!segments.length) return null;
  return { segments, center: center ?? segments[0][Math.floor(segments[0].length / 2)] };
}

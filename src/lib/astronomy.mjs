const lunarPhases = [
  ["🌑", "Lua nova"],
  ["🌒", "Lua crescente"],
  ["🌓", "Quarto crescente"],
  ["🌔", "Lua gibosa crescente"],
  ["🌕", "Lua cheia"],
  ["🌖", "Lua gibosa minguante"],
  ["🌗", "Quarto minguante"],
  ["🌘", "Lua minguante"],
];

export function approximateLunarPhase(dateTime, illumination) {
  const instant = Date.parse(dateTime);
  if (!Number.isFinite(instant)) return null;

  const referenceNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const cycles = (instant - referenceNewMoon) / (29.53059 * 86400000);
  const age = cycles - Math.floor(cycles);
  if (Number.isFinite(illumination) && illumination >= 0 && illumination <= 1) {
    const waxingOctant = Math.round(Math.acos(1 - 2 * illumination) * 4 / Math.PI);
    return lunarPhases[(age <= 0.5 ? waxingOctant : 8 - waxingOctant) % 8];
  }
  return lunarPhases[Math.round(age * 8) % 8];
}

/** Sexagesimal RA is in hours; decimal RA and declination are in degrees. */
export function coordinateDegrees(value, isRA = false) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value !== "string" || !value.trim()) return NaN;
  const parts = value
    .trim()
    .split(/[:\s]+/)
    .map(Number);
  if (parts.some((x) => !Number.isFinite(x)) || parts.length > 3) return NaN;
  if (parts.length === 1) return parts[0];
  const sign = value.trim().startsWith("-") ? -1 : 1;
  return (
    sign *
    (Math.abs(parts[0]) + parts[1] / 60 + (parts[2] || 0) / 3600) *
    (isRA ? 15 : 1)
  );
}
/** Geometric stellar coordinates at the event UTC instant. Azimuth starts at north. */
export function observationHorizontalCoordinates(event, latitude, longitude) {
  const ra = coordinateDegrees(event.ra_star_candidate, true);
  const dec = coordinateDegrees(event.dec_star_candidate);
  const instant = Date.parse(event.date_time);
  if (
    ![ra, dec, instant, latitude, longitude].every(Number.isFinite) ||
    Math.abs(dec) > 90
  )
    return { altitude: NaN, azimuth: NaN };
  const jd = instant / 86400000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const sidereal =
    280.46061837 +
    360.98564736629 * (jd - 2451545) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  const r = Math.PI / 180;
  const h = (sidereal + longitude - ra) * r;
  const phi = latitude * r;
  const delta = dec * r;
  const sinAltitude =
    Math.sin(phi) * Math.sin(delta) +
    Math.cos(phi) * Math.cos(delta) * Math.cos(h);
  const east = -Math.cos(delta) * Math.sin(h);
  const north =
    Math.cos(phi) * Math.sin(delta) -
    Math.sin(phi) * Math.cos(delta) * Math.cos(h);
  return {
    altitude: Math.asin(Math.max(-1, Math.min(1, sinAltitude))) / r,
    azimuth: Math.hypot(east, north) < 1e-12
      ? NaN
      : (Math.atan2(east, north) / r + 360) % 360,
  };
}

export function observationAltitude(event, latitude, longitude) {
  return observationHorizontalCoordinates(event, latitude, longitude).altitude;
}

export function starMagnitudePerSecond({ g_star, event_duration }) {
  if (
    !Number.isFinite(g_star) ||
    !Number.isFinite(event_duration) ||
    event_duration <= 0
  ) {
    return null;
  }
  const ratio = g_star / event_duration;
  return Number.isFinite(ratio) ? ratio : null;
}

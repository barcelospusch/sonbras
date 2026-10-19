/** Sexagesimal RA is in hours; decimal RA and declination are in degrees. */
export function coordinateDegrees(value, isRA = false) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string' || !value.trim()) return NaN;
  const parts = value.trim().split(/[:\s]+/).map(Number);
  if (parts.some(x => !Number.isFinite(x)) || parts.length > 3) return NaN;
  if (parts.length === 1) return parts[0];
  const sign = value.trim().startsWith('-') ? -1 : 1;
  return sign * (Math.abs(parts[0]) + parts[1] / 60 + (parts[2] || 0) / 3600) * (isRA ? 15 : 1);
}
/** Geometric stellar altitude at the site's coordinates and event UTC instant. */
export function observationAltitude(event, latitude, longitude) {
  const ra = coordinateDegrees(event.ra_star_candidate, true);
  const dec = coordinateDegrees(event.dec_star_candidate);
  const instant = Date.parse(event.date_time);
  if (![ra, dec, instant, latitude, longitude].every(Number.isFinite) || Math.abs(dec) > 90) return NaN;
  const jd = instant / 86400000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const sidereal = 280.46061837 + 360.98564736629 * (jd - 2451545) + .000387933 * t * t - t * t * t / 38710000;
  const r = Math.PI / 180;
  const h = (sidereal + longitude - ra) * r;
  const sinAltitude = Math.sin(latitude * r) * Math.sin(dec * r) + Math.cos(latitude * r) * Math.cos(dec * r) * Math.cos(h);
  return Math.asin(Math.max(-1, Math.min(1, sinAltitude))) / r;
}

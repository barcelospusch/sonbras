const optionalFilters = [
  "maxMagnitude",
  "maxUncertaintyKm",
  "azimuthStart",
  "azimuthEnd",
  "maxBodyMagnitude",
  "maxStarMagnitudePerSecond",
];

/** @param {URLSearchParams} params
 * @param {{start:string,end:string,altitude:string,duration:string,drop:string,maxMagnitude:string,maxUncertaintyKm:string,night:boolean}} defaults
 */
export function readSiteFilters(params, defaults) {
  /** @param {string} key @param {string} fallback */
  const date = (key, fallback) => {
    const value = params.get(key);
    if (value === null) return fallback;
    if (value === "") return "";
    const instant = new Date(`${value}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(instant.getTime()) &&
      instant.toISOString().slice(0, 10) === value
      ? value
      : fallback;
  };
  /** @param {string} key @param {string} fallback */
  const numeric = (key, fallback) => {
    const value = params.get(key);
    return value === null
      ? fallback
      : value === "" || Number.isFinite(Number(value))
        ? value
        : fallback;
  };
  return {
    start: date("startDate", defaults.start),
    end: date("endDate", defaults.end),
    duration: numeric("duration", defaults.duration),
    drop: numeric("drop", defaults.drop),
    altitude: numeric("altitude", defaults.altitude),
    azimuthStart: numeric("azimuthStart", ""),
    azimuthEnd: numeric("azimuthEnd", ""),
    maxBodyMagnitude: numeric("maxBodyMagnitude", ""),
    maxStarMagnitudePerSecond: numeric("maxStarMagnitudePerSecond", ""),
    maxMagnitude: numeric("maxMagnitude", defaults.maxMagnitude),
    maxUncertaintyKm: numeric("maxUncertaintyKm", defaults.maxUncertaintyKm),
    night: params.has("night")
      ? params.get("night") !== "false"
      : defaults.night,
  };
}

/** @param {URLSearchParams} params
 * @param {ReturnType<typeof readSiteFilters>} filters
 * @param {{altitude:string}} [defaults]
 */
export function writeSiteFilters(params, filters, defaults) {
  const next = new URLSearchParams(params);
  next.set("startDate", filters.start);
  next.set("endDate", filters.end);
  next.set("duration", filters.duration);
  next.set("drop", filters.drop);
  next.set("night", String(filters.night));
  next.delete("maxBodyMagnitudePerSecond");
  if (filters.altitude === defaults?.altitude) next.delete("altitude");
  else next.set("altitude", filters.altitude);
  for (const key of optionalFilters) {
    if (!filters[key]) next.delete(key);
    else next.set(key, filters[key]);
  }
  return next;
}

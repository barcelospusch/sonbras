import "server-only";
import { PrecisePrediction } from "@/lib/occjs-client.mjs";
import { filterSitePredictions } from "@/lib/prediction-filters.mjs";
export async function searchPredictions(filters, signal) {
  const {
    latitude,
    longitude,
    radius,
    duration,
    drop,
    start,
    end,
    maxMagnitude,
    maxUncertaintyKm,
  } = filters;
  const data = await new PrecisePrediction().getData(
    {
      date_time_after: start,
      date_time_before: end,
      latitude,
      longitude,
      location_radius: radius,
      event_duration_min: duration,
      magnitude_drop_min: drop,
      magnitude_max: maxMagnitude ?? undefined,
      closestApproachUncertaintyKmMax: maxUncertaintyKm ?? undefined,
    },
    {
      limit: "all",
      signal: AbortSignal.any([signal, AbortSignal.timeout(55000)]),
    },
  );
  // The LIneA geographic filter checks the corridor interior as well as its limits.
  // A second sampled-point geofilter can reject
  // a site inside a wide shadow. Do not intersect its incomplete result with LIneA's.
  return filterSitePredictions(data, filters);
}

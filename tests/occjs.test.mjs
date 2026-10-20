import test from "node:test";
import assert from "node:assert/strict";
import { PrecisePrediction } from "../src/lib/occjs-client.mjs";
import { parsePredictionQuery } from "../src/lib/prediction-query.mjs";
import { filterSitePredictions } from "../src/lib/prediction-filters.mjs";

const query = () =>
  new URLSearchParams({
    latitude: "0",
    longitude: "0",
    radius: "200",
    altitude: "0",
    start: "2026-10-20T00:00:00Z",
    end: "2026-10-21T00:00:00Z",
    night: "false",
  });

test("uncertainty filter is optional and rejects invalid bounds", () => {
  const params = query();
  assert.equal(parsePredictionQuery(params).maxUncertaintyKm, null);
  for (const value of ["-1", "NaN", "Infinity"]) {
    params.set("maxUncertaintyKm", value);
    assert.throws(() => parsePredictionQuery(params));
  }
  params.set("maxUncertaintyKm", "0");
  assert.equal(parsePredictionQuery(params).maxUncertaintyKm, 0);
});

test("uncertainty excludes unknown and non-finite values only when enabled", () => {
  const filters = { ...parsePredictionQuery(query()), altitude: 0 };
  const event = {
    date_time: "2026-10-20T12:00:00Z",
    ra_star_candidate: "12:00:00",
    dec_star_candidate: "+00:00:00",
  };
  // Use the computed altitude so this test isolates uncertainty filtering.
  filters.altitude = -90;
  const events = [0, 10, 11, undefined, NaN, Infinity].map((value, id) => ({
    ...event,
    id,
    closest_approach_uncertainty_km: value,
  }));
  assert.equal(filterSitePredictions(events, filters).events.length, 6);
  assert.deepEqual(
    filterSitePredictions(events, {
      ...filters,
      maxUncertaintyKm: 10,
    }).events.map((e) => e.id),
    [0, 1],
  );
});

test("occjs 0.3.1 paginates capped pages, maps new aliases and preserves Gaia IDs", async (t) => {
  const urls = [];
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    urls.push(new URL(url));
    assert.equal(options.signal, controller.signal);
    const page = Number(new URL(url).searchParams.get("page"));
    return new Response(
      `{"count":3,"results":[{"id":${page},"gaia_source_id":6234567890123456789}]}`,
    );
  });
  const results = await new PrecisePrediction().getData(
    { closestApproachUncertaintyKmMax: 10 },
    { limit: "all", signal: controller.signal },
  );
  assert.equal(results.length, 3);
  assert.deepEqual(
    urls.map((url) => url.searchParams.get("page")),
    ["1", "2", "3"],
  );
  assert.ok(
    urls.every(
      (url) =>
        url.searchParams.get("closest_approach_uncertainty_km_max") === "10",
    ),
  );
  assert.ok(
    results.every((event) => event.gaia_source_id === "6234567890123456789"),
  );
});

test("search cancellation reaches the transport", async (t) => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    options.signal.throwIfAborted();
  });
  await assert.rejects(
    new PrecisePrediction().getData({}, { signal: controller.signal }),
    { name: "AbortError" },
  );
});

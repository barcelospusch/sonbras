import test from "node:test";
import assert from "node:assert/strict";
import { readSiteFilters, writeSiteFilters } from "../src/lib/site-filters.mjs";
import {
  parsePredictionQuery,
  predictionSearchParams,
} from "../src/lib/prediction-query.mjs";

const defaults = {
  start: "2026-10-20",
  end: "2026-10-27",
  duration: "0",
  drop: "0",
  maxMagnitude: "",
  maxUncertaintyKm: "",
  night: true,
};

test("site filter URLs restore all fields, including zero and disabled nighttime", () => {
  const filters = {
    ...defaults,
    start: "2026-11-01",
    end: "2026-11-03",
    duration: "1.5",
    drop: "2",
    maxMagnitude: "0",
    maxUncertaintyKm: "10",
    night: false,
  };
  const params = writeSiteFilters(
    new URLSearchParams("source=shared"),
    filters,
  );
  assert.equal(params.get("source"), "shared");
  assert.equal(params.get("startDate"), "2026-11-01");
  assert.equal(params.get("endDate"), "2026-11-03");
  assert.deepEqual(readSiteFilters(params, defaults), filters);
  const restored = readSiteFilters(params, defaults);
  const request = predictionSearchParams(
    {
      latitude: -25,
      longitude: -49,
      radiusKm: 200,
      minObservationAltitude: 20,
    },
    restored,
  );
  const query = parsePredictionQuery(request);
  assert.equal(query.maxMagnitude, 0);
  assert.equal(query.night, false);
  assert.equal(query.duration, 1.5);
});

test("empty optional limits are removed without deleting unrelated parameters", () => {
  const params = writeSiteFilters(
    new URLSearchParams("maxMagnitude=15&maxUncertaintyKm=5&source=shared"),
    defaults,
  );
  assert.equal(params.has("maxMagnitude"), false);
  assert.equal(params.has("maxUncertaintyKm"), false);
  assert.equal(params.get("source"), "shared");
  assert.deepEqual(readSiteFilters(params, defaults), defaults);
});

test("invalid URL values fall back safely while empty form drafts remain editable", () => {
  assert.deepEqual(
    readSiteFilters(
      new URLSearchParams(
        "startDate=2026-99-99&endDate=2026-02-30&duration=NaN&drop=Infinity",
      ),
      defaults,
    ),
    defaults,
  );
  const draft = { ...defaults, start: "", duration: "" };
  assert.deepEqual(
    readSiteFilters(writeSiteFilters(new URLSearchParams(), draft), defaults),
    draft,
  );
  assert.deepEqual(readSiteFilters(new URLSearchParams(), defaults), defaults);
});

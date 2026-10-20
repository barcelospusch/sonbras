import test from "node:test";
import assert from "node:assert/strict";
import {
  publicProfileData,
  publicObservationData,
  publicObservationId,
  samePublicData,
} from "../src/lib/public-data.mjs";
import { number, utcDate } from "../src/lib/format.js";
import { profileInput } from "../src/lib/repositories/profile.js";
import { observerIdentity } from "../src/lib/observations.mjs";
import {
  createPredictionCache,
  CACHE_TTL_MS,
} from "../src/lib/server/prediction-cache.mjs";

test("formatting preserves decimals without ambiguous thousands separators", () => {
  assert.equal(number(12345.67, 2), "12345.67");
  assert.equal(number(0), "0");
  assert.equal(number(NaN), "—");
  assert.equal(utcDate("invalid"), "Data indisponível");
});

test("observer names link only to valid public profiles", () => {
  const observer = {
    displayName: "Dimitri Barcelos Pusch",
    username: "dimitri",
    isPublic: true,
  };
  assert.deepEqual(observerIdentity(observer), {
    name: "Dimitri Barcelos Pusch",
    href: "/users/dimitri",
  });
  assert.deepEqual(observerIdentity({ ...observer, isPublic: false }), {
    name: "Dimitri Barcelos Pusch",
    href: null,
  });
  assert.equal(observerIdentity({ ...observer, username: "" }).href, null);
  assert.equal(
    observerIdentity({ ...observer, username: "../private" }).href,
    null,
  );
  assert.deepEqual(
    observerIdentity({ displayName: "", isPublic: false }, "Dimitri"),
    { name: "Dimitri", href: null },
  );
  assert.deepEqual(observerIdentity(null), { name: "Observador", href: null });
});

test("profile validation normalizes and whitelists editable fields", () => {
  assert.deepEqual(
    profileInput({
      displayName: " Observer ",
      institution: " Institute ",
      username: " OBSERVER ",
      isPublic: true,
      email: "private@example.com",
    }),
    {
      displayName: "Observer",
      institution: "Institute",
      username: "observer",
      isPublic: true,
    },
  );
  assert.throws(() =>
    profileInput({ displayName: "Observer", username: "invalid name" }),
  );
  assert.throws(() => profileInput({ displayName: "", username: "observer" }));
  assert.throws(() =>
    profileInput({
      displayName: "Observer",
      username: "observer",
      institution: "x".repeat(151),
    }),
  );
});

test("public synchronization skips identical documents and removes unexpected fields", () => {
  const profile = {
    displayName: "Observer",
    username: "observer",
    institution: "",
    isPublic: true,
  };
  assert.equal(samePublicData({ ...profile }, profile), true);
  assert.equal(
    samePublicData({ ...profile, email: "private@example.com" }, profile),
    false,
  );
  assert.equal(samePublicData({ ...profile, isPublic: false }, profile), false);
  assert.equal(samePublicData(undefined, profile), false);
});

test("public projections exclude email, preferences, coordinates and site IDs", async () => {
  assert.deepEqual(
    publicProfileData({
      username: "observer",
      displayName: "Observer",
      institution: "Institute",
      isPublic: true,
      email: "private@example.com",
      theme: "red",
    }),
    {
      username: "observer",
      displayName: "Observer",
      institution: "Institute",
      isPublic: true,
    },
  );
  const observation = {
    eventId: "event",
    eventName: "Event",
    dateTime: "2026-10-20T00:00:00Z",
    siteName: "Site",
    tag: "planned",
  };
  assert.deepEqual(
    publicObservationData({
      ...observation,
      siteId: "private-site",
      latitude: 1,
      longitude: 2,
      updatedAt: "private",
    }),
    observation,
  );
  const id = await publicObservationId("event~private-site");
  assert.match(id, /^[a-f0-9]{64}$/);
  assert.equal(await publicObservationId("event~private-site"), id);
  assert.notEqual(await publicObservationId("event~other-site"), id);
});

test("memory cache works without Firebase, separates parts, expires and retries failures", async () => {
  const cache = createPredictionCache();
  let calls = 0;
  const now = Date.now();
  const load = async () => ({ revision: ++calls });
  assert.deepEqual(await cache("id", "event", load, now), { revision: 1 });
  assert.deepEqual(await cache("id", "event", load, now), { revision: 1 });
  assert.deepEqual(await cache("id", "paths", load, now), { revision: 2 });
  assert.deepEqual(
    await cache("id", "event", load, now + CACHE_TTL_MS + 1000),
    { revision: 3 },
  );
  await assert.rejects(
    cache("other", "event", async () => {
      throw new Error("offline");
    }),
  );
  assert.deepEqual(await cache("other", "event", load), { revision: 4 });
});

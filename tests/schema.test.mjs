import test from "node:test";
import assert from "node:assert/strict";
import { Timestamp } from "firebase-admin/firestore";
import {
  observationData,
  serializeObservation,
} from "../src/lib/observations.mjs";
import { migrateUser, migrateObservation } from "../scripts/lib/migration.mjs";
test("flat observation fields round trip through Firestore timestamps", () => {
  const data = observationData(
    { id: "event", date_time: "2026-10-20T12:00:00Z", name: "Evento" },
    { id: "site", name: "Local" },
    "planned",
  );
  assert.deepEqual(
    Object.keys(data).sort(),
    ["eventId", "siteId", "tag", "eventName", "dateTime", "siteName"].sort(),
  );
  assert.deepEqual(
    serializeObservation("obs", {
      ...data,
      dateTime: Timestamp.fromDate(new Date(data.dateTime)),
    }),
    { id: "obs", ...data },
  );
  assert.throws(() => observationData({ date_time: "invalid" }, {}, "planned"));
});
test("migration converts old schema and accepts current schema", () => {
  const now = Timestamp.now(),
    profile = migrateUser({ email: "a@b.com", theme: "red" }, now);
  assert.equal(profile.email, "a@b.com");
  assert.equal(profile.theme, "red");
  assert.equal("preferences" in profile, false);
  assert.equal("createdAt" in profile, false);
  assert.deepEqual(migrateUser(profile, now), profile);
  const converted = migrateObservation(
    {
      eventId: "event",
      siteId: "site",
      status: "observed",
      eventSnapshot: { name: "Evento", dateTime: now },
      siteNameSnapshot: "Local",
      createdAt: now,
    },
    now,
  );
  assert.deepEqual(converted, {
    eventId: "event",
    siteId: "site",
    tag: "observed",
    eventName: "Evento",
    dateTime: now,
    siteName: "Local",
    updatedAt: now,
  });
  assert.deepEqual(migrateObservation(converted, now), converted);
});

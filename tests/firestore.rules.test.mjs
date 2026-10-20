import test from "node:test";
import assert from "node:assert/strict";
import { deleteApp } from "firebase/app";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  connectFirestoreEmulator,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

test(
  "profile writes and username reservations are protected atomically",
  { skip: !process.env.FIRESTORE_EMULATOR_HOST },
  async () => {
    const environment = await initializeTestEnvironment({
      projectId: "demo-sonbras",
      firestore: {
        rules: await readFile(
          new URL("../firestore.rules", import.meta.url),
          "utf8",
        ),
      },
    });
    let repositoryApp;
    try {
      const owner = environment.authenticatedContext("owner").firestore();
      const other = environment.authenticatedContext("other").firestore();
      const profile = {
        displayName: "Observer",
        email: "observer@example.com",
        institution: "",
        isPublic: false,
        theme: "dark",
        username: "",
        updatedAt: serverTimestamp(),
      };
      await assertSucceeds(setDoc(doc(owner, "users", "owner"), profile));
      await assertFails(
        updateDoc(doc(other, "users", "owner"), {
          displayName: "Changed",
          updatedAt: serverTimestamp(),
        }),
      );
      await assertSucceeds(
        updateDoc(doc(owner, "users", "owner"), {
          displayName: "Updated",
          updatedAt: serverTimestamp(),
        }),
      );
      await assertFails(
        updateDoc(doc(owner, "users", "owner"), {
          username: "observer",
          updatedAt: serverTimestamp(),
        }),
      );
      await assertSucceeds(
        runTransaction(owner, async (tx) => {
          tx.set(doc(owner, "usernames", "observer"), { uid: "owner" });
          tx.update(doc(owner, "users", "owner"), {
            username: "observer",
            updatedAt: serverTimestamp(),
          });
        }),
      );
      await assertFails(
        setDoc(doc(other, "usernames", "observer"), { uid: "other" }),
      );
      await assertFails(
        setDoc(doc(owner, "usernames", "unused"), { uid: "owner" }),
      );
      await assertSucceeds(
        runTransaction(owner, async (tx) => {
          tx.delete(doc(owner, "usernames", "observer"));
          tx.set(doc(owner, "usernames", "new-observer"), { uid: "owner" });
          tx.update(doc(owner, "users", "owner"), {
            username: "new-observer",
            updatedAt: serverTimestamp(),
          });
        }),
      );
      const anonymous = environment.unauthenticatedContext().firestore();
      const publicProfile = {
        username: "new-observer",
        displayName: "Updated",
        institution: "",
        isPublic: true,
      };
      await assertSucceeds(
        runTransaction(owner, async (tx) => {
          tx.update(doc(owner, "users", "owner"), {
            isPublic: true,
            updatedAt: serverTimestamp(),
          });
          tx.set(doc(owner, "publicUsers", "owner"), publicProfile);
        }),
      );
      const observation = {
        eventId: "event",
        eventName: "Event",
        dateTime: Timestamp.now(),
        siteName: "Site",
        tag: "planned",
      };
      await assertSucceeds(
        setDoc(
          doc(owner, "publicUsers", "owner", "observations", "opaque-id"),
          observation,
        ),
      );
      await assertSucceeds(getDoc(doc(anonymous, "publicUsers", "owner")));
      await assertSucceeds(getDoc(doc(anonymous, "usernames", "new-observer")));
      await assertFails(getDocs(collection(anonymous, "publicUsers")));
      await assertSucceeds(
        getDocs(collection(anonymous, "publicUsers", "owner", "observations")),
      );
      await assertFails(getDoc(doc(anonymous, "users", "owner")));
      await assertFails(
        setDoc(doc(owner, "publicUsers", "owner"), {
          ...publicProfile,
          email: "leak@example.com",
        }),
      );
      await assertFails(
        setDoc(doc(owner, "publicUsers", "owner", "observations", "leak"), {
          ...observation,
          siteId: "private",
        }),
      );
      await assertFails(
        setDoc(doc(other, "publicUsers", "owner"), publicProfile),
      );
      // Even a stale public mirror cannot expose a profile once the private flag is revoked.
      await assertSucceeds(
        updateDoc(doc(owner, "users", "owner"), {
          isPublic: false,
          updatedAt: serverTimestamp(),
        }),
      );
      await assertFails(getDoc(doc(anonymous, "publicUsers", "owner")));
      await assertFails(
        getDocs(collection(anonymous, "publicUsers", "owner", "observations")),
      );

      // Exercise the real JavaScript repositories with a mocked Web SDK session.
      Object.assign(process.env, {
        NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-sonbras.firebaseapp.com",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-sonbras",
        NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app",
      });
      const firebase = await import("../src/lib/firebase.js");
      repositoryApp = firebase.auth.app;
      const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
      connectFirestoreEmulator(firebase.db, host, Number(port), {
        mockUserToken: { sub: "owner" },
      });
      const { saveProfile } = await import(
        "../src/lib/repositories/profile.js"
      );
      const { saveSite } = await import("../src/lib/repositories/sites.js");
      const { saveObservation, removeObservation } = await import(
        "../src/lib/repositories/observations.js"
      );
      const { readPublicProfile, syncPublicObservations } = await import(
        "../src/lib/repositories/public-profile.js"
      );
      const values = {
        displayName: "Web observer",
        institution: "Institute",
        username: "web-observer",
        isPublic: true,
      };
      await saveProfile("owner", values);
      const siteValues = {
        name: "Site",
        latitude: 0,
        longitude: 0,
        radiusKm: 200,
        minObservationAltitude: 20,
      };
      await saveSite("owner", siteValues);
      const sites = await getDocs(firebase.sitesRef("owner"));
      const site = { id: sites.docs[0].id, ...siteValues };
      await saveSite("owner", siteValues, site.id);
      const event = {
        id: "event-web",
        name: "Web event",
        date_time: "2026-10-20T12:00:00Z",
      };
      await saveObservation("owner", event, site, "planned");
      const observationId = `event-web~${site.id}`;
      const stored = await getDoc(
        firebase.observationRef("owner", observationId),
      );
      assert.equal(stored.data().siteId, site.id);
      await syncPublicObservations("owner", [
        { id: observationId, data: stored.data() },
      ]);
      const published = await readPublicProfile("web-observer");
      assert.equal(published.profile.displayName, "Web observer");
      assert.equal(published.observations.length, 1);
      assert.equal("siteId" in published.observations[0], false);
      await saveProfile("owner", { ...values, isPublic: false });
      await assert.rejects(
        readPublicProfile("web-observer"),
        /não está público/,
      );
      const preview = await readPublicProfile("web-observer", "owner");
      assert.equal(preview.profile.isPublic, false);
      assert.equal(preview.observations.length, 1);
      await removeObservation("owner", { id: observationId });
      assert.equal(
        (await readPublicProfile("web-observer", "owner")).observations.length,
        0,
      );
    } finally {
      if (repositoryApp) await deleteApp(repositoryApp);
      await environment.cleanup();
    }
  },
);

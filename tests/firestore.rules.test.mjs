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
  documentId,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  startAfter,
  getDoc,
  getDocs,
  collection,
  connectFirestoreEmulator,
  setDoc,
  deleteDoc,
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
        isAdmin: false,
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

      const admin = environment.authenticatedContext("admin").firestore();
      await environment.withSecurityRulesDisabled(async (context) => {
        const seed = context.firestore();
        await setDoc(doc(seed, "users", "admin"), { ...profile, isAdmin: true });
        const { isAdmin, ...legacyProfile } = profile;
        await setDoc(doc(seed, "users", "legacy"), legacyProfile);
        await setDoc(doc(seed, "defaultSites", "public-site"), { name: "Public site" });
      });
      const legacy = environment.authenticatedContext("legacy").firestore();
      await assertFails(setDoc(doc(other, "users", "other"), { ...profile, isAdmin: true }));
      await assertFails(updateDoc(doc(owner, "users", "owner"), { isAdmin: true, updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(doc(legacy, "users", "legacy"), { isAdmin: true, updatedAt: serverTimestamp() }));
      await assertSucceeds(updateDoc(doc(legacy, "users", "legacy"), { theme: "light", updatedAt: serverTimestamp() }));
      await assertFails(getDocs(collection(owner, "users")));
      const adminQuery = query(collection(admin, "users"), orderBy(documentId()), limit(26));
      const adminPage = await assertSucceeds(getDocsFromServer(adminQuery));
      assert.ok(adminPage.size >= 2);
      const nextPage = await assertSucceeds(getDocsFromServer(
        query(adminQuery, startAfter(adminPage.docs[0].id)),
      ));
      assert.equal(nextPage.docs[0].id, adminPage.docs[1].id);
      await assertSucceeds(runTransaction(admin, async (tx) => {
        tx.set(doc(admin, "usernames", "admin-edited"), { uid: "legacy" });
        tx.update(doc(admin, "users", "legacy"), {
          username: "admin-edited",
          displayName: "Edited by admin",
          isPublic: true,
          isAdmin: true,
          updatedAt: serverTimestamp(),
        });
        tx.set(doc(admin, "publicUsers", "legacy"), {
          username: "admin-edited",
          displayName: "Edited by admin",
          institution: "",
          isPublic: true,
        });
      }));
      await assertSucceeds(getDoc(doc(anonymous, "publicUsers", "legacy")));
      await assertSucceeds(getDocs(collection(legacy, "users")));
      await assertSucceeds(updateDoc(doc(admin, "users", "legacy"), {
        isAdmin: false,
        updatedAt: serverTimestamp(),
      }));
      await assertFails(getDocs(collection(legacy, "users")));
      await assertFails(updateDoc(doc(admin, "users", "legacy"), {
        email: "fake@example.com",
        updatedAt: serverTimestamp(),
      }));
      const ownerSite = doc(owner, "users", "owner", "sites", "test-site");
      const adminSite = doc(admin, "users", "owner", "sites", "test-site");
      await assertSucceeds(setDoc(ownerSite, {
        name: "Site",
        latitude: 0,
        longitude: 0,
        radiusKm: 100,
        minObservationAltitude: 10,
        updatedAt: serverTimestamp(),
      }));
      await assertSucceeds(getDocs(collection(admin, "users", "owner", "sites")));
      await assertFails(getDoc(doc(other, "users", "owner", "sites", "test-site")));
      await assertSucceeds(updateDoc(adminSite, { radiusKm: 200, updatedAt: serverTimestamp() }));
      await assertFails(updateDoc(adminSite, { radiusKm: 6000, updatedAt: serverTimestamp() }));
      await assertFails(deleteDoc(doc(other, "users", "owner", "sites", "test-site")));
      await assertSucceeds(deleteDoc(adminSite));
      assert.equal((await getDoc(ownerSite)).exists(), false);
      await assertFails(getDocs(collection(admin, "users", "owner", "observations")));
      await assertSucceeds(getDocs(collection(anonymous, "defaultSites")));
      await assertFails(setDoc(doc(admin, "defaultSites", "public-site"), { name: "Changed" }));

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
      await environment.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), "defaultSites", site.id), { name: "Observatório padrão" });
      });
      const defaultSite = { id: site.id, name: "Observatório padrão", siteSource: "default" };
      const defaultObservationId = `event-web~default~${site.id}`;
      const defaultMarkRef = firebase.observationRef("owner", defaultObservationId);
      await saveObservation("owner", event, defaultSite, "interested");
      await saveObservation("owner", event, defaultSite, "observed");
      const defaultMark = await getDoc(defaultMarkRef);
      assert.equal(defaultMark.data().siteSource, "default");
      assert.equal(defaultMark.data().tag, "observed");
      await assertFails(saveObservation("owner", event, { ...defaultSite, name: "Nome incorreto" }, "planned"));
      await assertFails(saveObservation("owner", event, { ...defaultSite, id: "ausente" }, "planned"));
      const ownWithDefault = await readPublicProfile("web-observer");
      const publishedMarks = ownWithDefault.observations.filter((mark) => mark.eventId === event.id);
      assert.equal(publishedMarks.length, 2);
      assert.ok(publishedMarks.every((mark) => !("siteSource" in mark) && !("siteId" in mark)));
      await removeObservation("owner", { id: defaultObservationId });
      assert.equal((await getDoc(defaultMarkRef)).exists(), false);
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

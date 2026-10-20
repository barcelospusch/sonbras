import { onSnapshot, orderBy, query } from "firebase/firestore";
import { db, userRef, sitesRef, observationsRef } from "../firebase.js";
import { serializeObservation } from "../observations.mjs";
import { defaultProfile, ensureProfile, syncProfileEmail } from "./profile.js";
import { syncPublicProfile, syncPublicObservations } from "./public-profile.js";

export function subscribeUserData(user, callbacks) {
  if (!db) return;
  let active = true;
  let publicSync = Promise.resolve();
  const safe = Object.fromEntries(
    Object.entries(callbacks).map(([name, callback]) => [
      name,
      (value) => {
        if (active) callback(value);
      },
    ]),
  );
  const errors = {
    profile: "",
    observations: "",
    publicProfile: "",
    publicObservations: "",
    email: "",
  };
  function report(name, message = "") {
    errors[name] = message;
    safe.setProfileError(Object.values(errors).filter(Boolean).join(" "));
  }
  function publish(name, task, message) {
    publicSync = publicSync
      .then(async () => {
        if (!active) return;
        await task();
        report(name);
      })
      .catch(() => report(name, message));
  }
  const unsubscribeSites = onSnapshot(
    query(sitesRef(user.uid), orderBy("updatedAt", "desc")),
    (snapshot) => {
      safe.setSites(
        snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })),
      );
      safe.setSitesLoading(false);
      safe.setError("");
    },
    () => {
      safe.setSitesLoading(false);
      safe.setError(
        "Não foi possível ler seus sítios. Verifique a conexão e as regras do Firestore.",
      );
    },
  );
  const unsubscribeProfile = onSnapshot(
    userRef(user.uid),
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.exists()) {
        if (!snapshot.metadata.fromCache)
          ensureProfile(user).catch(() => {
            report(
              "profile",
              "Não foi possível criar seu perfil. Verifique as regras do Firestore.",
            );
            safe.setProfileLoading(false);
          });
        return;
      }
      const data = snapshot.data();
      const theme = ["dark", "light", "red"].includes(data.theme)
        ? data.theme
        : "dark";
      safe.setProfile({ ...defaultProfile, ...data, theme });
      safe.applyTheme(theme);
      safe.setProfileLoading(false);
      report("profile");
      if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache)
        return;
      if (data.email !== (user.email || "")) {
        syncProfileEmail(user)
          .then(() => report("email"))
          .catch(() =>
            report("email", "Não foi possível sincronizar seu e-mail."),
          );
      }
      publish(
        "publicProfile",
        () => syncPublicProfile(user.uid, data),
        "Não foi possível sincronizar seu perfil público. Verifique as regras do Firestore.",
      );
    },
    () => {
      report(
        "profile",
        "Não foi possível carregar seu perfil. Verifique as regras do Firestore.",
      );
      safe.setProfileLoading(false);
    },
  );
  const unsubscribeObservations = onSnapshot(
    query(observationsRef(user.uid), orderBy("dateTime", "asc")),
    { includeMetadataChanges: true },
    (snapshot) => {
      safe.setObservations(
        snapshot.docs.map((entry) => ({
          ...serializeObservation(entry.id, entry.data()),
          updatedAt: entry.data().updatedAt,
        })),
      );
      report("observations");
      if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache)
        return;
      const entries = snapshot.docs.map((entry) => ({
        id: entry.id,
        data: entry.data(),
      }));
      publish(
        "publicObservations",
        () => syncPublicObservations(user.uid, entries),
        "Não foi possível sincronizar suas marcações públicas. Verifique as regras do Firestore.",
      );
    },
    () =>
      report(
        "observations",
        "Não foi possível carregar suas marcações. Verifique a conexão e as regras do Firestore.",
      ),
  );
  return () => {
    active = false;
    unsubscribeSites();
    unsubscribeProfile();
    unsubscribeObservations();
  };
}

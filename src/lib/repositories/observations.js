import { getDocsFromServer, query, serverTimestamp, Timestamp, where, writeBatch } from "firebase/firestore";
import {
  getDatabase,
  observationRef,
  observationsRef,
  publicObservationRef,
} from "../firebase.js";
import { observationData, observationSiteKey } from "../observations.mjs";
import { publicObservationData, publicObservationId } from "../public-data.mjs";

export async function saveObservation(uid, event, site, tag, existing) {
  const data = observationData(event, site, tag);
  const id = existing?.id || `${data.eventId}~${observationSiteKey(data.siteId, data.siteSource)}`;
  const stored = {
    ...data,
    dateTime: Timestamp.fromDate(new Date(data.dateTime)),
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(getDatabase());
  batch.set(observationRef(uid, id), stored);
  batch.set(
    publicObservationRef(uid, await publicObservationId(id)),
    publicObservationData(stored),
  );
  await batch.commit();
}

export async function removeObservation(uid, observation) {
  const batch = writeBatch(getDatabase());
  await deleteObservationDocuments(batch, uid, observation.id);
  await batch.commit();
}

export async function listPersonalSiteObservationIds(uid, siteId) {
  const snapshot = await getDocsFromServer(query(observationsRef(uid), where("siteId", "==", siteId)));
  // Older personal observations have no siteSource field.
  return snapshot.docs
    .filter((entry) => entry.get("siteSource") !== "default")
    .map((entry) => entry.id);
}

export async function deleteObservationDocuments(batch, uid, id) {
  const publicId = await publicObservationId(id);
  batch.delete(observationRef(uid, id));
  batch.delete(publicObservationRef(uid, publicId));
}

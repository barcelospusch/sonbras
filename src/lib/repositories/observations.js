import { serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import {
  getDatabase,
  observationRef,
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
  batch.delete(observationRef(uid, observation.id));
  batch.delete(
    publicObservationRef(uid, await publicObservationId(observation.id)),
  );
  await batch.commit();
}

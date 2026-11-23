import {
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { defaultSitesRef, getDatabase, sitesRef, siteRef } from "../firebase.js";
import { deleteObservationDocuments, listPersonalSiteObservationIds } from "./observations.js";

async function saveSiteDocument(collection, values, siteId) {
  const data = { ...values, updatedAt: serverTimestamp() };
  if (siteId) await updateDoc(doc(collection, siteId), data);
  else return (await addDoc(collection, data)).id;
}

export async function saveSite(uid, values, siteId) {
  await saveSiteDocument(sitesRef(uid), values, siteId);
}

export function saveDefaultSite(values, siteId) {
  return saveSiteDocument(defaultSitesRef(), values, siteId);
}

export function removeDefaultSite(siteId) {
  return deleteDoc(doc(defaultSitesRef(), siteId));
}

export async function removeSite(uid, siteId, { withObservations = false } = {}) {
  const site = siteRef(uid, siteId);
  if (!withObservations) {
    await deleteDoc(site);
    return;
  }

  const ids = await listPersonalSiteObservationIds(uid, siteId);
  // Each observation takes two writes. Reserve one write for the site.
  const batchSize = 249;
  let offset = 0;
  do {
    const batch = writeBatch(getDatabase());
    const group = ids.slice(offset, offset + batchSize);
    await Promise.all(group.map((id) => deleteObservationDocuments(batch, uid, id)));
    offset += group.length;
    if (offset === ids.length) batch.delete(site);
    await batch.commit();
  } while (offset < ids.length);
}

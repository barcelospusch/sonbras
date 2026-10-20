import {
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { sitesRef, siteRef } from "../firebase.js";

export async function saveSite(uid, values, siteId) {
  const data = { ...values, updatedAt: serverTimestamp() };
  if (siteId) await updateDoc(siteRef(uid, siteId), data);
  else await addDoc(sitesRef(uid), data);
}

export async function removeSite(uid, siteId) {
  await deleteDoc(siteRef(uid, siteId));
}

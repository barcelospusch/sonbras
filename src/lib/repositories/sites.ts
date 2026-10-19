import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Site } from '@/lib/types';

export type SiteInput = Pick<Site, 'name' | 'latitude' | 'longitude' | 'radiusKm' | 'minObservationAltitude'>;

export async function saveSite(uid: string, values: SiteInput, siteId?: string) {
  if (!db) throw new Error('Firebase não configurado.');
  if (siteId) {
    await updateDoc(doc(db, 'users', uid, 'sites', siteId), { ...values, updatedAt: serverTimestamp() });
  } else {
    await addDoc(collection(db, 'users', uid, 'sites'), {
      ...values, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }
}

export async function removeSite(uid: string, siteId: string) {
  if (!db) throw new Error('Firebase não configurado.');
  await deleteDoc(doc(db, 'users', uid, 'sites', siteId));
}

import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { eventId, type Event, type Observation, type ObservationTag, type Site } from '@/lib/types';
import { taggedData } from '@/lib/tagged.mjs';

export async function saveObservation(uid: string, event: Event, site: Site, tag: ObservationTag, existing?: Observation) {
  if (!db) throw new Error('Firebase não configurado.');
  const id = `${eventId(event)}~${site.id}`;
  const data=taggedData(event,site,tag);
  await setDoc(doc(db,'users',uid,'tagged',id),{...data,eventSnapshot:{...data.eventSnapshot,dateTime:Timestamp.fromDate(new Date(data.eventSnapshot.dateTime))},createdAt:existing?.createdAt || serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function removeObservation(uid: string, observation: Pick<Observation,'id'>) {
  if (!db) throw new Error('Firebase não configurado.');
  await deleteDoc(doc(db,'users',uid,'tagged',observation.id));
}

import { Timestamp } from 'firebase-admin/firestore';
export const CACHE_TTL_MS=5*60*1000;
/** Cache is never a source of permanent truth. An expired or unavailable entry is a miss. */
export async function cachedPrediction(database,id,part,load,now=Date.now()) {
  const ref=database?.collection('predictionCache').doc(id);
  if (ref) {
    try {
      const snapshot=await ref.get(),entry=snapshot.data();
      if (entry?.expiresAt?.toMillis()>now && entry.data?.[part]!==undefined) return entry.data[part];
    } catch { /* Upstream remains available during cache storage failures. */ }
  }
  const value=await load();
  if (ref) {
    try {
      await database.runTransaction(async transaction=>{
        const current=await transaction.get(ref),entry=current.data(),fresh=entry?.expiresAt?.toMillis()>now;
        transaction.set(ref,{data:{...(fresh ? entry.data : {}),[part]:value},fetchedAt:fresh ? entry.fetchedAt : Timestamp.fromMillis(now),expiresAt:fresh ? entry.expiresAt : Timestamp.fromMillis(now+CACHE_TTL_MS)});
      });
    } catch { /* A successful scientific query must not fail because its cache write failed. */ }
  }
  return value;
}

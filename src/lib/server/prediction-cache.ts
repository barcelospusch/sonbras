import 'server-only';
import { adminConfigured, adminDatabase } from './firebase-admin';
import { cachedPrediction } from './prediction-cache.mjs';
export async function predictionCache<T>(id:string,part:'event'|'paths',load:()=>Promise<T>):Promise<T> {
  let database=null;
  if (adminConfigured()) {try {database=adminDatabase();} catch { /* Optional cache configuration must not disable upstream queries. */ }}
  return cachedPrediction(database,id,part,load) as Promise<T>;
}

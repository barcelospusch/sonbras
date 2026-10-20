export const CACHE_TTL_MS = 5 * 60 * 1000;
export function createPredictionCache() {
  const entries = new Map();
  return async function cachedPrediction(id, part, load, now = Date.now()) {
    const key = `${id}:${part}`,
      entry = entries.get(key);
    if (entry && entry.expiresAt > now) return entry.value;
    const value = await load();
    for (const [key, entry] of entries)
      if (entry.expiresAt <= now) entries.delete(key);
    if (entries.size >= 200) entries.delete(entries.keys().next().value);
    entries.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  };
}
export const predictionCache = createPredictionCache();

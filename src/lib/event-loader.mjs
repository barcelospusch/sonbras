import { PrecisePrediction } from "./occjs-client.mjs";

/** Retry transient detail failures once, while preserving cancellation and 404s. */
export async function loadEvent(id, signal, api = new PrecisePrediction()) {
  for (let attempt = 0; attempt < 2; attempt++) {
    signal.throwIfAborted();
    try {
      return await api.getPrediction(id, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
      });
    } catch (error) {
      signal.throwIfAborted();
      const transient =
        error.name === "TimeoutError" ||
        error instanceof TypeError ||
        [429, 502, 503, 504].includes(error.status);
      if (attempt === 1 || !transient) throw error;
    }
  }
}

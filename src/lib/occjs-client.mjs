import { Prediction, OccJSError } from '@dimitri.pusch/occjs';
import { parse } from 'lossless-json';

// Preserve integer identifiers before JavaScript's Number conversion can round them.
export function parsePredictionJson(text) {
  return parse(text, undefined, value => /^-?\d+$/.test(value) && !Number.isSafeInteger(Number(value)) ? value : Number(value));
}

/** occjs 0.2.0 transport adapter. Query aliases and pagination remain owned by occjs. */
export class PrecisePrediction extends Prediction {
  constructor(options={}) {
    super(options);
    this.signal=options.signal;
  }
  async _fetchData(params = {}, id = null, signal = null) {
    const endpoint = this.endpoint.replace(/^\/+|\/+$/g, '');
    const url = new URL(`${endpoint}/${id === null ? '' : `${encodeURIComponent(String(id))}/`}`, `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal:signal || this.signal });
    if (!response.ok) throw new OccJSError(`LIneA HTTP ${response.status}`, response.status);
    return parsePredictionJson(await response.text());
  }
  async _fetchEndpoint(subEndpoint,id=null,params={}) {
    const endpoint=`${this.endpoint.replace(/\/$/,'')}/${id===null ? '' : `${encodeURIComponent(String(id))}/`}${subEndpoint}`;
    return new PrecisePrediction({baseUrl:this.baseUrl,endpoint,signal:this.signal})._fetchData(params);
  }
}

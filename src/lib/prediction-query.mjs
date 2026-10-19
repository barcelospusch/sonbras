export class PredictionQueryError extends Error {}

/** @param {URLSearchParams} p */
export function parsePredictionQuery(p) {

  const latitude = Number(p.get('latitude')), longitude = Number(p.get('longitude'));
  const radius = Number(p.get('radius')), altitude = Number(p.get('altitude'));
  const duration = Number(p.get('duration') || 0), drop = Number(p.get('drop') || 0);
  const magnitudeValue=p.get('maxMagnitude')?.trim();
  const maxMagnitude=magnitudeValue ? Number(magnitudeValue) : null;
  const start = p.get('start') || '', end = p.get('end') || '';
  const span = Date.parse(end) - Date.parse(start);
  if (['latitude','longitude','radius','altitude'].some(key => !p.get(key)?.trim()) ||
      ![latitude, longitude, radius, altitude, duration, drop, span].every(Number.isFinite) ||
      (maxMagnitude!==null && !Number.isFinite(maxMagnitude)) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || radius <= 0 || radius > 5000 ||
      altitude < 0 || altitude > 90 || duration < 0 || drop < 0 || span < 0 || span > 93 * 86400000) {
    throw new PredictionQueryError('Verifique as coordenadas, os filtros e o período (máximo de 93 dias).');
  }
  return {latitude,longitude,radius,altitude,duration,drop,start,end,maxMagnitude,night:p.get('night')!=='false'};
}

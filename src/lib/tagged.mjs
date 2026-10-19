export const statuses=['interested','planned','observed'];
export function gaiaIdString(value) {
  if (typeof value==='string' && /^\d+$/.test(value)) return value;
  return typeof value==='number' && Number.isSafeInteger(value) && value>=0 ? String(value) : null;
}
export function taggedData(event,site,status) {
  if (!statuses.includes(status)) throw new Error('Status de observação inválido.');
  const instant=new Date(event.date_time);
  if (!Number.isFinite(instant.getTime())) throw new Error('Data do evento inválida.');
  return {
    eventId:String(event.hash_id || event.id),siteId:site.id,status,
    eventSnapshot:{name:event.name || event.provisional_designation || 'Ocultação estelar',dateTime:instant.toISOString(),gaiaSourceId:gaiaIdString(event.gaia_source_id)},
    siteNameSnapshot:site.name,
  };
}
export function serializeTagged(id,data) {
  const value=data.eventSnapshot?.dateTime;
  const date=value && typeof value.toDate==='function' ? value.toDate() : new Date(value);
  return {id,eventId:data.eventId,siteId:data.siteId,status:data.status,eventSnapshot:{name:data.eventSnapshot?.name || 'Ocultação estelar',dateTime:Number.isFinite(date.getTime()) ? date.toISOString() : '',gaiaSourceId:gaiaIdString(data.eventSnapshot?.gaiaSourceId)},siteNameSnapshot:data.siteNameSnapshot || ''};
}

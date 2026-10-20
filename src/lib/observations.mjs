import { validUsername } from "./username.mjs";

export const tagLabels = {
  interested: "Tenho interesse",
  planned: "Vou observar",
  observed: "Observado",
};
export const observationTags = Object.keys(tagLabels);
export const eventId = (event) => String(event.hash_id || event.id);
export function observerIdentity(profile, fallbackName) {
  const name =
    (typeof profile?.displayName === "string" && profile.displayName.trim()) ||
    (typeof fallbackName === "string" && fallbackName.trim()) ||
    "Observador";
  const href =
    profile?.isPublic === true && validUsername(profile.username)
      ? `/users/${encodeURIComponent(profile.username)}`
      : null;
  return { name, href };
}
export function observationData(event, site, status) {
  if (!observationTags.includes(status))
    throw new Error("Status de observação inválido.");
  const instant = new Date(event.date_time);
  if (!Number.isFinite(instant.getTime()))
    throw new Error("Data do evento inválida.");
  return {
    eventId: eventId(event),
    siteId: site.id,
    tag: status,
    eventName:
      event.name || event.provisional_designation || "Ocultação estelar",
    dateTime: instant.toISOString(),
    siteName: site.name,
  };
}
export function serializeObservation(id, data) {
  const value = data.dateTime;
  const date =
    value && typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);
  return {
    id,
    eventId: data.eventId,
    siteId: data.siteId,
    tag: data.tag,
    eventName: data.eventName || "Ocultação estelar",
    dateTime: Number.isFinite(date.getTime()) ? date.toISOString() : "",
    siteName: data.siteName || "",
  };
}

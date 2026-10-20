import { Timestamp } from "firebase-admin/firestore";
import { normalizeUsername, validUsername } from "../../src/lib/username.mjs";
import { observationTags } from "../../src/lib/observations.mjs";
const legacyStatus = {
  interesse: "interested",
  "vou-observar": "planned",
  observado: "observed",
};
function timestamp(value, fallback) {
  if (value && typeof value.toDate === "function") return value;
  if (value === null || value === undefined) {
    if (fallback) return fallback;
    throw new Error("Timestamp ausente.");
  }
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime()))
    throw new Error("Timestamp inválido.");
  return Timestamp.fromDate(instant);
}
export function migrateUser(data, now = Timestamp.now()) {
  const allowed = new Set([
    "username",
    "displayName",
    "institution",
    "isPublic",
    "email",
    "preferences",
    "theme",
    "createdAt",
    "updatedAt",
  ]);
  const unknown = Object.keys(data).filter((key) => !allowed.has(key));
  if (unknown.length)
    throw new Error(`Campos de usuário sem mapeamento: ${unknown.join(", ")}.`);
  if (
    data.preferences &&
    Object.keys(data.preferences).some((key) => key !== "theme")
  )
    throw new Error(
      "Preferências adicionais precisam de mapeamento explícito.",
    );
  if (
    (data.username != null && typeof data.username !== "string") ||
    (data.displayName != null &&
      (typeof data.displayName !== "string" ||
        data.displayName.length > 100)) ||
    (data.institution != null &&
      (typeof data.institution !== "string" || data.institution.length > 150))
  )
    throw new Error("Campos de perfil inválidos.");
  const username = normalizeUsername(data.username || "");
  if (username && !validUsername(username))
    throw new Error("Nome de usuário legado inválido.");
  const theme = data.preferences?.theme || data.theme || "dark";
  if (!["dark", "light", "red"].includes(theme))
    throw new Error("Tema legado inválido.");
  return {
    username,
    displayName: data.displayName || "",
    institution: data.institution || "",
    isPublic: data.isPublic === true,
    email: data.email || "",
    theme,
    updatedAt: timestamp(data.updatedAt, now),
  };
}
export function migrateObservation(data, now = Timestamp.now()) {
  const allowed = new Set([
    "eventId",
    "siteId",
    "status",
    "eventSnapshot",
    "siteNameSnapshot",
    "createdAt",
    "updatedAt",
    "tag",
    "eventName",
    "dateTime",
    "siteName",
    "gaiaSourceId",
  ]);
  if (Object.keys(data).some((key) => !allowed.has(key)))
    throw new Error(
      "Campos adicionais de marcação precisam de mapeamento explícito.",
    );
  if (
    data.eventSnapshot &&
    Object.keys(data.eventSnapshot).some(
      (key) => !["name", "dateTime", "gaiaSourceId"].includes(key),
    )
  )
    throw new Error(
      "Campos adicionais do resumo precisam de mapeamento explícito.",
    );
  const status = data.status || legacyStatus[data.tag] || data.tag;
  if (!observationTags.includes(status)) throw new Error("Status legado inválido.");
  if (
    !/^[\w-]{1,128}$/.test(data.eventId || "") ||
    !/^[\w-]{1,128}$/.test(data.siteId || "")
  )
    throw new Error("Identificador de evento ou sítio inválido.");
  const name = data.eventSnapshot?.name || data.eventName,
    siteNameSnapshot = data.siteNameSnapshot || data.siteName;
  if (
    typeof name !== "string" ||
    !name ||
    typeof siteNameSnapshot !== "string" ||
    !siteNameSnapshot
  )
    throw new Error("Resumo do evento ou nome do sítio ausente.");
  return {
    eventId: data.eventId,
    siteId: data.siteId,
    tag: status,
    eventName: name,
    dateTime: timestamp(data.eventSnapshot?.dateTime || data.dateTime),
    siteName: siteNameSnapshot,
    updatedAt: timestamp(data.updatedAt, now),
  };
}

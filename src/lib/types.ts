import type { OccultationPrediction } from "@dimitri.pusch/occjs";
export interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  minObservationAltitude: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}
export type Event = Omit<OccultationPrediction, "id"> & {
  id: string | number;
  observationAltitude?: number;
  hash_id?: string;
  shadowStatus?: "shadow" | "sigma" | "outside" | "unknown";
  shadowDistanceKm?: number;
};
export type Theme = "dark" | "light" | "red";
export interface Profile {
  displayName: string;
  institution: string;
  username: string;
  preferences: { theme: Theme };
  isPublic: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
export type ObservationTag = "interested" | "planned" | "observed";
export interface Observation {
  id: string;
  eventId: string;
  siteId: string;
  status: ObservationTag;
  eventSnapshot: { name: string; dateTime: string; gaiaSourceId: string | null };
  siteNameSnapshot: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
export type PublicObservation=Omit<Observation,'siteId'|'createdAt'|'updatedAt'>;
export const tagLabels: Record<ObservationTag, string> = {
  interested: "Tenho interesse",
  planned: "Vou observar",
  observed: "Observado",
};
export const number = (value: unknown, digits = 1) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("pt-BR", { maximumFractionDigits: digits })
    : "—";
export const eventId = (event: Event) => String(event.hash_id || event.id);
export const utcDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "medium",
        timeZone: "UTC",
      }).format(date);
};

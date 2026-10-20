"use client";
import Link from "next/link";
import { useState } from "react";
import {
  CalendarBlankIcon,
  MapPinIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useApp } from "./app-provider";
import { removeObservation } from "@/lib/repositories/observations";
import { utcDate } from "@/lib/format";
import { tagLabels, observerIdentity } from "@/lib/observations.mjs";

export function ObservationIdentity({ siteName, observer, fallbackName }) {
  const { name, href } = observerIdentity(observer, fallbackName);
  return (
    <span className="observation-identity">
      {siteName} -{" "}
      {href ? (
        <Link href={href} className="observer-link">
          {name}
        </Link>
      ) : (
        <span>{name}</span>
      )}
    </span>
  );
}

export function ObservationList({ observations, own = false, observer }) {
  const { user, profile } = useApp();
  const observedBy = own ? profile : observer;
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  if (!observations.length)
    return (
      <div className="empty-state">
        <h3>Nenhum evento marcado por aqui</h3>
        <p>As marcações de observação aparecerão nesta página.</p>
      </div>
    );
  return (
    <div className="observation-list">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {observations.map((o) => {
        const siteId = "siteId" in o ? o.siteId : "";
        return (
          <div
            className={`observation-item ${own ? "with-actions" : ""}`}
            key={o.id}
          >
            <div className="observation-card">
              <Link
                className="observation-event"
                href={`/events/${encodeURIComponent(o.eventId)}${own && siteId ? `?site=${encodeURIComponent(siteId)}` : ""}`}
              >
                <span className={`observation-tag tag-${o.tag}`}>
                  {tagLabels[o.tag]}
                </span>
                <h3>{o.eventName}</h3>
                <p>
                  <CalendarBlankIcon size={15} weight="duotone" />
                  {utcDate(o.dateTime)} UTC
                </p>
              </Link>
              <span>
                <MapPinIcon size={18} weight="duotone" />
                <ObservationIdentity
                  siteName={o.siteName}
                  observer={observedBy}
                  fallbackName={own ? user?.displayName : undefined}
                />
              </span>
            </div>
            {own && user && (
              <button
                type="button"
                className="icon-button remove-mark"
                title="Remover marcação"
                aria-label={`Remover marcação de ${o.eventName} em ${o.siteName}`}
                disabled={!!busy}
                onClick={async () => {
                  setBusy(o.id);
                  setError("");
                  try {
                    await removeObservation(user.uid, o);
                  } catch {
                    setError(
                      "Não foi possível remover a marcação. Tente novamente.",
                    );
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <TrashIcon size={19} weight="duotone" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

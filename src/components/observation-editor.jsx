"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TagIcon } from "@phosphor-icons/react";
import { useApp } from "./app-provider";
import { eventId, observationSiteKey, tagLabels } from "@/lib/observations.mjs";
import { ObservationIdentity } from "./observation-list";
import {
  removeObservation,
  saveObservation,
} from "@/lib/repositories/observations";
export function ObservationEditor({ event, initialSiteId, initialSiteSource }) {
  const { user, sites, defaultSites, defaultSitesLoading, observations, profile, loading, profileError } = useApp();
  const [selected, setSelected] = useState(initialSiteId ? observationSiteKey(initialSiteId, initialSiteSource) : ""),
    [tag, setTag] = useState("planned");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const marks = observations.filter((o) => o.eventId === eventId(event));
  const defaultIds = new Set(
    marks.filter((mark) => mark.siteSource === "default").map((mark) => mark.siteId),
  );
  if (initialSiteSource === "default") defaultIds.add(initialSiteId);
  const availableSites = [
    ...defaultSites.filter((site) => defaultIds.has(site.id)).map((site) => ({ ...site, siteSource: "default" })),
    ...sites,
  ];
  const selectedSite = selected
    ? availableSites.find((site) => observationSiteKey(site.id, site.siteSource) === selected)
    : availableSites[0];
  const selectedKey = selectedSite ? observationSiteKey(selectedSite.id, selectedSite.siteSource) : "";
  const currentMark = marks.find((mark) =>
    observationSiteKey(mark.siteId, mark.siteSource) === selectedKey,
  );
  useEffect(() => {
    setTag(currentMark?.tag || "planned");
  }, [selectedKey, currentMark?.tag]);
  return (
    <section className="detail-panel observation-editor">
      <div className="filter-title">
        <TagIcon size={22} weight="duotone" />
        <h2>Este evento está nos seus planos?</h2>
      </div>
      {!user ? (
        <p>
          <Link href="/login" className="text-link">
            Entre na sua conta
          </Link>{" "}
          para marcar o evento e indicar de qual sítio pretende observar.
        </p>
      ) : loading || (defaultIds.size > 0 && defaultSitesLoading) ? (
        <p>Carregando seus sítios…</p>
      ) : !availableSites.length ? (
        <p>
          <Link href="/" className="text-link">
            Cadastre um sítio
          </Link>{" "}
          para planejar esta observação.
        </p>
      ) : (
        <>
          <form
            className="observation-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedSite) return;
              setBusy(true);
              setError("");
              setNotice("");
              try {
                await saveObservation(
                  user.uid,
                  event,
                  selectedSite,
                  tag,
                  currentMark,
                );
                setNotice("Marcação salva.");
              } catch {
                setError(
                  "Não foi possível salvar a marcação. Verifique sua conexão e as regras do Firestore.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Sítio de observação
              <select
                value={selectedKey}
                required
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="" disabled>
                  Escolha um sítio
                </option>
                {availableSites.map((site) => {
                  const key = observationSiteKey(site.id, site.siteSource);
                  return (
                    <option key={key} value={key}>
                      {site.name}{site.siteSource === "default" ? " (sítio padrão)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              Minha tag
              <select value={tag} onChange={(e) => setTag(e.target.value)}>
                {Object.entries(tagLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" disabled={busy || !selectedSite}>
              <TagIcon size={18} weight="duotone" />
              {busy ? "Salvando…" : "Salvar marcação"}
            </button>
          </form>
          <p className="field-hint">
            {profile.isPublic
              ? "Seu perfil público mostra seu nome, esta tag e o nome do sítio, sem coordenadas."
              : "Suas marcações estão privadas. Você pode compartilhá-las ativando o perfil público em Minha conta."}
          </p>
        </>
      )}
      {user && marks.length > 0 && (
        <div className="my-marks">
          {marks.map((mark) => (
            <div key={mark.id}>
              <span className={`observation-tag tag-${mark.tag}`}>
                {tagLabels[mark.tag]}
              </span>
              <strong>
                <ObservationIdentity
                  siteName={mark.siteName}
                  observer={profile}
                  fallbackName={user?.displayName}
                />
              </strong>
              {availableSites.some((site) => site.id === mark.siteId && site.siteSource === mark.siteSource) && (
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => {
                    setSelected(observationSiteKey(mark.siteId, mark.siteSource));
                    setTag(mark.tag);
                    setNotice("Ajuste a tag e salve a marcação.");
                  }}
                >
                  Editar
                </button>
              )}
              <button
                className="text-link"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  setNotice("");
                  try {
                    await removeObservation(user.uid, mark);
                    setNotice("Marcação removida.");
                  } catch {
                    setError("Não foi possível remover a marcação.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
      {(error || profileError) && (
        <p className="error" role="alert">
          {error || profileError}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}

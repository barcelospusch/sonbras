"use client";
import { useApp } from "@/components/app-provider";
import { ObservationEditor } from "@/components/observation-editor";
import { ShadowDot } from "@/components/shadow-dot";
import { Shell } from "@/components/shell";
import { SkyArt } from "@/components/sky-art";
import { observationAltitude } from "@/lib/astronomy.mjs";
import { number, utcDate } from "@/lib/format";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BinocularsIcon,
  CalendarBlankIcon,
  ClockIcon,
  CrosshairIcon,
  StarFourIcon,
  TrendDownIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
export default function EventPage({ params }) {
  const { id } = use(params);
  const search = useSearchParams();
  const { sites } = useApp();
  const site = sites.find((s) => s.id === search.get("site"));
  const [event, setEvent] = useState(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setEvent(null);
    setError("");
    fetch(`/api/events/${encodeURIComponent(id)}`, { signal: c.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then(setEvent)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [id, retry]);
  const official = `https://solarsystem.linea.org.br/prediction-event-detail/${encodeURIComponent(id)}`;
  return (
    <Shell>
      <Link className="back-link" href={site ? `/sites/${site.id}` : "/"}>
        <ArrowLeftIcon size={17} />
        {site ? `Predições de ${site.name}` : "Meus sítios"}
      </Link>
      {error ? (
        <div className="empty-state">
          <h2>Não foi possível abrir o evento</h2>
          <p role="alert" className="error">
            {error}
          </p>
          <button
            className="button secondary"
            onClick={() => setRetry((v) => v + 1)}
          >
            Tentar novamente
          </button>
          <a
            href={official}
            className="text-link"
            target="_blank"
            rel="noreferrer"
          >
            Consultar no LIneA <ArrowUpRightIcon size={17} />
          </a>
        </div>
      ) : !event ? (
        <div className="empty-state">
          <span className="loader" />
          <h3>Carregando evento…</h3>
        </div>
      ) : (
        <>
          <section className="event-hero hero">
            <SkyArt />
            <div className="hero-copy">
              <span className="pill">
                <StarFourIcon size={14} weight="duotone" /> OCULTAÇÃO ESTELAR
              </span>
              <h1>{event.name || event.principal_designation}</h1>
              <p>
                <CalendarBlankIcon size={18} weight="duotone" />{" "}
                {utcDate(event.date_time)} UTC
              </p>
              <a
                href={official}
                className="button"
                target="_blank"
                rel="noreferrer"
              >
                Ver evento oficial no LIneA <ArrowUpRightIcon size={18} />
              </a>
            </div>
          </section>
          <div className="event-stats">
            <Metric
              icon={<ClockIcon size={23} weight="duotone" />}
              label="Duração prevista"
              value={`${number(event.event_duration, 2)} s`}
            />
            <Metric
              icon={<TrendDownIcon size={23} weight="duotone" />}
              label="Queda de magnitude"
              value={`${number(event.magnitude_drop, 2)} mag`}
            />
            <Metric
              icon={<StarFourIcon size={23} weight="duotone" />}
              label="Magnitude da estrela (G)"
              value={number(event.g_star, 2)}
            />
            <Metric
              icon={<BinocularsIcon size={23} weight="duotone" />}
              label={site ? `Altitude em ${site.name}` : "Velocidade da sombra"}
              value={
                site
                  ? `${number(observationAltitude(event, site.latitude, site.longitude))}°`
                  : `${number(event.velocity, 2)} km/s`
              }
            />
          </div>
          <ObservationEditor event={event} initialSiteId={search.get("site")} />
          {site && (
            <p className="site-shadow-status">
              <ShadowDot
                id={id}
                latitude={site.latitude}
                longitude={site.longitude}
                showLabel
              />
              <span>· {site.name}</span>
            </p>
          )}
          <section className="detail-panel">
            <div className="filter-title">
              <CrosshairIcon size={22} weight="duotone" />
              <h2>Detalhes da predição</h2>
            </div>
            <dl className="detail-grid">
              <Detail
                label="Ascensão reta da estrela"
                value={event.ra_star_candidate}
              />
              <Detail
                label="Declinação da estrela"
                value={event.dec_star_candidate}
              />
              <Detail
                label="Identificador Gaia"
                value={
                  typeof event.gaia_source_id === "number" &&
                  !Number.isSafeInteger(event.gaia_source_id)
                    ? "Indisponível"
                    : event.gaia_source_id
                }
              />
              <Detail label="Número do corpo" value={event.number} />
              <Detail
                label="Designação principal"
                value={
                  event.principal_designation || event.provisional_designation
                }
              />
              <Detail
                label="Velocidade (km/s)"
                value={number(event.velocity, 2)}
              />
              <Detail
                label="Ângulo de posição (°)"
                value={number(event.position_angle, 2)}
              />
              <Detail
                label="Incerteza da trajetória (km)"
                value={number(event.closest_approach_uncertainty_km, 2)}
              />
            </dl>
          </section>
          <div className="bottom-note">
            <span className="tile-icon">
              <BinocularsIcon size={25} weight="duotone" />
            </span>
            <div>
              <h3>Prepare-se para o instante.</h3>
              <p>
                Consulte o mapa da sombra, as atualizações e os dados completos
                na página oficial.
              </p>
            </div>
            <a href={official} target="_blank" rel="noreferrer">
              Abrir no LIneA <ArrowUpRightIcon size={18} />
            </a>
          </div>
          <p className="field-hint">
            A duração é a previsão central do evento e pode variar conforme a
            posição do observador. A altitude usa as coordenadas do sítio e o
            instante central, sem refração atmosférica.
          </p>
        </>
      )}
    </Shell>
  );
}
function Metric({ icon, label, value }) {
  return (
    <div className="metric-card">
      <span className="tile-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </dd>
    </div>
  );
}

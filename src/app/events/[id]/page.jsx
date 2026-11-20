"use client";
import { useApp } from "@/components/app-provider";
import { EventPastBadge } from "@/components/event-past-badge";
import { EventSkyChart } from "@/components/event-sky-chart";
import { EventObservationButtons } from "@/components/observation-editor";
import { ShadowDot } from "@/components/shadow-dot";
import { Shell } from "@/components/shell";
import {
  approximateLunarPhase,
  observationAltitude,
} from "@/lib/astronomy.mjs";
import { number, utcDate } from "@/lib/format";
import {
  AngleIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CalendarBlankIcon,
  ClockIcon,
  CrosshairIcon,
  PlanetIcon,
  StarIcon,
  TrendDownIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
export default function EventPage({ params }) {
  const { id } = use(params);
  const search = useSearchParams();
  const { sites, defaultSites } = useApp();
  const defaultSiteId = search.get("defaultSite");
  const site = defaultSiteId
    ? defaultSites.find((s) => s.id === defaultSiteId)
    : sites.find((s) => s.id === search.get("site"));
  const sitePath = defaultSiteId ? "/sites/default" : "/sites";
  const [event, setEvent] = useState(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [catalog, setCatalog] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    setEvent(null);
    setError("");
    setCatalog(null);
    fetch(`/api/events/${encodeURIComponent(id)}?star=1`, { signal: c.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((star) => {
        if (!c.signal.aborted) {
          setCatalog({
            id,
            star: star && Object.keys(star).length ? star : null,
          });
        }
      })
      .catch(() => {
        if (!c.signal.aborted) setCatalog({ id, star: null });
      });
    fetch(`/api/events/${encodeURIComponent(id)}?maps=1`, { signal: c.signal })
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
  const star = catalog?.id === id ? catalog : null;
  const designation =
    event?.principal_designation || event?.provisional_designation;
  const objectName = event?.name?.trim();
  const showObjectName =
    objectName &&
    designation &&
    objectName.toLowerCase() !== designation.trim().toLowerCase();
  return (
    <Shell>
      <Link
        className="back-link"
        href={site ? `${sitePath}/${encodeURIComponent(site.id)}` : "/"}
      >
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
            <div className="hero-copy">
              <div className="event-hero-badges">
                <span className="pill">
                  <StarIcon size={14} weight="duotone" aria-hidden="true" />
                  Ocultação estelar
                </span>
                {site && (
                  <div className="pill site-shadow-status">
                    <ShadowDot
                      id={id}
                      latitude={site.latitude}
                      longitude={site.longitude}
                      showLabel="compact"
                    />
                    <span className="shadow-site-name" title={site.name}>{site.name}</span>
                  </div>
                )}
                <EventObservationButtons
                  key={`${id}:${search.get("site") || ""}:${defaultSiteId || ""}`}
                  event={event}
                  siteId={defaultSiteId || search.get("site")}
                  siteSource={defaultSiteId ? "default" : undefined}
                />
              </div>
              <h1>{designation || objectName}</h1>
              {showObjectName && (
                <p className="event-object-name">{objectName}</p>
              )}
              <EventPastBadge dateTime={event.date_time} />
              <p className="event-time">
                <CalendarBlankIcon size={28} weight="duotone" aria-hidden="true" />
                {dateInUtc(event.date_time) || "Data indisponível"}
              </p>
              <a
                href={official}
                className="button"
                target="_blank"
                rel="noreferrer"
              >
                Ver no LIneA <ArrowUpRightIcon size={16} />
              </a>
            </div>
            <div className="event-hero-map-column">
              <EventMoon event={event} />
              {event.predictionMaps?.global && (
                <iframe
                  className="event-hero-map"
                  title="Mapa global da predição"
                  srcDoc={event.predictionMaps.global}
                  sandbox="allow-scripts"
                />
              )}
            </div>
          </section>
          <section aria-labelledby="event-summary">
            <h2 id="event-summary" className="event-summary-title">
              Resumo da observação
            </h2>
            <div className="event-stats">
              <Metric
                icon={<ClockIcon size={23} weight="duotone" />}
                label="Duração central prevista"
                value={measurement(event.event_duration, 2, "s")}
              />
              <Metric
                icon={<TrendDownIcon size={23} weight="duotone" />}
                label="Queda de magnitude"
                value={measurement(event.magnitude_drop, 2, "mag")}
              />
              <Metric
                icon={<StarIcon size={23} weight="duotone" />}
                label="Magnitude da estrela (G)"
                value={measurement(
                  event.g_star ?? star?.star?.phot_g_mean_mag,
                  3,
                  "mag",
                )}
              />
              <Metric
                icon={<CrosshairIcon size={23} weight="duotone" />}
                label="Incerteza no horário (1σ)"
                value={measurement(event.instant_uncertainty, 2, "s")}
              />
              {site && (
                <Metric
                  icon={<AngleIcon size={23} weight="duotone" />}
                  label={`Altitude em ${site.name}`}
                  value={measurement(
                    observationAltitude(event, site.latitude, site.longitude),
                    1,
                    "°",
                  )}
                />
              )}
            </div>
          </section>

          <EventSkyChart
            key={id}
            rightAscension={event.ra_star_candidate}
            declination={event.dec_star_candidate}
          />
          <EventDetails event={event} catalog={star} />
        </>
      )}
    </Shell>
  );
}
function EventMoon({ event }) {
  const illuminated = event.moon_illuminated_fraction;
  const phase = approximateLunarPhase(event.date_time, illuminated);
  const fraction =
    Number.isFinite(illuminated) && illuminated >= 0 && illuminated <= 1
      ? `${number(illuminated * 100, 1)}%`
      : null;
  const separation = Number.isFinite(event.moon_separation)
    ? `${number(event.moon_separation, 1)}°`
    : null;
  if (!phase && !fraction && !separation) return null;

  return (
    <ul
      className="event-moon"
      aria-label="Condições lunares na hora da ocultação"
    >
      {phase && (
        <li>
          <span role="img" aria-label={`${phase[1]} (aproximada)`} title={`${phase[1]} (aprox.)`}>
            {phase[0]}
          </span>
          Lua
        </li>
      )}
      {fraction && (
        <li>
          <span aria-hidden="true">💡</span> {fraction} iluminada
        </li>
      )}
      {separation && (
        <li>
          <span role="img" aria-label="Separação angular" title="Separação angular">{'📐'}</span>
          {separation}
        </li>
      )}
    </ul>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric-card">
      <span className="tile-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}
function EventDetails({ event, catalog }) {
  const gaiaId =
    typeof event.gaia_source_id === "number" &&
    !Number.isSafeInteger(event.gaia_source_id)
      ? null
      : event.gaia_source_id;

  const circumstances = [
    ["Separação angular mínima", measurement(event.closest_approach, 4, "″")],
    ["Ângulo de posição", measurement(event.position_angle, 2, "°")],
    ["Velocidade no plano do céu", measurement(event.velocity, 4, "km/s")],
    ["Distância geocêntrica", measurement(event.delta, 3, "UA")],
    [
      "Incerteza na maior aproximação (1σ)",
      measurement(event.closest_approach_uncertainty_km, 3, "km"),
    ],
    ["Elongação solar", measurement(event.sun_elongation, 1, "°")],
    ["Criação da predição", dateInUtc(event.created_at)],
    [
      "Fonte da efeméride",
      [event.bsp_source, event.ephemeris_version].filter(Boolean).join(" "),
    ],
  ];
  const object = [
    ["Número", event.number],
    [
      "Designação provisória",
      event.principal_designation &&
      event.provisional_designation !== event.principal_designation &&
      event.provisional_designation !== event.name
        ? event.provisional_designation
        : null,
    ],
    ["Classe dinâmica (Skybot)", event.dynclass || event.base_dynclass],
    ["Ascensão reta do objeto (ICRF)", event.ra_target],
    ["Declinação do objeto (ICRF)", event.dec_target],
    [
      "Incerteza na ascensão reta (1σ)",
      measurement((event.e_ra_target ?? NaN) * 1000, 2, "mas"),
    ],
    [
      "Incerteza na declinação (1σ)",
      measurement((event.e_dec_target ?? NaN) * 1000, 2, "mas"),
    ],
    ["Magnitude absoluta (H)", measurement(event.h, 3, "mag")],
    ["Magnitude aparente", measurement(event.apparent_magnitude, 3, "mag")],
    ["Diâmetro", measurement(event.diameter, 3, "km")],
    ["Diâmetro aparente", measurement(event.apparent_diameter, 4, "mas")],
    ["Semieixo maior", measurement(event.semimajor_axis, 4, "UA")],
    [
      "Excentricidade",
      Number.isFinite(event.eccentricity)
        ? number(event.eccentricity, 4)
        : null,
    ],
    ["Inclinação", measurement(event.inclination, 4, "°")],
    ["Periélio", measurement(event.perihelion, 4, "UA")],
    ["Afélio", measurement(event.aphelion, 4, "UA")],
  ];
  const star = catalog?.star;
  const catalogName = event.catalog || "Gaia DR3";
  const stellar = [
    ["Catálogo estelar", catalogName],
    ["Identificador Gaia", gaiaId],
    [
      "Ascensão reta (ICRF)",
      measurement(star?.ra, 8, "°") ?? event.ra_star_candidate,
    ],
    [
      "Declinação (ICRF)",
      measurement(star?.dec, 8, "°") ?? event.dec_star_candidate,
    ],
    [
      "Movimento próprio em ascensão reta",
      properMotion(star?.pmra, star?.pmra_error),
    ],
    [
      "Movimento próprio em declinação",
      properMotion(star?.pmdec, star?.pmdec_error),
    ],
    ["Incerteza na ascensão reta", measurement(star?.ra_error, 3, "mas")],
    ["Incerteza na declinação", measurement(star?.dec_error, 3, "mas")],
    ["Magnitude RP (Gaia)", measurement(star?.phot_rp_mean_mag, 3, "mag")],
    ["Magnitude BP (Gaia)", measurement(star?.phot_bp_mean_mag, 3, "mag")],
  ];

  return (
    <>
      <DetailPanel
        title="Circunstâncias da ocultação"
        icon={<CrosshairIcon size={22} weight="duotone" aria-hidden="true" />}
        fields={circumstances}
      />
      <DetailPanel
        title="Objeto ocultante"
        icon={<PlanetIcon size={22} weight="duotone" aria-hidden="true" />}
        fields={object}
      />
      <DetailPanel
        title="Estrela ocultada"
        icon={<StarIcon size={22} weight="duotone" aria-hidden="true" />}
        fields={stellar}
        status={
          !catalog
            ? "Consultando o catálogo Gaia…"
            : !star
              ? "Dados adicionais do catálogo Gaia indisponíveis."
              : null
        }
      />
    </>
  );
}

function measurement(value, digits, unit) {
  return Number.isFinite(value) ? `${number(value, digits)} ${unit}` : null;
}

function properMotion(value, uncertainty) {
  if (!Number.isFinite(value)) return null;
  const error = Number.isFinite(uncertainty)
    ? ` ± ${number(uncertainty, 2)}`
    : "";
  return `${number(value, 2)}${error} mas/ano`;
}

function dateInUtc(value) {
  return value && Number.isFinite(Date.parse(value))
    ? `${utcDate(value)} UTC`
    : null;
}

function DetailPanel({ title, icon, fields, status }) {
  const availableFields = fields.filter(
    ([, value]) => value != null && value !== "",
  );
  return (
    <details className="detail-panel event-detail-panel">
      <summary className="filter-title">
        {icon}
        <h2>{title}</h2>
      </summary>
      {status && (
        <p className="field-hint" role="status">
          {status}
        </p>
      )}
      <dl className="detail-grid">
        {availableFields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {!availableFields.length && (
        <p className="field-hint">Dados indisponíveis.</p>
      )}
    </details>
  );
}

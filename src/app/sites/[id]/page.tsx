"use client";
import Link from "next/link";
import { use, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarBlankIcon,
  ClockIcon,
  CrosshairIcon,
  FunnelSimpleIcon,
  MapPinIcon,
  PencilSimpleIcon,
  BroadcastIcon,
  BinocularsIcon,
} from "@phosphor-icons/react";
import { ShadowDot, ShadowLegend } from "@/components/shadow-dot";
import { tagLabels } from "@/lib/types";
import { Shell } from "@/components/shell";
import { useApp } from "@/components/app-provider";
import { SiteForm } from "@/components/site-form";
import { eventId, number, utcDate, type Event, type Site } from "@/lib/types";
const day = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
export default function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { sites, user, loading, error: siteError } = useApp();
  const site = sites.find((s) => s.id === id);
  const [edit, setEdit] = useState(false);
  return (
    <Shell>
      <Link href="/" className="back-link">
        <ArrowLeftIcon size={17} /> Meus sítios
      </Link>
      {loading ? (
        <div className="empty-state">
          <span className="loader" />
          Carregando sítio…
        </div>
      ) : siteError ? (
        <p className="error" role="alert">
          {siteError}
        </p>
      ) : !site ? (
        <div className="empty-state">
          <MapPinIcon size={35} weight="duotone" />
          <h2>
            {user ? "Sítio não encontrado" : "Acesse sua conta para continuar"}
          </h2>
          <p>
            {user
              ? "Este sítio não está disponível na sua conta."
              : "Seus sítios de observação são privados."}
          </p>
          <Link href={user ? "/" : "/login"} className="button">
            {user ? "Voltar aos sítios" : "Entrar"}
          </Link>
        </div>
      ) : (
        <>
          <div className="section-heading site-heading">
            <div>
              <span className="eyebrow">SEU PONTO DE OBSERVAÇÃO</span>
              <h1>
                {site.name}
                <span className="accent">.</span>
              </h1>
              <p>
                <CrosshairIcon size={16} />
                {number(site.latitude, 5).replace(",", ".")}°, {number(site.longitude, 5).replace(",", ".")}°{" "}
                <span className="separator">/</span>
                <BroadcastIcon size={17} weight="duotone" />{" "}
                {number(site.radiusKm, 0)} km{" "}
                <span className="separator">/</span>
                <BinocularsIcon size={17} weight="duotone" /> Altitude ≥{" "}
                {number(site.minObservationAltitude)}°
              </p>
            </div>
            <button className="button secondary" onClick={() => setEdit(true)}>
              <PencilSimpleIcon size={17} /> Editar sítio
            </button>
          </div>
          <Predictions
            key={`${site.id}-${site.latitude}-${site.longitude}-${site.radiusKm}-${site.minObservationAltitude}`}
            site={site}
          />
          {edit && <SiteForm site={site} onClose={() => setEdit(false)} />}
        </>
      )}
    </Shell>
  );
}
function Predictions({ site }: { site: Site }) {
  const { observations } = useApp();
  const [filters, setFilters] = useState({
    start: day(0),
    end: day(7),
    duration: "0",
    drop: "0",
    maxMagnitude: "",
    night: true,
  });
  const [events, setEvents] = useState<Event[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const [missing, setMissing] = useState(0),
    [queried, setQueried] = useState(false),
    [page, setPage] = useState(1);
  const controller = useRef<AbortController | null>(null);
  async function search(e?: FormEvent) {
    e?.preventDefault();
    controller.current?.abort();
    const requestController = new AbortController();
    controller.current = requestController;
    setBusy(true);
    setError("");
    setEvents([]);
    setMissing(0);
    setQueried(false);
    setPage(1);
    const query = new URLSearchParams({
      latitude: String(site.latitude),
      longitude: String(site.longitude),
      radius: String(site.radiusKm),
      altitude: String(site.minObservationAltitude),
      start: `${filters.start}T00:00:00Z`,
      end: `${filters.end}T23:59:59.999Z`,
      duration: filters.duration,
      drop: filters.drop,
      maxMagnitude: filters.maxMagnitude,
      night: String(filters.night),
    });
    try {
      const response = await fetch(`/api/predictions?${query}`, {
        signal: requestController.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEvents(data.events);
      setMissing(data.missingCoordinates);
      setQueried(true);
    } catch (e) {
      if (!requestController.signal.aborted)
        setError(e instanceof Error ? e.message : "Falha ao buscar predições.");
    } finally {
      if (!requestController.signal.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    search();
    return () => controller.current?.abort();
  }, []); // Initial query is scoped to the site; later changes require Apply.
  return (
    <>
      <section className="filter-panel">
        <div className="filter-title">
          <FunnelSimpleIcon weight="duotone" size={21} />
          <h2>Encontre sua próxima ocultação</h2>
          <span>Filtros de observação</span>
        </div>
        <form onSubmit={search} className="filters">
          <label>
            De (UTC)
            <input
              type="date"
              required
              value={filters.start}
              onChange={(e) =>
                setFilters((f) => ({ ...f, start: e.target.value }))
              }
            />
          </label>
          <label>
            Até (UTC)
            <input
              type="date"
              required
              min={filters.start}
              value={filters.end}
              onChange={(e) =>
                setFilters((f) => ({ ...f, end: e.target.value }))
              }
            />
          </label>
          <label>
            Duração mínima (s)
            <input
              type="number"
              min="0"
              step="0.1"
              required
              value={filters.duration}
              onChange={(e) =>
                setFilters((f) => ({ ...f, duration: e.target.value }))
              }
            />
          </label>
          <label>
            Mag drop mínimo
            <input
              type="number"
              min="0"
              step="0.1"
              required
              value={filters.drop}
              onChange={(e) =>
                setFilters((f) => ({ ...f, drop: e.target.value }))
              }
            />
          </label>
          <label>
            Magnitude máxima da estrela (G)
            <input type="number" step="0.1" placeholder="Sem limite" value={filters.maxMagnitude} onChange={e=>setFilters(f=>({...f,maxMagnitude:e.target.value}))}/>
          </label>
          <button className="button" disabled={busy}>
            <FunnelSimpleIcon size={18} />
            {busy ? "Buscando…" : "Aplicar filtros"}
          </button>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.night}
              onChange={(e) =>
                setFilters((f) => ({ ...f, night: e.target.checked }))
              }
            />{" "}
            Apenas eventos noturnos
          </label>
          <p className="field-hint">
            Período máximo: 93 dias. A altitude é calculada nas coordenadas do
            sítio no instante central do evento. Magnitudes menores indicam estrelas mais brilhantes; vazio significa sem limite.
          </p>
        </form>
      </section>
      <div className="section-heading">
        <div>
          <h2>
            Predições para seu horizonte{" "}
            <span className="count">{busy ? "…" : events.length}</span>
          </h2>
          <p>Horários em UTC · ordem cronológica · fonte: LIneA</p>
        </div>
        <span className="pill">
          <span className="online-dot" /> DADOS REAIS
        </span>
      </div>
      <ShadowLegend />
      {error && (
        <div className="notice error" role="alert">
          <p>{error}</p>
          <button className="button secondary" onClick={() => search()}>
            Tentar novamente
          </button>
        </div>
      )}
      {busy ? (
        <div className="empty-state">
          <span className="loader" />
          <h3>Consultando o céu para este sítio…</h3>
          <p>
            Buscando e verificando as faixas de sombra e a altitude das
            estrelas.
          </p>
        </div>
      ) : !error && !events.length ? (
        <div className="empty-state">
          <BinocularsIcon size={36} weight="duotone" />
          <h3>
            {queried
              ? "Nenhuma predição nestas condições"
              : "Prepare sua busca"}
          </h3>
          <p>
            Amplie o período ou ajuste a duração mínima e a queda de magnitude.
          </p>
        </div>
      ) : (
        events.length > 0 && (
          <div className="event-list">
            {events.slice((page - 1) * 20, page * 20).map((event) => (
              <Link
                className="event-row"
                key={eventId(event)}
                href={`/events/${encodeURIComponent(eventId(event))}?site=${encodeURIComponent(site.id)}`}
              >
                <ShadowDot
                  id={eventId(event)}
                  latitude={site.latitude}
                  longitude={site.longitude}
                />
                <span className="event-orb">
                  <span />
                </span>
                <div className="event-name">
                  <span className="eyebrow">OCULTAÇÃO ESTELAR</span>
                  <h3>{event.name || event.principal_designation}</h3>
                  {observations
                    .filter(
                      (o) =>
                        o.eventId === eventId(event) && o.siteId === site.id,
                    )
                    .map((o) => (
                      <span
                        key={o.id}
                        className={`observation-tag tag-${o.status}`}
                      >
                        {tagLabels[o.status]}
                      </span>
                    ))}
                  <span>
                    <CalendarBlankIcon size={14} weight="duotone" />
                    {utcDate(event.date_time)} UTC
                  </span>
                </div>
                <div className="event-metric">
                  <span>Duração</span>
                  <strong>
                    <ClockIcon size={16} weight="duotone" />
                    {number(event.event_duration)} s
                  </strong>
                </div>
                <div className="event-metric">
                  <span>Mag drop</span>
                  <strong>{number(event.magnitude_drop, 2)} mag</strong>
                </div>
                <div className="event-metric">
                  <span>Altitude</span>
                  <strong>{number(event.observationAltitude)}°</strong>
                </div>
                <ArrowRightIcon className="event-arrow" size={21} />
              </Link>
            ))}
          </div>
        )
      )}
      {missing > 0 && (
        <p className="field-hint">
          {missing} evento(s) sem coordenadas estelares válidas foram excluídos,
          pois não foi possível verificar sua altitude.
        </p>
      )}
      {events.length > 20 && (
        <div className="pagination">
          <button
            className="button secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            {page} de {Math.ceil(events.length / 20)}
          </span>
          <button
            className="button secondary"
            disabled={page * 20 >= events.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </>
  );
}

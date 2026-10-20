"use client";
import { useApp } from "@/components/app-provider";
import { Shell } from "@/components/shell";
import { DeleteSite, SiteForm } from "@/components/site-form";
import { SkyArt } from "@/components/sky-art";
import { number } from "@/lib/format";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BinocularsIcon,
  BroadcastIcon,
  CrosshairIcon,
  FunnelSimpleIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSimpleIcon,
  PlusIcon,
  StarFourIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
export default function HomePage() {
  const { sites, user, loading, error, configured } = useApp();
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState("recent");
  const [form, setForm] = useState(null),
    [deleting, setDeleting] = useState(null);
  const filtered = sites
    .filter((s) =>
      s.name
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "pt-BR") : 0,
    );
  return (
    <Shell>
      <div className="page-heading">
        <div className="eyebrow">
          <span className="online-dot" /> SEU CÉU, SUAS DESCOBERTAS
        </div>
        <h1>
          Meus sítios<span className="accent">.</span>
        </h1>
        <p>Todo grande registro começa com um bom lugar para observar.</p>
      </div>
      <section className="hero">
        <SkyArt />
        <div className="hero-copy">
          <span className="pill">
            <StarFourIcon size={14} weight="duotone" /> OCULTAÇÕES ESTELARES
          </span>
          <h2>
            O céu tem hora
            <br />e lugar para surpreender.
          </h2>
          <p>
            Seus pontos de observação, conectados às próximas
            <br className="desktop-break" /> passagens de uma sombra. Prepare-se
            para o instante.
          </p>
          <a href="#sites" className="hero-link">
            Encontre sua próxima observação <ArrowRightIcon size={17} />
          </a>
        </div>
        <span className="hero-coordinate">
          α 19ʰ 42ᵐ · δ −25° 18′ <span>EXPLORAR É OLHAR MAIS LONGE</span>
        </span>
      </section>
      <div className="stats-grid">
        <div className="stat">
          <span className="tile-icon">
            <MapPinIcon weight="duotone" size={23} />
          </span>
          <div>
            <span>Sítios de observação</span>
            <strong>
              {loading ? "—" : String(sites.length).padStart(2, "0")}
              <small>cadastrados na sua conta</small>
            </strong>
          </div>
        </div>
        <div className="stat">
          <span className="tile-icon green">
            <BroadcastIcon weight="duotone" size={24} />
          </span>
          <div>
            <span>Seu horizonte de busca</span>
            <strong>
              {sites.length
                ? number(Math.max(...sites.map((s) => s.radiusKm)), 0)
                : "—"}
              <small>km de raio máximo</small>
            </strong>
          </div>
        </div>
        <div className="stat">
          <span className="tile-icon amber">
            <GlobeHemisphereWestIcon weight="duotone" size={24} />
          </span>
          <div>
            <span>Uma rede de possibilidades</span>
            <strong className="stat-text">
              O céu conecta<small>Predições do LIneA Solar System</small>
            </strong>
          </div>
        </div>
      </div>
      <section id="sites" className="sites-section">
        <div className="section-heading">
          <div>
            <h2>
              Seus pontos no mapa <span className="count">{sites.length}</span>
            </h2>
            <p>Escolha um sítio para explorar as predições da sua região.</p>
          </div>
          {user ? (
            <button className="button" onClick={() => setForm("new")}>
              <PlusIcon size={18} /> Novo sítio
            </button>
          ) : (
            <Link className="button" href="/login">
              <PlusIcon size={18} />{" "}
              {configured ? "Cadastrar meu sítio" : "Começar a observar"}
            </Link>
          )}
        </div>
        <div className="toolbar">
          <div className="search-input">
            <MagnifyingGlassIcon size={19} />
            <input
              aria-label="Buscar sítios"
              placeholder="Buscar um sítio de observação…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="sort-control">
            <FunnelSimpleIcon size={18} weight="duotone" />
            <select
              aria-label="Ordenar sítios"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Atualizados recentemente</option>
              <option value="name">Nome: A–Z</option>
            </select>
          </label>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <div className="empty-state">
            <span className="loader" />
            <h3>Localizando seus sítios…</h3>
          </div>
        ) : filtered.length ? (
          <div className="site-grid">
            {filtered.map((site, index) => (
              <article className="site-card" key={site.id}>
                <div className={`site-map map-${index % 3}`}>
                  <div className="map-lines" />
                  <span className="map-point">
                    <MapPinIcon size={31} weight="duotone" />
                  </span>
                  <span className="map-tag">
                    <span className="online-dot" /> SÍTIO DE OBSERVAÇÃO
                  </span>
                  <div className="card-actions">
                    <button
                      aria-label={`Editar ${site.name}`}
                      onClick={() => setForm(site)}
                    >
                      <PencilSimpleIcon size={17} />
                    </button>
                    <button
                      aria-label={`Excluir ${site.name}`}
                      onClick={() => setDeleting(site)}
                    >
                      <TrashIcon size={17} />
                    </button>
                  </div>
                </div>
                <div className="site-card-body">
                  <h3>{site.name}</h3>
                  <p className="coordinates">
                    <CrosshairIcon size={15} />
                    {number(site.latitude, 4)}°, {number(site.longitude, 4)}°
                  </p>
                  <div className="site-specs">
                    <span>
                      <BroadcastIcon size={17} weight="duotone" />
                      {number(site.radiusKm, 0)} km de raio
                    </span>
                    <span>
                      <BinocularsIcon size={17} weight="duotone" />≥{" "}
                      {number(site.minObservationAltitude, 0)}° de altitude
                    </span>
                  </div>
                  <Link href={`/sites/${site.id}`} className="card-link">
                    Explorar predições <ArrowRightIcon size={18} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-orbit">
              <MapPinIcon size={32} weight="duotone" />
            </div>
            <span className="eyebrow">
              {search ? "NENHUM RESULTADO" : "SEU PRÓXIMO REGISTRO COMEÇA AQUI"}
            </span>
            <h3>
              {search
                ? "Nenhum sítio com esse nome"
                : user
                  ? "Dê um lugar às suas descobertas"
                  : "Um lugar seu. Um universo de possibilidades."}
            </h3>
            <p>
              {search
                ? "Tente outro nome ou limpe a busca."
                : user
                  ? "Cadastre seu primeiro sítio e descubra quais sombras vão cruzar o seu horizonte."
                  : "Entre na sua conta para reunir seus sítios e encontrar predições para o seu horizonte."}
            </p>
            {search ? (
              <button
                className="button secondary"
                onClick={() => setSearch("")}
              >
                Limpar busca
              </button>
            ) : user ? (
              <button
                className="button secondary"
                onClick={() => setForm("new")}
              >
                <PlusIcon size={17} />
                Adicionar primeiro sítio
              </button>
            ) : (
              <Link className="button secondary" href="/login">
                Acessar minha conta <ArrowRightIcon size={17} />
              </Link>
            )}
            {!configured && (
              <span className="setup-note">
                Ambiente inicial · configure o Firebase para conectar sua conta.
              </span>
            )}
          </div>
        )}
      </section>
      <div className="bottom-note">
        <span className="tile-icon">
          <BinocularsIcon size={24} weight="duotone" />
        </span>
        <div>
          <h3>O próximo instante pode fazer história.</h3>
          <p>
            Uma ocultação dura poucos segundos. O conhecimento que ela produz
            permanece.
          </p>
        </div>
        <Link href="/guide">
          Prepare sua observação <ArrowUpRightIcon />
        </Link>
      </div>
      {form && (
        <SiteForm
          site={form === "new" ? undefined : form}
          onClose={() => setForm(null)}
        />
      )}{" "}
      {deleting && (
        <DeleteSite site={deleting} onClose={() => setDeleting(null)} />
      )}
    </Shell>
  );
}

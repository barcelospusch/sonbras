"use client";

import { useApp } from "@/components/app-provider";
import { SiteCard } from "@/components/site-card";
import { Shell } from "@/components/shell";
import { DeleteSite, SiteForm } from "@/components/site-form";
import { SkyArt } from "@/components/sky-art";
import {
  ArrowRightIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

const compareNames = (a, b) => a.name.localeCompare(b.name, "pt-BR");
const normalizeSearch = (value) =>
  value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");

function resultCount(results, total) {
  return results === total ? total : `${results} de ${total}`;
}

function filterSites(sites, search) {
  const term = normalizeSearch(search);
  return sites.filter((site) => normalizeSearch(site.name).includes(term));
}

function SiteSearch({ label, value, onChange }) {
  return (
    <label className="home-site-search">
      <span>{label}</span>
      <span className="home-search-field">
        <MagnifyingGlassIcon size={18} aria-hidden="true" />
        <input type="search" placeholder="Nome do sítio" value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function SiteSection({ id, title, detail, icon: Icon, count, action, children }) {
  return (
    <section className="home-sites-section" id={id} aria-labelledby={`${id}-heading`} tabIndex={-1}>
      <header className="home-sites-heading">
        <span className="home-sites-icon"><Icon size={24} weight="duotone" aria-hidden="true" /></span>
        <div>
          <h2 id={`${id}-heading`}>
            {title}
            {count != null && <span className="home-sites-count" aria-live="polite">{count}</span>}
          </h2>
          <p>{detail}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function SiteList({ sites, isDefault = false, onEdit, onDelete }) {
  return (
    <ul className="home-site-list">
      {sites.map((site) => (
        <li key={site.id}>
          <SiteCard
            site={site}
            href={`${isDefault ? "/sites/default" : "/sites"}/${encodeURIComponent(site.id)}`}
            onEdit={onEdit && (() => onEdit(site))}
            onDelete={onDelete && (() => onDelete(site))}
          />
        </li>
      ))}
    </ul>
  );
}

function SiteEmptyState({ title, detail, action }) {
  return (
    <div className="home-sites-empty">
      <h3>{title}</h3>
      {detail && <p>{detail}</p>}
      {action}
    </div>
  );
}

export default function HomePage() {
  const { sites, user, profile, loading, error, defaultSites, defaultSitesLoading, defaultSitesError } = useApp();
  const isAdmin = Boolean(user && profile.isAdmin === true);
  const [search, setSearch] = useState("");
  const [defaultSearch, setDefaultSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const personalResults = filterSites(sites, search);
  if (sort === "name") personalResults.sort(compareNames);
  const defaultResults = filterSites(defaultSites, defaultSearch).sort(compareNames);

  const personalSection = (
    <SiteSection
      id="sites"
      title="Meus sítios"
      detail="Seus locais de observação e as predições para cada região."
      icon={MapPinIcon}
      count={user && !loading && !error ? resultCount(personalResults.length, sites.length) : null}
      action={user && (
        <button type="button" className="button" onClick={() => setForm({})}>
          <PlusIcon size={18} aria-hidden="true" /> Novo sítio
        </button>
      )}
    >
      {loading ? (
        <p className="home-sites-empty" role="status">Carregando seus sítios…</p>
      ) : error ? (
        <p className="error" role="alert">{error}</p>
      ) : !user ? (
        <SiteEmptyState
          title="Cadastre seus locais de observação"
          detail="Entre na sua conta para salvar sítios e consultar predições para suas coordenadas."
          action={<Link className="button secondary" href="/login">Entrar na minha conta</Link>}
        />
      ) : !sites.length ? (
        <SiteEmptyState title="Você ainda não cadastrou sítios" detail="Use Novo sítio para informar as coordenadas do seu primeiro local de observação." />
      ) : (
        <>
          <div className="home-site-tools">
            <SiteSearch label="Buscar nos meus sítios" value={search} onChange={setSearch} />
            <label className="home-site-sort">
              Ordenar por
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="recent">Mais recentes</option>
                <option value="name">Nome (A–Z)</option>
              </select>
            </label>
          </div>
          {personalResults.length ? (
            <SiteList sites={personalResults} onEdit={(site) => setForm({ site })} onDelete={(site) => setDeleting({ site })} />
          ) : (
            <SiteEmptyState
              title="Nenhum sítio encontrado"
              action={<button type="button" className="button secondary" onClick={() => setSearch("")}>Limpar busca</button>}
            />
          )}
        </>
      )}
    </SiteSection>
  );

  const defaultSection = (
    <SiteSection
      id="default-sites"
      title="Sítios padrão"
      detail="Locais de referência com predições disponíveis sem uma conta."
      icon={GlobeHemisphereWestIcon}
      count={!defaultSitesLoading && !defaultSitesError ? resultCount(defaultResults.length, defaultSites.length) : null}
      action={isAdmin && (
        <button type="button" className="button" onClick={() => setForm({ isDefault: true })}>
          <PlusIcon size={18} aria-hidden="true" /> Novo sítio padrão
        </button>
      )}
    >
      {defaultSitesLoading ? (
        <p className="home-sites-empty" role="status">Carregando sítios padrão…</p>
      ) : defaultSitesError ? (
        <p className="error" role="alert">{defaultSitesError}</p>
      ) : !defaultSites.length ? (
        <SiteEmptyState title="Nenhum sítio padrão disponível" />
      ) : (
        <>
          <div className="home-site-tools">
            <SiteSearch label="Buscar nos sítios padrão" value={defaultSearch} onChange={setDefaultSearch} />
          </div>
          {defaultResults.length ? (
            <SiteList
              sites={defaultResults}
              isDefault
              onEdit={isAdmin ? (site) => setForm({ site, isDefault: true }) : undefined}
              onDelete={isAdmin ? (site) => setDeleting({ site, isDefault: true }) : undefined}
            />
          ) : (
            <SiteEmptyState
              title="Nenhum sítio padrão encontrado"
              action={<button type="button" className="button secondary" onClick={() => setDefaultSearch("")}>Limpar busca</button>}
            />
          )}
        </>
      )}
    </SiteSection>
  );

  return (
    <Shell>
      <div className="home-page">
        <header className="hero home-hero">
          <SkyArt />
          <div className="hero-copy">
            <h1>Sítios de observação</h1>
            <p>Encontre predições de ocultações estelares para um local de referência ou para os sítios da sua conta.</p>
            <nav className="home-hero-actions" aria-label="Listas de sítios">
              <a className="button" href={user ? "#sites" : "#default-sites"}>
                {user ? "Meus sítios" : "Sítios padrão"} <ArrowRightIcon size={18} aria-hidden="true" />
              </a>
              <a className="button secondary" href={user ? "#default-sites" : "#sites"}>
                {user ? "Sítios padrão" : "Meus sítios"}
              </a>
            </nav>
          </div>
        </header>
        {user ? <>{personalSection}{defaultSection}</> : <>{defaultSection}{personalSection}</>}
        <Link className="home-guide-link" href="/guide">
          Guia de observação <ArrowRightIcon size={17} aria-hidden="true" />
        </Link>
      </div>
      {form && (
        <SiteForm site={form.site} isDefault={form.isDefault} onClose={() => setForm(null)} />
      )}
      {deleting && (
        <DeleteSite site={deleting.site} isDefault={deleting.isDefault} onClose={() => setDeleting(null)} />
      )}
    </Shell>
  );
}

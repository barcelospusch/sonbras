import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { number } from "@/lib/format";

export function SiteCard({ site, href, onEdit, onDelete }) {
  return (
    <article className="site-card compact-site-card">
      <div className="compact-site-heading">
        <span className="tile-icon"><MapPinIcon size={20} weight="duotone" /></span>
        <h3>{href ? <Link href={href}>{site.name}</Link> : site.name}</h3>
        {onEdit && (
          <button type="button" className="icon-button" aria-label={`Editar ${site.name}`} onClick={onEdit}>
            <PencilSimpleIcon size={17} />
          </button>
        )}
        {onDelete && (
          <button type="button" className="icon-button" aria-label={`Excluir ${site.name}`} onClick={onDelete}>
            <TrashIcon size={17} />
          </button>
        )}
      </div>
      <p>{number(site.latitude, 4)}°, {number(site.longitude, 4)}°</p>
      <p>{number(site.radiusKm, 0)} km de raio · Altitude ≥ {number(site.minObservationAltitude)}°</p>
      {href && (
        <Link href={href} className="card-link">
          Explorar predições <ArrowRightIcon size={17} />
        </Link>
      )}
    </article>
  );
}

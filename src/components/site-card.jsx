import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { number } from "@/lib/format";

export function SiteCard({ site, href, onEdit, onDelete }) {
  return (
    <article className="home-site-card">
      <div className="home-site-card-heading">
        <MapPinIcon size={20} weight="duotone" aria-hidden="true" />
        <h3>{site.name}</h3>
        {onEdit && (
          <button type="button" className="icon-button" aria-label={`Editar ${site.name}`} title="Editar sítio" onClick={onEdit}>
            <PencilSimpleIcon size={17} aria-hidden="true" />
          </button>
        )}
        {onDelete && (
          <button type="button" className="icon-button home-site-delete" aria-label={`Excluir ${site.name}`} title="Excluir sítio" onClick={onDelete}>
            <TrashIcon size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <dl className="home-site-details">
        <div className="home-site-coordinates">
          <dt>Latitude, longitude</dt>
          <dd>{number(site.latitude, 4)}°, {number(site.longitude, 4)}°</dd>
        </div>
        <div>
          <dt>Raio de busca</dt>
          <dd>{number(site.radiusKm, 0)} km</dd>
        </div>
        <div>
          <dt>Altitude mínima</dt>
          <dd>{number(site.minObservationAltitude)}°</dd>
        </div>
      </dl>
      <Link href={href} className="home-site-link" aria-label={`Ver predições para ${site.name}`}>
        Ver predições <ArrowRightIcon size={18} aria-hidden="true" />
      </Link>
    </article>
  );
}

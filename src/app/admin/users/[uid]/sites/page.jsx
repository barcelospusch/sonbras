"use client";
import Link from "next/link";
import { AngleIcon, ArrowLeftIcon, BroadcastIcon, CrosshairIcon, MapPinIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { use, useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { AdminArea, AdminHeading } from "@/components/admin-area";
import { DeleteSite, SiteForm } from "@/components/site-form";
import { sitesRef, userRef } from "@/lib/firebase";
import { number } from "@/lib/format";

export default function AdminUserSitesPage({ params }) {
  const { uid } = use(params);
  return <AdminArea><UserSites key={uid} uid={uid} /></AdminArea>;
}

function UserSites({ uid }) {
  const [owner, setOwner] = useState(null);
  const [sites, setSites] = useState(null);
  const [edit, setEdit] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const fail = () => setError("Não foi possível consultar os sítios do usuário.");
    const stopOwner = onSnapshot(userRef(uid), (snapshot) => {
      if (snapshot.exists()) setOwner(snapshot.data());
      else setError("Usuário não encontrado.");
    }, fail);
    const stopSites = onSnapshot(sitesRef(uid), (snapshot) => {
      setSites(snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id })));
    }, fail);
    return () => {
      stopOwner();
      stopSites();
    };
  }, [uid]);

  return (
    <>
      <Link href={`/admin/users/${encodeURIComponent(uid)}`} className="back-link"><ArrowLeftIcon size={16} aria-hidden="true" /> Configurações do usuário</Link>
      <AdminHeading icon={MapPinIcon} title="Sítios cadastrados" description={owner && (owner.displayName || owner.email || uid)} />
      {error ? <p className="error" role="alert">{error}</p> : !sites || !owner ? (
        <p role="status">Carregando sítios…</p>
      ) : sites.length ? (
        <ul className="admin-site-grid">
          {sites.map((site) => (
            <li className="admin-site-card" key={site.id}>
              <div className="admin-site-title">
                <span className="admin-row-icon"><MapPinIcon size={20} weight="duotone" aria-hidden="true" /></span>
                <h2>{site.name}</h2>
              </div>
              <dl className="admin-site-details">
                <div><dt><CrosshairIcon size={17} aria-hidden="true" /> Coordenadas</dt><dd>{number(site.latitude, 4)}°, {number(site.longitude, 4)}°</dd></div>
                <div><dt><BroadcastIcon size={17} aria-hidden="true" /> Raio de busca</dt><dd>{number(site.radiusKm)} km</dd></div>
                <div><dt><AngleIcon size={17} aria-hidden="true" /> Altitude mínima</dt><dd>{number(site.minObservationAltitude)}°</dd></div>
              </dl>
              <div className="admin-actions">
                <button type="button" className="button secondary" onClick={() => setEdit(site)}><PencilSimpleIcon size={17} aria-hidden="true" /> Editar sítio</button>
                <button type="button" className="icon-button admin-delete" aria-label={`Excluir ${site.name}`} title="Excluir sítio" onClick={() => setDeleting(site)}><TrashIcon size={19} aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <div className="admin-empty"><MapPinIcon size={30} aria-hidden="true" /><p>Este usuário ainda não cadastrou sítios.</p></div>}
      {deleting && !error && <DeleteSite site={deleting} ownerUid={uid} onClose={() => setDeleting(null)} />}
      {edit && !error && <SiteForm site={edit} ownerUid={uid} onClose={() => setEdit(null)} />}
    </>
  );
}

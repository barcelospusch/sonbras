"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { AdminArea } from "@/components/admin-area";
import { SiteCard } from "@/components/site-card";
import { DeleteSite, SiteForm } from "@/components/site-form";
import { sitesRef, userRef } from "@/lib/firebase";

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
      <Link href={`/admin/users/${encodeURIComponent(uid)}`} className="back-link">Voltar às configurações</Link>
      <div className="page-heading">
        <h1>Sítios cadastrados</h1>
        {owner && <p>{owner.displayName || owner.email || uid}</p>}
      </div>
      {error ? <p className="error" role="alert">{error}</p> : !sites || !owner ? (
        <p role="status">Carregando sítios…</p>
      ) : sites.length ? (
        <div className="site-grid">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onEdit={() => setEdit(site)}
              onDelete={() => setDeleting(site)}
            />
          ))}
        </div>
      ) : <p>Este usuário ainda não cadastrou sítios.</p>}
      {deleting && !error && <DeleteSite site={deleting} ownerUid={uid} onClose={() => setDeleting(null)} />}
      {edit && !error && <SiteForm site={edit} ownerUid={uid} onClose={() => setEdit(null)} />}
    </>
  );
}

"use client";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, GearSixIcon, MapPinIcon, ShieldCheckIcon, UserIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { documentId, getDocsFromServer, limit, orderBy, query, startAfter } from "firebase/firestore";
import { usersRef } from "@/lib/firebase";
import { AdminArea, AdminHeading } from "@/components/admin-area";

const pageSize = 25;

export default function AdminPage() {
  return <AdminArea><UserDirectory /></AdminArea>;
}

function UserDirectory() {
  const [cursors, setCursors] = useState([null]);
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const cursor = cursors.at(-1);

  useEffect(() => {
    const constraints = cursor ? [startAfter(cursor)] : [];
    let active = true;
    getDocsFromServer(query(usersRef(), orderBy(documentId()), ...constraints, limit(pageSize + 1)))
      .then((snapshot) => {
        if (active) setEntries(snapshot.docs);
      })
      .catch((failure) => {
        if (!active) return;
        setError(
          failure.code === "permission-denied"
            ? "O Firestore negou a listagem. Confirme que as regras atuais foram publicadas neste projeto e que sua conta tem isAdmin: true."
            : "Não foi possível listar os usuários. Verifique sua conexão e tente novamente.",
        );
      });
    return () => {
      active = false;
    };
  }, [cursor, attempt]);

  function changePage(next) {
    setEntries(null);
    setError("");
    setCursors(next);
  }

  return (
    <>
      <AdminHeading icon={UsersThreeIcon} title="Usuários" description="Gerencie perfis, permissões e sítios de observação." />
      {error ? (
        <div className="error">
          <p role="alert">{error}</p>
          <button className="button secondary" onClick={() => {
            setError("");
            setAttempt((value) => value + 1);
          }}>
            Tentar novamente
          </button>
        </div>
      ) : !entries ? (
        <p role="status">Carregando usuários…</p>
      ) : (
        <>
          {entries.length ? (
            <ul className="admin-users">
              {entries.slice(0, pageSize).map((entry) => {
                const profile = entry.data();
                const href = `/admin/users/${encodeURIComponent(entry.id)}`;
                const name = profile.displayName || profile.email || entry.id;
                return (
                  <li key={entry.id}>
                    <span className="admin-row-icon"><UserIcon size={20} weight="duotone" aria-hidden="true" /></span>
                    <div className="admin-user-identity">
                      <h2><Link href={href}>{name}</Link></h2>
                      {profile.email && profile.email !== name && <p>{profile.email}</p>}
                    </div>
                    {profile.isAdmin === true && (
                      <span className="pill admin-role"><ShieldCheckIcon size={15} weight="duotone" aria-hidden="true" /> Administrador</span>
                    )}
                    <div className="admin-actions">
                      <Link className="button secondary" href={href} aria-label={`Configurações de ${name}`}><GearSixIcon size={17} aria-hidden="true" /> Configurações</Link>
                      <Link className="button secondary" href={`${href}/sites`} aria-label={`Sítios de ${name}`}><MapPinIcon size={17} aria-hidden="true" /> Sítios</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <div className="admin-empty"><UsersThreeIcon size={30} aria-hidden="true" /><p>Nenhum usuário nesta página.</p></div>}
          {(entries.length > pageSize || cursors.length > 1) && (
            <nav className="admin-pagination" aria-label="Páginas de usuários">
              <button type="button" className="button secondary" disabled={cursors.length === 1} onClick={() => changePage(cursors.slice(0, -1))}><ArrowLeftIcon size={16} aria-hidden="true" /> Anterior</button>
              <span>Página {cursors.length}</span>
              <button type="button" className="button secondary" disabled={entries.length <= pageSize} onClick={() => changePage([...cursors, entries[pageSize - 1].id])}>Próxima <ArrowRightIcon size={16} aria-hidden="true" /></button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
